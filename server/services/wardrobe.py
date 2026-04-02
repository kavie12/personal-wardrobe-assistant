import io
import base64
import uuid
from PIL import Image, ImageFile
from config.groq_client import client as groq_client
from cachetools import TTLCache
from config.firebase import db
from models.ClothingItem import ClothingItem
from google.cloud.firestore_v1.base_query import FieldFilter
from typing import Union, List, Literal
from pydantic import BaseModel
from fastapi import HTTPException

class ClassificationResponse(BaseModel):
    category: Literal["Topwear", "Bottomwear", "One-piece", "Footwear"]
    type: Literal["T-shirt", "Shirt", "Polo shirt", "Hoodie", "Sweater", "Jacket", "Blazer", "Coat", "Jeans", "Trousers", "Shorts",
                    "Skirt", "Leggings","Joggers", "Dress", "Jumpsuit", "Romper", "Suit", "Sneakers", "Casual shoes",
                    "Formal shoes", "Sandals", "Flip-flops", "Boots", "Heels"]
    colors: List[Literal["Black", "White", "Gray", "Blue", "Red", "Green", "Yellow", "Brown", "Beige", "Pink", "Purple", "Orange"]]
    occasions: List[Literal["Casual", "Smart casual", "Formal", "Sportswear", "Party", "Work"]]
    temperatures: List[Literal["Hot", "Mild", "Cold"]]

cached_images = TTLCache(maxsize=100, ttl=300)
collection_ref = db.collection("clothing_items")

async def add(image_bytes: bytes) -> str:
    # Create clothing item object
    clothing_item = ClothingItem(image_bytes)

    # Open image
    img = Image.open(io.BytesIO(clothing_item.image))

    # Compress image
    compressed_image_base64 = _compresss_to_base64(img)

    # Get classified labels
    labels = _get_classified_labels(compressed_image_base64)

    # Update clothing item object
    clothing_item.update_id(str(uuid.uuid4()))
    clothing_item.update_labels(labels.category, labels.type, labels.colors, labels.occasions, labels.temperatures)

    # Cache image until it is saved in the db or discarded
    cached_images[clothing_item.id] = clothing_item.image
    
    # Return the results
    return {
        "id": clothing_item.id,
        **clothing_item.get_labels()
    }

def _compresss_to_base64(img: ImageFile) -> str:
    # Resize and convert to RGB
    img.thumbnail((256, 256))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Compress to JPEG and convert to Base64
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=70)
    compressed_image_bytes = buffer.getvalue()
    return base64.b64encode(compressed_image_bytes).decode("utf-8")

def _get_classified_labels(image_base64) -> ClassificationResponse:
    # Call Groq API
    response = groq_client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "system",
                "content": "You are a professional clothing classifier. Classify each clothing item into category, type, color(s), occasion(s), and temperature(s) suitability."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Classify this clothing item"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
            }
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "classification_response",
                "schema": ClassificationResponse.model_json_schema()
            }
        }
    )

    return ClassificationResponse.model_validate_json(response.choices[0].message.content)

def save_in_db(item_id: str, user_id: str, labels: dict[str, Union[str, List[str]]]) -> bool:
    try:
        image_bytes = cached_images[item_id]
        collection_ref.add({
            "user_id": user_id,
            "category": labels.get("category"),
            "type": labels.get("type"),
            "colors": labels.get("colors"),
            "occasions": labels.get("occasions"),
            "temperatures": labels.get("temperatures"),
            "image": image_bytes
        }, item_id)
        return True
    except:
        return False
    
def list(user_id: str, page: int = 1, size: int = 10):
    try:
        docs = collection_ref.where(filter=FieldFilter("user_id", "==", user_id)).limit(size).offset((page - 1) * size).get()
        num = collection_ref.where(filter=FieldFilter("user_id", "==", user_id)).count().get()[0][0].value
        items = [_convert_docs(doc) for doc in docs]
        return {
            "dataList": items,
            "dataCount": num
        }
    except Exception as e:
        print("Exception: " + str(e))
        return []


def _convert_docs(doc):
    data = doc.to_dict()
    
    return ClothingItem(
        id=doc.id,
        image=data.get("image"),
        category=data.get("category"), 
        type=data.get("type"), 
        colors=data.get("colors"), 
        occasions=data.get("occasions"), 
        temperatures=data.get("temperatures")
    ).get()

def update(item_id: str, user_id: str, labels: dict[str, Union[str, List[str]]]) -> bool:
    doc_ref = collection_ref.document(item_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Item not found")
    if doc.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this item")

    doc_ref.update({
        "category": labels.get("category"),
        "type": labels.get("type"),
        "colors": labels.get("colors"),
        "occasions": labels.get("occasions"),
        "temperatures": labels.get("temperatures")
    })
    return True

def delete(item_id: str, user_id: str) -> bool:
    doc_ref = collection_ref.document(item_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Item not found")
    if doc.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")

    doc_ref.delete()
    return True