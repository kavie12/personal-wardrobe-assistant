from config.firebase import db
from google.cloud.firestore_v1.base_query import FieldFilter
from datetime import datetime, UTC, timedelta
from fastapi import HTTPException

schedule_ref = db.collection("schedules")

def add(user_id: str, title: str, occasion: str, timestamp: datetime, notification_id: str | None = None):
    try:
        doc_ref = schedule_ref.add({
            "user_id": user_id,
            "title": title,
            "occasion": occasion,
            "timestamp": timestamp,
            "notification_id": notification_id,
            "created_at": datetime.now()
        })
        return {"success": True, "id": doc_ref[1].id}
    except Exception as e:
        print(f"Error adding schedule: {e}")
        return {"success": False}

def list_by_user(user_id: str):
    try:
        now = datetime.now(UTC)

        docs = schedule_ref.where(
            filter=FieldFilter("user_id", "==", user_id)
        ).where(
            filter=FieldFilter("timestamp", ">=", now)
        ).order_by("timestamp").get()
        
        schedules = []
        for doc in docs:
            data = doc.to_dict()
            schedules.append({
                "id": doc.id,
                "title": data.get("title"),
                "occasion": data.get("occasion"),
                "timestamp": data.get("timestamp"),
                "notification_id": data.get("notification_id", None)
            })
        return schedules
    except Exception as e:
        print(f"Error listing schedules: {e}")
        return []

def get_latest_by_hours(user_id: str, hours: int):
    try:
        now = datetime.now(UTC)
        next_hours = now + timedelta(hours=hours)

        docs = (
            schedule_ref
            .where(filter=FieldFilter("user_id", "==", user_id))
            .where(filter=FieldFilter("timestamp", ">=", now))
            .where(filter=FieldFilter("timestamp", "<=", next_hours))
            .order_by("timestamp")
            .get()
        )

        schedules = []
        for doc in docs:
            data = doc.to_dict()
            schedules.append({
                "id": doc.id,
                "title": data.get("title"),
                "occasion": data.get("occasion"),
                "timestamp": data.get("timestamp"),
                "notification_id": data.get("notification_id", None)
            })
        return schedules
    except Exception as e:
        print(f"Error listing schedules: {e}")
        return []

def delete(schedule_id: str, user_id: str):
    doc_ref = schedule_ref.document(schedule_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Item not found")
    if doc.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this item")

    doc_ref.delete()
    return True