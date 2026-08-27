import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.payment import Payment, PaymentStatusEnum, PaymentMethodEnum
from app.models.booking import Booking, BookingStatusEnum
from app.models.user import User
from app.schemas.payment import PaymentOut, MockPaymentVerify

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/verify-mock", response_model=PaymentOut)
def verify_mock_payment(
    verify_in: MockPaymentVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == verify_in.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if not payment:
        payment = Payment(
            booking_id=booking.id,
            user_id=current_user.id,
            amount=booking.final_amount,
            currency="INR",
            payment_method=verify_in.payment_method,
            status=PaymentStatusEnum.SUCCESS if not verify_in.simulate_failure else PaymentStatusEnum.FAILED
        )
        db.add(payment)
    else:
        payment.status = PaymentStatusEnum.SUCCESS if not verify_in.simulate_failure else PaymentStatusEnum.FAILED
        payment.payment_method = verify_in.payment_method

    if payment.status == PaymentStatusEnum.SUCCESS:
        booking.status = BookingStatusEnum.CONFIRMED
    else:
        booking.status = BookingStatusEnum.PENDING

    db.commit()
    db.refresh(payment)
    return payment

@router.get("/receipt/{booking_id}", response_model=dict)
def get_payment_receipt(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()

    return {
        "booking_id": booking.booking_reference,
        "turf_name": booking.turf.name if booking.turf else "PlayZone Arena",
        "ground_name": booking.ground.name if booking.ground else "Turf A",
        "date": booking.booking_date,
        "time": f"{booking.start_time} - {booking.end_time}",
        "amount": booking.final_amount,
        "payment_method": payment.payment_method.value if payment else "UPI",
        "transaction_id": payment.transaction_id if payment else "N/A",
        "status": payment.status.value if payment else "SUCCESS",
        "customer_name": booking.user.full_name if booking.user else "Customer",
        "customer_email": booking.user.email if booking.user else ""
    }
