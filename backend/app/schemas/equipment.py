from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class EquipmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: str = "Balls"
    total_quantity: int = Field(default=10, ge=1)
    available_quantity: int = Field(default=10, ge=0)
    price_per_hour: float = Field(default=100.0, ge=0)
    deposit_amount: float = Field(default=200.0, ge=0)
    image_url: Optional[str] = None
    description: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    turf_id: int

class EquipmentOut(EquipmentBase):
    id: int
    turf_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EquipmentRentalRequest(BaseModel):
    equipment_id: int
    quantity: int = Field(default=1, ge=1)
    rental_date: str
    booking_id: Optional[int] = None
