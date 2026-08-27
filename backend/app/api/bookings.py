from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_owner_or_admin
from app.models.booking import Booking, BookingStatusEnum, generate_booking_ref
from app.models.slot import TimeSlot, SlotStatusEnum
from app.models.ground import Ground
from app.models.turf import Turf
from app.models.payment import Payment, PaymentStatusEnum, PaymentMethodEnum
from app.models.notification import Notification, NotificationTypeEnum
from app.models.equipment import Equipment, EquipmentRental
from app.models.user import User, RoleEnum
from app.schemas.booking import BookingCreate, BookingOut, BookingDetailOut, BookingCancelRequest

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("/create", response_model=BookingDetailOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify turf and ground
    turf = db.query(Turf).filter(Turf.id == booking_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")
        
    ground = db.query(Ground).filter(Ground.id == booking_in.ground_id, Ground.turf_id == turf.id).first()
    if not ground:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ground not found for this turf")

    # Lock and verify slots atomically
    # Note: with_for_update() works on PostgreSQL and safely degrades on SQLite
    try:
        slots_query = db.query(TimeSlot).filter(
            TimeSlot.id.in_(booking_in.slot_ids),
            TimeSlot.ground_id == ground.id,
            TimeSlot.slot_date == booking_in.booking_date
        )
        if db.bind.dialect.name != "sqlite":
            slots_query = slots_query.with_for_update()
            
        selected_slots = slots_query.all()
    except Exception:
        selected_slots = db.query(TimeSlot).filter(
            TimeSlot.id.in_(booking_in.slot_ids),
            TimeSlot.ground_id == ground.id,
            TimeSlot.slot_date == booking_in.booking_date
        ).all()

    if len(selected_slots) != len(booking_in.slot_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more selected slots do not exist for the chosen ground and date."
        )

    # Check collision / double-booking
    for slot in selected_slots:
        if slot.status != SlotStatusEnum.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Slot '{slot.start_time} - {slot.end_time}' is already booked. Double-booking prevented."
            )

    # Calculate total price
    total_amount = sum(slot.price for slot in selected_slots)
    start_time_sorted = sorted([s.start_time for s in selected_slots])[0]
    end_time_sorted = sorted([s.end_time for s in selected_slots])[-1]

    # Create Booking
    booking = Booking(
        booking_reference=generate_booking_ref(),
        user_id=current_user.id,
        turf_id=turf.id,
        ground_id=ground.id,
        booking_date=booking_in.booking_date,
        start_time=start_time_sorted,
        end_time=end_time_sorted,
        total_amount=total_amount,
        discount_amount=0.0,
        final_amount=total_amount,
        status=BookingStatusEnum.CONFIRMED,
        customer_notes=booking_in.customer_notes
    )
    db.add(booking)
    db.flush() # Flush to populate booking.id

    # Mark slots as booked
    for slot in selected_slots:
        slot.status = SlotStatusEnum.BOOKED
        slot.booking_id = booking.id

    # Create Payment record
    payment = Payment(
        booking_id=booking.id,
        user_id=current_user.id,
        amount=total_amount,
        currency="INR",
        payment_method=booking_in.payment_method,
        status=PaymentStatusEnum.SUCCESS
    )
    db.add(payment)

    # Process Equipment rentals if any
    if booking_in.equipment_rentals:
        for eq_req in booking_in.equipment_rentals:
            eq_id = eq_req.get("equipment_id")
            qty = eq_req.get("quantity", 1)
            eq_item = db.query(Equipment).filter(Equipment.id == eq_id, Equipment.turf_id == turf.id).first()
            if eq_item and eq_item.available_quantity >= qty:
                eq_item.available_quantity -= qty
                eq_rental = EquipmentRental(
                    booking_id=booking.id,
                    equipment_id=eq_item.id,
                    user_id=current_user.id,
                    quantity=qty,
                    rental_date=booking_in.booking_date,
                    total_price=eq_item.price_per_hour * qty,
                    status="RENTED"
                )
                db.add(eq_rental)

    # Send Notification to Customer
    notif = Notification(
        user_id=current_user.id,
        title="Booking Confirmed! ⚽",
        message=f"Your booking {booking.booking_reference} for {turf.name} on {booking.booking_date} ({booking.start_time} - {booking.end_time}) is confirmed.",
        type=NotificationTypeEnum.BOOKING,
        link="/my-bookings"
    )
    db.add(notif)

    db.commit()
    db.refresh(booking)

    return BookingDetailOut(
        id=booking.id,
        booking_reference=booking.booking_reference,
        user_id=booking.user_id,
        turf_id=booking.turf_id,
        ground_id=booking.ground_id,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        total_amount=booking.total_amount,
        discount_amount=booking.discount_amount,
        final_amount=booking.final_amount,
        status=booking.status,
        customer_notes=booking.customer_notes,
        created_at=booking.created_at,
        turf_name=turf.name,
        turf_address=turf.address,
        ground_name=ground.name,
        customer_name=current_user.full_name,
        customer_email=current_user.email,
        customer_phone=current_user.phone,
        payment_status=payment.status.value,
        payment_id=payment.transaction_id
    )

@router.get("/my-bookings", response_model=List[BookingDetailOut])
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).order_by(Booking.created_at.desc()).all()
    results = []
    for b in bookings:
        pay = db.query(Payment).filter(Payment.booking_id == b.id).first()
        results.append(BookingDetailOut(
            id=b.id,
            booking_reference=b.booking_reference,
            user_id=b.user_id,
            turf_id=b.turf_id,
            ground_id=b.ground_id,
            booking_date=b.booking_date,
            start_time=b.start_time,
            end_time=b.end_time,
            total_amount=b.total_amount,
            discount_amount=b.discount_amount,
            final_amount=b.final_amount,
            status=b.status,
            customer_notes=b.customer_notes,
            created_at=b.created_at,
            turf_name=b.turf.name if b.turf else "PlayZone Arena",
            turf_address=b.turf.address if b.turf else "Kochi, Kerala",
            ground_name=b.ground.name if b.ground else "Main Ground",
            customer_name=current_user.full_name,
            customer_email=current_user.email,
            customer_phone=current_user.phone,
            payment_status=pay.status.value if pay else "SUCCESS",
            payment_id=pay.transaction_id if pay else "TXN-0000"
        ))
    return results

@router.get("/{booking_id}", response_model=BookingDetailOut)
def get_booking_detail(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role != RoleEnum.ADMIN and booking.user_id != current_user.id and (booking.turf and booking.turf.owner_id != current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    pay = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    return BookingDetailOut(
        id=booking.id,
        booking_reference=booking.booking_reference,
        user_id=booking.user_id,
        turf_id=booking.turf_id,
        ground_id=booking.ground_id,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        total_amount=booking.total_amount,
        discount_amount=booking.discount_amount,
        final_amount=booking.final_amount,
        status=booking.status,
        customer_notes=booking.customer_notes,
        created_at=booking.created_at,
        turf_name=booking.turf.name if booking.turf else "PlayZone Arena",
        turf_address=booking.turf.address if booking.turf else "Kochi, Kerala",
        ground_name=booking.ground.name if booking.ground else "Main Ground",
        customer_name=booking.user.full_name if booking.user else "Customer",
        customer_email=booking.user.email if booking.user else "",
        customer_phone=booking.user.phone if booking.user else None,
        payment_status=pay.status.value if pay else "SUCCESS",
        payment_id=pay.transaction_id if pay else None
    )

@router.post("/{booking_id}/cancel", response_model=dict)
def cancel_booking(
    booking_id: int,
    cancel_in: BookingCancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role != RoleEnum.ADMIN and booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if booking.status == BookingStatusEnum.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking already cancelled")

    booking.status = BookingStatusEnum.CANCELLED
    booking.cancellation_reason = cancel_in.reason

    # Release slots
    slots = db.query(TimeSlot).filter(TimeSlot.booking_id == booking.id).all()
    for s in slots:
        s.status = SlotStatusEnum.AVAILABLE
        s.booking_id = None

    # Refund payment status
    pay = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if pay:
        pay.status = PaymentStatusEnum.REFUNDED

    db.commit()
    return {"message": "Booking successfully cancelled and slots released.", "booking_id": booking_id}
