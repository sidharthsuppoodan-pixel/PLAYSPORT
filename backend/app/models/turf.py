import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Turf(Base):
    __tablename__ = "turfs"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False, index=True)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), default="Kerala")
    pincode = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(100), nullable=True)
    
    rating = Column(Float, default=4.8)
    review_count = Column(Integer, default=0)
    starting_price = Column(Float, default=1200.0)
    
    dimension_text = Column(String(50), default="6000 sq ft")
    sports_supported = Column(Text, default="Football (5v5), Box Cricket")  # Comma separated
    facilities_json = Column(Text, default='["Free Parking", "Changing Rooms", "Drinking Water", "LED Floodlights", "Spectator Seating", "First Aid Kit"]')
    images_json = Column(Text, default='[]')
    
    opening_time = Column(String(10), default="06:00 AM")
    closing_time = Column(String(10), default="11:00 PM")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="turfs")
    grounds = relationship("Ground", back_populates="turf", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="turf")
    reviews = relationship("Review", back_populates="turf", cascade="all, delete-orphan")
    open_matches = relationship("OpenMatch", back_populates="turf")
    tournaments = relationship("Tournament", back_populates="turf")
    equipment_items = relationship("Equipment", back_populates="turf")

    @property
    def facilities(self):
        try:
            return json.loads(self.facilities_json) if self.facilities_json else []
        except Exception:
            return []

    @facilities.setter
    def facilities(self, value):
        self.facilities_json = json.dumps(value)

    @property
    def images(self):
        try:
            return json.loads(self.images_json) if self.images_json else []
        except Exception:
            return []

    @images.setter
    def images(self, value):
        self.images_json = json.dumps(value)
