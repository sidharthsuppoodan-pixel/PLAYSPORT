from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    turf_id = Column(Integer, ForeignKey("turfs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(100), nullable=False)  # e.g., "FIFA Pro Match Football", "Box Cricket Bat"
    category = Column(String(50), default="Balls") # Balls, Bats, Bibs, Rackets, Protective
    total_quantity = Column(Integer, default=10)
    available_quantity = Column(Integer, default=10)
    
    price_per_hour = Column(Float, default=100.0)
    deposit_amount = Column(Float, default=200.0)
    
    image_url = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    turf = relationship("Turf", back_populates="equipment_items")
    rentals = relationship("EquipmentRental", back_populates="equipment")

class EquipmentRental(Base):
    __tablename__ = "equipment_rentals"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    quantity = Column(Integer, default=1)
    rental_date = Column(String(20), nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(20), default="RENTED") # RENTED, RETURNED, CANCELLED
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="equipment_rentals")
    equipment = relationship("Equipment", back_populates="rentals")
    user = relationship("User")
