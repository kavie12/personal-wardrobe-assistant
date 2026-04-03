from config.groq_client import client as groq_client
from services.wardrobe import collection_ref as wardrobe_ref
from google.cloud.firestore_v1.base_query import FieldFilter
from typing import List, Dict, Any, Optional
from config.firebase import db
import base64
import uuid
import json
import random

llm_model_id = "llama-3.3-70b-versatile"

async def get_recommendation(
    user_id: str,
    weather_data: Dict[str, Any],
    context: str,
) -> Dict[str, Any]:
    """
    Get an outfit recommendation based on weather and context.
    Context can be anything — an occasion ("Casual", "Formal"),
    a schedule event ("Team meeting at 3pm"), or any other descriptor.
    """
    print(
        f"Getting recommendation for user {user_id} | "
        f"{weather_data.get('temperature')}°C {weather_data.get('description')} | "
        f"context: {context}"
    )

    wardrobe_result = await get_wardrobe_data(user_id)

    if not wardrobe_result:
        return {"error": "Wardrobe is empty. Add some clothes first!"}

    return await _build_recommendation(
        filtered_items=wardrobe_result,
        weather_data=weather_data,
        context=context
    )

async def _build_recommendation(
    filtered_items: List[Dict[str, Any]],
    weather_data: Dict[str, Any],
    context: str
) -> Dict[str, Any]:
    item_lookup = {item["id"]: item for item in filtered_items}
    minified_menu = get_minified_menu(filtered_items)

    suggestion = await get_llm_suggestion(minified_menu, weather_data, context)

    suggested_ids = [
        suggestion.get("topwear_id"),
        suggestion.get("bottomwear_id"),
        suggestion.get("footwear_id"),
        suggestion.get("outerwear_id"),
    ]
    images_map = await get_wardrobe_items_images(suggested_ids)

    def assemble_item(item_id: Optional[str]) -> Optional[Dict[str, Any]]:
        if not item_id:
            return None
        item_info = item_lookup.get(item_id)
        if item_info:
            item_info["image"] = images_map.get(item_id)
        return item_info

    res = {
        "id": str(uuid.uuid4()),
        "outfit": {
            "topwear": assemble_item(suggestion.get("topwear_id")),
            "bottomwear": assemble_item(suggestion.get("bottomwear_id")),
            "footwear": assemble_item(suggestion.get("footwear_id")),
            "outerwear": assemble_item(suggestion.get("outerwear_id")),
        },
        "reason": suggestion["reason"],
    }

    return res

async def get_wardrobe_data(user_id: str) -> List[Dict[str, Any]]:
    try:
        docs = wardrobe_ref.where(filter=FieldFilter("user_id", "==", user_id)).select(
            ["category", "type", "colors", "occasions", "temperatures"]
        ).get()
        return [convert_docs_wardrobe(doc) for doc in docs]
    except Exception as e:
        print(f"Error fetching wardrobe for user {user_id}: {e}")
        return []

def convert_docs_wardrobe(doc) -> Dict[str, Any]:
    data = doc.to_dict()
    return {
        "id": doc.id,
        "category": data.get("category"),
        "type": data.get("type"),
        "colors": data.get("colors", []),
        "occasions": data.get("occasions", []),
        "temperatures": data.get("temperatures", [])
    }

async def get_wardrobe_items_images(item_ids: List[str]) -> Dict[str, str]:
    try:
        valid_ids = [i for i in item_ids if i]
        if not valid_ids:
            return {}
        doc_refs = [wardrobe_ref.document(i) for i in valid_ids]
        docs = db.get_all(doc_refs, field_paths=["image"])
        images_map = {}
        for doc in docs:
            if doc.exists:
                img_bytes = doc.to_dict().get("image")
                if img_bytes:
                    images_map[doc.id] = base64.b64encode(img_bytes).decode("utf-8")
        return images_map
    except Exception as e:
        print(f"Error fetching images: {e}")
        return {}

def get_minified_menu(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    shuffled = random.sample(items, len(items))
    return [
        {
            "id": item["id"],
            "cat": item["category"],
            "type": item["type"],
            "colors": item["colors"],
            "occasions": item["occasions"],
            "temps": item["temperatures"]
        }
        for item in shuffled
    ]

async def get_llm_suggestion(
    minified_menu: List[Dict[str, Any]],
    weather_data: Dict[str, Any],
    context: str,
):
    response = groq_client.chat.completions.create(
        model=llm_model_id,
        messages=[
            {
                "role": "system",
                "content": """You are a professional fashion stylist AI.
Your task:
1. Select exactly ONE item from each category: topwear, bottomwear, footwear; If temperature is below 15°C, you MUST select ONE outerwear item. If temperature is 15°C or above, set outerwear_id to null.
2. Ensure colors coordinate well and match the outfit to the context — consider formality, time of day, occasion type, color preferences, or any other cues present in the context
3. Provide a short, compelling reason (1 sentence)
Return only a JSON object with this structure:
{
    "topwear_id": string,
    "bottomwear_id": string,
    "footwear_id": string,
    "outerwear_id": string | null,
    "reason": string
}"""
            },
            {
                "role": "user",
                "content": f"""Weather: {weather_data.get("description")}, {weather_data.get("temperature")}°C
Context: {context}

Available Wardrobe:
{minified_menu}
"""
            }
        ],
        response_format={"type": "json_object"},
        temperature=1.1,
        max_tokens=500,
    )
    return json.loads(response.choices[0].message.content)