import enum
import random
import string
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class BookingStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

def generate_booking_ref():
    prefix = "STC"
    num = "".join(random.choices(string.digits, k=5))
    return f"{prefix}-{num}"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(50), unique=True, index=True, default=generate_booking_ref)
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    turf_id = Column(Integer, ForeignKey("turfs.id", ondelete="CASCADE"), nullable=False, index=True)
    ground_id = Column(Integer, ForeignKey("grounds.id", ondelete="CASCADE"), nullable=False, index=True)
    
    booking_date = Column(String(20), nullable=False, index=True)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    
    total_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    final_amount = Column(Float, nullable=False)
    
    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.CONFIRMED, nullable=False, index=True)
    cancellation_reason = Column(Text, nullable=True)
    customer_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="bookings")
    turf = relationship("Turf", back_populates="bookings")
    ground = relationship("Ground", back_populates="bookings")
    slots = relationship("TimeSlot", back_populates="booking", foreign_keys="TimeSlot.booking_id")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    equipment_rentals = relationship("EquipmentRental", back_populates="booking", cascade="all, delete-orphan")
