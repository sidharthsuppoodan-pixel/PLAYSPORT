import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class TournamentStatusEnum(str, enum.Enum):
    UPCOMING = "UPCOMING"
    REGISTRATION_OPEN = "REGISTRATION_OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    turf_id = Column(Integer, ForeignKey("turfs.id", ondelete="CASCADE"), nullable=False, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(150), nullable=False)
    sport = Column(String(50), default="Football")
    format = Column(String(50), default="Knockout")
    
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    registration_deadline = Column(String(20), nullable=False)
    
    max_teams = Column(Integer, default=16)
    current_teams = Column(Integer, default=0)
    
    entry_fee = Column(Float, default=2000.0)
    prize_pool = Column(Float, default=25000.0)
    
    status = Column(Enum(TournamentStatusEnum), default=TournamentStatusEnum.REGISTRATION_OPEN, nullable=False)
    banner_url = Column(String(255), nullable=True)
    rules = Column(Text, default="Standard tournament rules apply. 15-minute halves.")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    turf = relationship("Turf", back_populates="tournaments")
    teams = relationship("TournamentTeam", back_populates="tournament", cascade="all, delete-orphan")

class TournamentTeam(Base):
    __tablename__ = "tournament_teams"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id", ondelete="CASCADE"), nullable=False, index=True)
    captain_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    team_name = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    members_count = Column(Integer, default=7)
    payment_status = Column(String(20), default="PAID")
    seed_number = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tournament = relationship("Tournament", back_populates="teams")
    captain = relationship("User")
