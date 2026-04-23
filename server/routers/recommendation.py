from fastapi import APIRouter, Depends
from dependencies.auth import get_current_uid
from server.services import recommendation
from pydantic import BaseModel
from typing import Dict, Any, Optional

router = APIRouter()

class SlotPreference(BaseModel):
    colors: Optional[list[str]] = None
    type: Optional[str] = None

class ItemPreferences(BaseModel):
    topwear:    Optional[SlotPreference] = None
    bottomwear: Optional[SlotPreference] = None
    footwear:   Optional[SlotPreference] = None
    outerwear:  Optional[SlotPreference] = None

class RecommendRequest(BaseModel):
    weather_data: Dict[str, Any] # {"temperature": int, "description": str}
    context: str
    item_preferences: Optional[ItemPreferences] = None

@router.post("/get-recommendation")
async def recommend(body: RecommendRequest, uid: str = Depends(get_current_uid)):
    return await recommendation.get_recommendation(
        uid,
        body.weather_data,
        body.context,
        item_preferences=body.item_preferences.model_dump() if body.item_preferences else {}
    )