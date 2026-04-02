from config.firebase import db
from google.cloud.firestore_v1.base_query import FieldFilter
from datetime import datetime
from typing import Dict, Any
from services.wardrobe import collection_ref as clothing_ref
from models.ClothingItem import ClothingItem
from fastapi import HTTPException

collection_ref = db.collection("outfits")

def save(user_id: str, items: Dict[str, Any], occasion: str) -> bool:
    try:
        # We store the IDs and the current timestamp
        collection_ref.add({
            "user_id": user_id,
            "topwear_id": items.get("topwear_id"),
            "bottomwear_id": items.get("bottomwear_id"),
            "footwear_id": items.get("footwear_id"),
            "outerwear_id": items.get("outerwear_id"), # Can be None
            "occasion": occasion,
            "created_at": datetime.now()
        })
        return True
    except Exception as e:
        print(f"Error saving outfit: {e}")
        return False
    
def list_outfits(user_id: str, page: int = 1, size: int = 10):
    try:
        # 1. Fetch the Outfit metadata records
        query = collection_ref.where(filter=FieldFilter("user_id", "==", user_id))\
                              .order_by("created_at", direction="DESCENDING")\
                              .limit(size)\
                              .offset((page - 1) * size)
        
        outfit_docs = query.get()
        total_count = collection_ref.where(filter=FieldFilter("user_id", "==", user_id)).count().get()[0][0].value

        if not outfit_docs:
            return {"dataList": [], "dataCount": 0}

        # 2. Collect ALL unique clothing item IDs needed for this page
        all_item_ids = set()
        outfits_raw = []
        for doc in outfit_docs:
            data = doc.to_dict()
            data["id"] = doc.id
            outfits_raw.append(data)
            # Add valid IDs to our set
            for key in ["topwear_id", "bottomwear_id", "footwear_id", "outerwear_id"]:
                if data.get(key):
                    all_item_ids.add(data[key])

        # 3. BATCH FETCH all unique clothing items in ONE call
        item_docs = db.get_all([clothing_ref.document(i_id) for i_id in all_item_ids])
        
        # 4. Map item data by their ID for easy lookup
        items_lookup = {}
        for doc in item_docs:
            if doc.exists:
                d = doc.to_dict()
                items_lookup[doc.id] = ClothingItem(
                    id=doc.id,
                    image=d.get("image"),
                    category=d.get("category"),
                    type=d.get("type"),
                    colors=d.get("colors"),
                    occasions=d.get("occasions"),
                    temperatures=d.get("temperatures")
                ).get()

        # 5. Hydrate the outfits using the lookup map
        final_outfits = []
        for outfit in outfits_raw:
            final_outfits.append({
                "id": outfit["id"],
                "items": {
                    "topwear": items_lookup.get(outfit.get("topwear_id")),
                    "bottomwear": items_lookup.get(outfit.get("bottomwear_id")),
                    "footwear": items_lookup.get(outfit.get("footwear_id")),
                    "outerwear": items_lookup.get(outfit.get("outerwear_id")),
                },
                "occasion": outfit.get("occasion"),
                "created_at": outfit.get("created_at")
            })

        return {
            "dataList": final_outfits,
            "dataCount": total_count
        }
    except Exception as e:
        print(f"Error listing outfits: {e}")
        return {"dataList": [], "dataCount": 0}

def delete(outfit_id: str, user_id: str) -> bool:    
    doc_ref = collection_ref.document(outfit_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Item not found")
    if doc.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")

    doc_ref.delete()
    return True