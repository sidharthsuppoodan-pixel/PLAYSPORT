from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.payment import PaymentStatusEnum, PaymentMethodEnum

class PaymentCreate(BaseModel):
    booking_id: int
    amount: float
    payment_method: PaymentMethodEnum = PaymentMethodEnum.UPI

class MockPaymentVerify(BaseModel):
    booking_id: int
    payment_method: PaymentMethodEnum = PaymentMethodEnum.UPI
    simulate_failure: bool = False

class PaymentOut(BaseModel):
    id: int
    booking_id: int
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
