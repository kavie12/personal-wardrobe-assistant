from fastapi import APIRouter, Depends
from dependencies.auth import get_current_uid
from services import outfits
from pydantic import BaseModel
from typing import Optional, Dict

router = APIRouter()

class SaveOutfitRequest(BaseModel):
    items: Dict[str, Optional[str]]
    occasion: str

@router.post("/save")
def save_outfit(body: SaveOutfitRequest, uid: str = Depends(get_current_uid)):
    return outfits.save(uid, body.items, body.occasion)

@router.get("/list")
def get_outfits(uid: str = Depends(get_current_uid), page: int = 1, size: int = 10):
    return outfits.list_outfits(uid, page, size)

@router.delete("/delete/{outfit_id}")
def delete_outfit(outfit_id: str, uid: str = Depends(get_current_uid)):
    return outfits.delete(outfit_id, uid)