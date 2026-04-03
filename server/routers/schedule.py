from fastapi import APIRouter, HTTPException, Depends
from services import schedule
from pydantic import BaseModel
from datetime import datetime
from dependencies.auth import get_current_uid

router = APIRouter()

class ScheduleRequest(BaseModel):
    title: str
    occasion: str
    timestamp: datetime
    notification_id: str | None = None

@router.post("/add")
async def add_schedule(body: ScheduleRequest, uid: str = Depends(get_current_uid)):
    result = schedule.add(uid, body.title, body.occasion, body.timestamp, body.notification_id)
    if not result["success"]:
        raise HTTPException(status_code=500, detail="Failed to save schedule")
    return result

@router.get("/list")
async def get_schedules(uid: str = Depends(get_current_uid)):
    return schedule.list_by_user(uid)

@router.get("/latest-by-hours/{hours}")
async def get_latest_schedules_by_hours(hours: int, uid: str = Depends(get_current_uid)):
    return schedule.get_latest_by_hours(uid, hours)

@router.delete("/delete/{schedule_id}")
async def delete_schedule(schedule_id: str, uid: str = Depends(get_current_uid)):
    if schedule.delete(schedule_id, uid):
        return {"message": "Deleted"}
    raise HTTPException(status_code=400, detail="Delete failed")