import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class NotificationTypeEnum(str, enum.Enum):
    BOOKING = "BOOKING"
    MATCH = "MATCH"
    TOURNAMENT = "TOURNAMENT"
    ADMIN = "ADMIN"
    SYSTEM = "SYSTEM"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationTypeEnum), default=NotificationTypeEnum.SYSTEM, nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")
