from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    turf_id = Column(Integer, ForeignKey("turfs.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    
    rating = Column(Float, nullable=False, default=5.0)
    comment = Column(Text, nullable=False)
    is_verified = Column(Boolean, default=True)
    
    user_initials = Column(String(5), nullable=True) # e.g. "AJ", "RK"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    turf = relationship("Turf", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
