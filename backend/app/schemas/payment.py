from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.models.payment import PaymentStatusEnum, PaymentMethodEnum

class PaymentCreate(BaseModel):
    booking_id: Optional[int] = None
    amount: float
    payment_method: PaymentMethodEnum = PaymentMethodEnum.UPI

class MockPaymentVerify(BaseModel):
    booking_id: int
    payment_method: PaymentMethodEnum = PaymentMethodEnum.UPI
    simulate_failure: bool = False

class RazorpayConfigOut(BaseModel):
    key_id: str
    currency: str = "INR"
    is_mock: bool = False

class TurfOrderCreate(BaseModel):
    turf_id: int
    ground_id: int
    booking_date: str = Field(..., description="YYYY-MM-DD")
    slot_ids: List[int] = Field(..., min_length=1)
    equipment_rentals: Optional[List[Dict[str, Any]]] = None

class EquipmentOrderCreate(BaseModel):
    turf_id: int
    items: List[Dict[str, Any]] = Field(..., min_length=1)  # [{"equipment_id": 1, "quantity": 2}]
    rental_date: str = Field(..., description="YYYY-MM-DD")
    hours: int = Field(1, ge=1, le=24)

class RazorpayOrderOut(BaseModel):
    order_id: str
    amount: int  # in paise
    currency: str = "INR"
    key_id: str
    is_mock: bool = False
    total_amount_inr: float
    title: str
    description: str

class TurfBookingVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    payment_method: PaymentMethodEnum = PaymentMethodEnum.UPI
    turf_id: int
    ground_id: int
    booking_date: str
    slot_ids: List[int] = Field(..., min_length=1)
    customer_notes: Optional[str] = None
    equipment_rentals: Optional[List[Dict[str, Any]]] = None

class EquipmentRentalVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    payment_method: PaymentMethodEnum = PaymentMethodEnum.UPI
    turf_id: int
    items: List[Dict[str, Any]] = Field(..., min_length=1)  # [{"equipment_id": 1, "quantity": 2}]
    rental_date: str
    hours: int = Field(1, ge=1, le=24)
    customer_notes: Optional[str] = None

class PaymentOut(BaseModel):
    id: int
    booking_id: Optional[int] = None
    user_id: int
    amount: float
    currency: str
    payment_method: PaymentMethodEnum
    transaction_id: str
    status: PaymentStatusEnum
    paid_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
