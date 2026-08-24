from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.slot import SlotStatusEnum

class SlotBase(BaseModel):
    ground_id: int
    slot_date: str = Field(..., description="YYYY-MM-DD format")
    start_time: str = Field(..., description="e.g. 06:00 AM or 18:00")
    end_time: str = Field(..., description="e.g. 07:00 AM or 19:00")
    price: float = Field(default=1200.0, gt=0)
    status: SlotStatusEnum = SlotStatusEnum.AVAILABLE

class SlotCreate(SlotBase):
    pass

class SlotBatchGenerate(BaseModel):
    ground_id: int
    start_date: str
    end_date: str
    start_time_hour: int = 6  # 6 AM
    end_time_hour: int = 23   # 11 PM
    hourly_price: float = 1200.0

class SlotOut(SlotBase):
    id: int
    booking_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DateSlotsGroup(BaseModel):
    date: str
    day_name: str
    display_date: str
    is_today: bool = False
    slots: List[SlotOut]
