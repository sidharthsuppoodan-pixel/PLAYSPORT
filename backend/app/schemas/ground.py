from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class GroundBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    sport_type: str = Field(default="Football")
    ground_size: str = Field(default="5v5")
    surface_type: str = Field(default="FIFA Approved Artificial Turf")
    hourly_rate: float = Field(default=1200.0, gt=0)
    is_active: bool = True

class GroundCreate(GroundBase):
    turf_id: int

class GroundUpdate(BaseModel):
    name: Optional[str] = None
    sport_type: Optional[str] = None
    ground_size: Optional[str] = None
    surface_type: Optional[str] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None

class GroundOut(GroundBase):
    id: int
    turf_id: int
    created_at: datetime

    class Config:
        from_attributes = True
