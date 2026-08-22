import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class MatchStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    FULL = "FULL"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class OpenMatch(Base):
    __tablename__ = "open_matches"

    id = Column(Integer, primary_key=True, index=True)
    turf_id = Column(Integer, ForeignKey("turfs.id", ondelete="CASCADE"), nullable=False, index=True)
    ground_id = Column(Integer, ForeignKey("grounds.id", ondelete="SET NULL"), nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(150), nullable=False)
    sport_type = Column(String(50), default="Football")  # Football, Cricket, Badminton, etc.
    skill_level = Column(String(50), default="All Levels") # Casual, Intermediate, Competitive
    
    match_date = Column(String(20), nullable=False, index=True)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    
    max_players = Column(Integer, nullable=False, default=10)
    current_players = Column(Integer, default=1)
    price_per_player = Column(Float, default=150.0)
    
    status = Column(Enum(MatchStatusEnum), default=MatchStatusEnum.OPEN, nullable=False, index=True)
    description = Column(Text, nullable=True)
    rules = Column(Text, default="Non-marking shoes mandatory. Bring your own water bottle. Fair play expected.")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    turf = relationship("Turf", back_populates="open_matches")
    ground = relationship("Ground", back_populates="open_matches")
    creator = relationship("User", back_populates="open_matches")
    participants = relationship("MatchParticipant", back_populates="match", cascade="all, delete-orphan")

class MatchParticipant(Base):
    __tablename__ = "match_participants"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("open_matches.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    team_slot = Column(String(20), default="Team A")
    payment_status = Column(String(20), default="PAID")
    joined_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("match_id", "user_id", name="uq_match_user_participant"),
    )

    # Relationships
    match = relationship("OpenMatch", back_populates="participants")
    user = relationship("User", back_populates="match_participations")
