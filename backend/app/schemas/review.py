from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ReviewCreate(BaseModel):
    turf_id: int
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: str = Field(..., min_length=3, max_length=1000)
    booking_id: Optional[int] = None

class ReviewOut(BaseModel):
    id: int
    turf_id: int
    user_id: int
    user_name: str
    user_initials: str
    rating: float
    comment: str
    is_verified: bool
    created_at: datetime
    formatted_date: str

    class Config:
        from_attributes = True
