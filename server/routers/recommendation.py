from fastapi import APIRouter, Depends
from dependencies.auth import get_current_uid
from services import recommendation
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

class RecommendRequest(BaseModel):
    weather_data: Dict[str, Any] # {"temperature": int, "description": str}
    context: str

@router.post("/get-recommendation")
async def recommend(body: RecommendRequest, uid: str = Depends(get_current_uid)):
    return await recommendation.get_recommendation(uid, body.weather_data, body.context)