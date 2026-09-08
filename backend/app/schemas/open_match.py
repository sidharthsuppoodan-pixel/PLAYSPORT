from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.open_match import MatchStatusEnum

class MatchParticipantOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    username: str
    team_slot: str
    joined_at: datetime

    class Config:
        from_attributes = True

class OpenMatchBase(BaseModel):
    turf_id: int
    ground_id: Optional[int] = None
    title: str = Field(..., min_length=3, max_length=150)
    sport_type: str = "Football"
    skill_level: str = "All Levels"
    match_date: str = Field(..., description="YYYY-MM-DD")
    start_time: str = Field(..., description="e.g. 07:00 PM")
    end_time: str = Field(..., description="e.g. 08:00 PM")
    max_players: int = Field(default=10, ge=2, le=50)
    price_per_player: float = Field(default=150.0, ge=0)
    rules: Optional[str] = None
    description: Optional[str] = None

class OpenMatchCreate(OpenMatchBase):
    pass

class OpenMatchOut(OpenMatchBase):
    id: int
    creator_id: int
    current_players: int
    status: MatchStatusEnum
    turf_name: str
    turf_city: str
    turf_image: Optional[str] = None
    slots_left: int
    created_at: datetime
    participants: List[MatchParticipantOut] = []

    class Config:
        from_attributes = True
