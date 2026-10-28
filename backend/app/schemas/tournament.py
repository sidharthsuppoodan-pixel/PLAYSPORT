import re
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
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
    turf_id: Optional[int] = None
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
    captain_name: str = Field(..., min_length=2, max_length=100)
    contact_phone: str = Field(..., min_length=10, max_length=15)
    members_count: int = Field(default=7, ge=5, le=25)

    @field_validator("team_name")
    @classmethod
    def validate_team_name(cls, v: str) -> str:
        val = v.strip()
        if len(val) < 2:
            raise ValueError("Team name must contain at least 2 characters.")
        if re.match(r"^[\d\W]+$", val):
            raise ValueError("Team name cannot consist solely of numbers or symbols.")
        return val

    @field_validator("captain_name")
    @classmethod
    def validate_captain_name(cls, v: str) -> str:
        val = v.strip()
        if len(val) < 2:
            raise ValueError("Captain name must contain at least 2 characters.")
        if not re.match(r"^[A-Za-z\s.'-]+$", val):
            raise ValueError("Captain name should only contain letters and standard name characters.")
        return val

    @field_validator("contact_phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        val_str = str(v).strip()
        if not val_str:
            raise ValueError("Contact mobile number is required.")
        digits = re.sub(r"\D", "", val_str)
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        elif len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]
        if len(digits) != 10:
            raise ValueError("Mobile number must be exactly 10 digits.")
        if digits[0] not in "6789":
            raise ValueError("10-digit mobile number must begin with 6, 7, 8, or 9.")
        if len(set(digits[:7])) == 1:
            raise ValueError("The first 7 digits cannot be the same number.")
        if len(set(digits)) == 1:
            raise ValueError("Mobile number cannot consist of all identical digits.")
        if re.search(r"(\d)\1{6,}", digits):
            raise ValueError("Mobile number cannot have more than 6 repetitive digits.")
        return digits

