from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.tournament import TournamentStatusEnum

class TournamentTeamOut(BaseModel):
    id: int
    team_name: str
    captain_id: int
    captain_name: str
    contact_phone: str
    members_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class TournamentBase(BaseModel):
    turf_id: int
    title: str = Field(..., min_length=3, max_length=150)
    sport: str = "Football"
    format: str = "Knockout"
    start_date: str
    end_date: str
    registration_deadline: str
    max_teams: int = Field(default=16, ge=2)
    entry_fee: float = Field(default=2000.0, ge=0)
    prize_pool: float = Field(default=25000.0, ge=0)
    rules: Optional[str] = None
    banner_url: Optional[str] = None

class TournamentCreate(TournamentBase):
    pass

class TournamentOut(TournamentBase):
    id: int
    creator_id: int
    current_teams: int
    status: TournamentStatusEnum
    turf_name: str
    turf_city: str
    created_at: datetime
    teams: List[TournamentTeamOut] = []

    class Config:
        from_attributes = True

class TeamRegisterRequest(BaseModel):
    team_name: str = Field(..., min_length=2, max_length=100)
    contact_phone: str = Field(..., pattern=r"^\+?[0-9]{10,15}$")
    members_count: int = Field(default=7, ge=1, le=25)
