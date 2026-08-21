from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Ground(Base):
    __tablename__ = "grounds"

    id = Column(Integer, primary_key=True, index=True)
    turf_id = Column(Integer, ForeignKey("turfs.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g., "Turf A (5v5)", "Turf B (Box Cricket)"
    sport_type = Column(String(50), default="Football")  # Football, Cricket, Badminton, etc.
    ground_size = Column(String(50), default="5v5")  # 5v5, 7v7, Box Cricket, Full Pitch
    surface_type = Column(String(50), default="FIFA Approved Artificial Turf")
    hourly_rate = Column(Float, default=1200.0)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    turf = relationship("Turf", back_populates="grounds")
    slots = relationship("TimeSlot", back_populates="ground", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="ground")
    open_matches = relationship("OpenMatch", back_populates="ground")
