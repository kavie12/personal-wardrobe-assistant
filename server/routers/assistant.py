from fastapi import APIRouter, Depends
from dependencies.auth import get_current_uid
from services import assistant
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat(body: ChatRequest, uid: str = Depends(get_current_uid)):
    return await assistant.chat(uid, body.message)

@router.post("/reset")
async def reset_chat(uid: str = Depends(get_current_uid)):
    return await assistant.reset_chat(uid)