import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class SlotStatusEnum(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    BOOKED = "BOOKED"
    BLOCKED = "BLOCKED"
    MAINTENANCE = "MAINTENANCE"

class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    ground_id = Column(Integer, ForeignKey("grounds.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_date = Column(String(20), nullable=False, index=True)  # YYYY-MM-DD
    start_time = Column(String(20), nullable=False)            # e.g., "06:00 AM" or "18:00"
    end_time = Column(String(20), nullable=False)              # e.g., "07:00 AM" or "19:00"
    price = Column(Float, nullable=False, default=1200.0)
    status = Column(Enum(SlotStatusEnum), default=SlotStatusEnum.AVAILABLE, nullable=False, index=True)
    
    # Concurrency Lock Support
    locked_until = Column(DateTime, nullable=True)
    lock_token = Column(String(100), nullable=True)
    
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("ground_id", "slot_date", "start_time", name="uq_ground_date_start_time"),
    )

    # Relationships
    ground = relationship("Ground", back_populates="slots")
    booking = relationship("Booking", back_populates="slots", foreign_keys=[booking_id])
