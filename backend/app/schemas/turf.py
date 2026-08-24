from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.schemas.ground import GroundOut

class TurfBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    address: str = Field(..., min_length=5, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = "Kerala"
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    starting_price: float = Field(default=1200.0, gt=0)
    dimension_text: str = Field(default="6000 sq ft")
    sports_supported: str = Field(default="Football (5v5), Box Cricket")
    facilities: List[str] = Field(default_factory=lambda: ["Free Parking", "Changing Rooms", "Drinking Water", "LED Floodlights", "Spectator Seating", "First Aid Kit"])
    images: List[str] = Field(default_factory=list)
    opening_time: str = "06:00 AM"
    closing_time: str = "11:00 PM"

class TurfCreate(TurfBase):
    pass

class TurfUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    starting_price: Optional[float] = None
    dimension_text: Optional[str] = None
    sports_supported: Optional[str] = None
    facilities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    is_active: Optional[bool] = None

class TurfOut(TurfBase):
    id: int
    owner_id: int
    slug: str
    rating: float
    review_count: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TurfDetailOut(TurfOut):
    grounds: List[GroundOut] = []

    class Config:
        from_attributes = True
