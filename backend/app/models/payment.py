import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base

class PaymentStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

class PaymentMethodEnum(str, enum.Enum):
    UPI = "UPI"
    CARD = "CARD"
    NETBANKING = "NETBANKING"
    WALLET = "WALLET"
    CASH = "CASH"
    MOCK = "MOCK"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    payment_method = Column(Enum(PaymentMethodEnum), default=PaymentMethodEnum.UPI, nullable=False)
    
    transaction_id = Column(String(100), unique=True, index=True, default=lambda: f"TXN-{uuid.uuid4().hex[:12].upper()}")
    gateway_order_id = Column(String(100), nullable=True)
    gateway_payment_id = Column(String(100), nullable=True)
    
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.SUCCESS, nullable=False, index=True)
    paid_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    booking = relationship("Booking", back_populates="payment")
