from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.notification import NotificationTypeEnum

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: NotificationTypeEnum
    is_read: bool
    link: Optional[str] = None
    created_at: datetime
    formatted_time: str

    class Config:
        from_attributes = True
