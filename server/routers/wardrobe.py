from fastapi import APIRouter, UploadFile, Depends
from services import wardrobe
from typing import Union
from pydantic import BaseModel
from typing import Union, List
from dependencies.auth import get_current_uid

router = APIRouter()

class SaveItemRequest(BaseModel):
    item_id: str
    labels: dict[str, Union[str, List[str]]]

class UpdateItemRequest(BaseModel):
    labels: dict[str, Union[str, List[str]]]

@router.post("/add")
async def add_item(clothing_item: UploadFile, uid: str = Depends(get_current_uid)):
    image_bytes = await clothing_item.read()
    return await wardrobe.add(image_bytes)

@router.post("/save")
def save_item(body: SaveItemRequest, uid: str = Depends(get_current_uid)):
    return wardrobe.save_in_db(body.item_id, uid, body.labels)

@router.get("/list")
def list_items(uid: str = Depends(get_current_uid), page: Union[int, None] = 1, size: Union[int, None] = 10):
    return wardrobe.list(uid, page, size)

@router.put("/update/{item_id}")
def update_item(item_id: str, body: UpdateItemRequest, uid: str = Depends(get_current_uid)):
    return wardrobe.update(item_id, uid, body.labels)

@router.delete("/delete/{item_id}")
def delete_item(item_id: str, uid: str = Depends(get_current_uid)):
    return wardrobe.delete(item_id, uid)