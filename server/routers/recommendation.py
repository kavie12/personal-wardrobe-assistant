from fastapi import APIRouter, Depends
from dependencies.auth import get_current_uid
from services.recommendation_module import module as recommendation_module
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class SlotHints(BaseModel):
    topwear:    Optional[str] = None
    bottomwear: Optional[str] = None
    footwear:   Optional[str] = None
    outerwear:  Optional[str] = None


class RecommendRequest(BaseModel):
    temperature: int
    occasion:    str
    # Optional — only sent by chat-based generation
    type:  Optional[SlotHints] = None
    color: Optional[SlotHints] = None


@router.post("/get-recommendation")
async def recommend(body: RecommendRequest, uid: str = Depends(get_current_uid)):
    type_hints  = body.type.model_dump()  if body.type  else None
    color_hints = body.color.model_dump() if body.color else None

    return await recommendation_module.get_recommendation(
        user_id=uid,
        temperature=body.temperature,
        occasion=body.occasion,
        type_hints=type_hints,
        color_hints=color_hints,
    )