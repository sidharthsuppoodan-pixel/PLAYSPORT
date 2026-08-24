from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.booking import BookingStatusEnum
from app.models.payment import PaymentMethodEnum

class BookingCreate(BaseModel):
    turf_id: int
    ground_id: int
    booking_date: str = Field(..., description="YYYY-MM-DD")
    slot_ids: List[int] = Field(..., min_length=1)
    payment_method: PaymentMethodEnum = PaymentMethodEnum.UPI
    customer_notes: Optional[str] = None
    equipment_rentals: Optional[List[dict]] = None # [{"equipment_id": 1, "quantity": 2}]

class BookingOut(BaseModel):
    id: int
    booking_reference: str
    user_id: int
    turf_id: int
    ground_id: int
    booking_date: str
    start_time: str
    end_time: str
    total_amount: float
    discount_amount: float
    final_amount: float
    status: BookingStatusEnum
    customer_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BookingDetailOut(BookingOut):
    turf_name: str
    turf_address: str
    ground_name: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    payment_status: Optional[str] = "SUCCESS"
    payment_id: Optional[str] = None

    class Config:
        from_attributes = True

class BookingCancelRequest(BaseModel):
    reason: str = Field(..., min_length=3)
