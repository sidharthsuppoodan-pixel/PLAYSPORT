import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.payment import Payment, PaymentStatusEnum, PaymentMethodEnum
from app.models.booking import Booking, BookingStatusEnum, generate_booking_ref
from app.models.slot import TimeSlot, SlotStatusEnum
from app.models.ground import Ground
from app.models.turf import Turf
from app.models.equipment import Equipment, EquipmentRental
from app.models.notification import Notification, NotificationTypeEnum
from app.models.user import User
from app.schemas.payment import (
    PaymentOut,
    MockPaymentVerify,
    RazorpayConfigOut,
    TurfOrderCreate,
    EquipmentOrderCreate,
    RazorpayOrderOut,
    TurfBookingVerify,
    EquipmentRentalVerify
)
from app.schemas.booking import BookingDetailOut, EquipmentRentalItemOut
from app.services.razorpay_service import razorpay_service

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("/razorpay/config", response_model=RazorpayConfigOut)
def get_razorpay_config():
    """
    Returns public Razorpay configuration for client checkout.
    """
    return RazorpayConfigOut(
        key_id=settings.RAZORPAY_KEY_ID,
        currency="INR",
        is_mock=razorpay_service.is_mock_mode()
    )

@router.post("/razorpay/create-turf-order", response_model=RazorpayOrderOut)
def create_turf_order(
    order_in: TurfOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates turf slot availability and equipment, calculates authentic server-side price,
    and creates a Razorpay order.
    """
    turf = db.query(Turf).filter(Turf.id == order_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")

    ground = db.query(Ground).filter(Ground.id == order_in.ground_id, Ground.turf_id == turf.id).first()
    if not ground:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ground not found for this facility")

    # Fetch and validate slots
    slots = db.query(TimeSlot).filter(
        TimeSlot.id.in_(order_in.slot_ids),
        TimeSlot.ground_id == ground.id,
        TimeSlot.slot_date == order_in.booking_date
    ).all()

    if len(slots) != len(order_in.slot_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more selected slots do not exist for the chosen ground and date."
        )

    for s in slots:
        if s.status != SlotStatusEnum.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Slot '{s.start_time} - {s.end_time}' is no longer available. Please select another slot."
            )

    slots_amount = sum(s.price for s in slots)
    num_hours = max(1, len(slots))

    # Validate and calculate equipment rental total
    equipment_amount = 0.0
    if order_in.equipment_rentals:
        for eq_req in order_in.equipment_rentals:
            eq_id = eq_req.get("equipment_id")
            qty = int(eq_req.get("quantity", 0))
            if not eq_id or qty <= 0:
                continue
            eq_item = db.query(Equipment).filter(Equipment.id == eq_id, Equipment.turf_id == turf.id).first()
            if not eq_item:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Equipment ID {eq_id} not available at this turf.")
            if eq_item.available_quantity < qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Only {eq_item.available_quantity} units of '{eq_item.name}' available for rent."
                )
            equipment_amount += (eq_item.price_per_hour * qty * num_hours)

    total_amount = slots_amount + equipment_amount
    receipt_code = f"T_{current_user.id}_{int(datetime.utcnow().timestamp())}"

    rzp_order = razorpay_service.create_order(
        amount_inr=total_amount,
        receipt=receipt_code,
        notes={
            "user_id": str(current_user.id),
            "turf_id": str(turf.id),
            "turf_name": turf.name,
            "date": order_in.booking_date,
            "type": "turf_booking"
        }
    )

    return RazorpayOrderOut(
        order_id=rzp_order["id"],
        amount=rzp_order["amount"],
        currency=rzp_order["currency"],
        key_id=rzp_order["key_id"],
        is_mock=rzp_order["is_mock"],
        total_amount_inr=total_amount,
        title=f"Booking at {turf.name}",
        description=f"{len(slots)} slot(s) on {order_in.booking_date}" + (f" + {len(order_in.equipment_rentals)} gear items" if order_in.equipment_rentals else "")
    )

@router.post("/razorpay/verify-turf-booking", response_model=BookingDetailOut, status_code=status.HTTP_201_CREATED)
def verify_turf_booking(
    verify_in: TurfBookingVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifies Razorpay payment signature and commits turf booking atomically.
    """
    # 1. Cryptographic HMAC Signature Verification
    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=verify_in.razorpay_order_id,
        razorpay_payment_id=verify_in.razorpay_payment_id,
        razorpay_signature=verify_in.razorpay_signature
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed: Invalid cryptographic signature from Razorpay."
        )

    # 2. Check turf and ground
    turf = db.query(Turf).filter(Turf.id == verify_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")

    ground = db.query(Ground).filter(Ground.id == verify_in.ground_id, Ground.turf_id == turf.id).first()
    if not ground:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ground not found for this facility")

    # 3. Lock and verify slots atomically
    try:
        slots_query = db.query(TimeSlot).filter(
            TimeSlot.id.in_(verify_in.slot_ids),
            TimeSlot.ground_id == ground.id,
            TimeSlot.slot_date == verify_in.booking_date
        )
        if db.bind.dialect.name != "sqlite":
            slots_query = slots_query.with_for_update()
        selected_slots = slots_query.all()
    except Exception:
        selected_slots = db.query(TimeSlot).filter(
            TimeSlot.id.in_(verify_in.slot_ids),
            TimeSlot.ground_id == ground.id,
            TimeSlot.slot_date == verify_in.booking_date
        ).all()

    if len(selected_slots) != len(verify_in.slot_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected slots not found.")

    for slot in selected_slots:
        if slot.status != SlotStatusEnum.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Slot '{slot.start_time} - {slot.end_time}' is already booked."
            )

    slot_amount = sum(slot.price for slot in selected_slots)
    start_time_sorted = sorted([s.start_time for s in selected_slots])[0]
    end_time_sorted = sorted([s.end_time for s in selected_slots])[-1]
    num_hours = max(1, len(selected_slots))

    # 4. Equipment rentals validation & calculations
    equipment_items_to_rent = []
    equipment_amount = 0.0
    if verify_in.equipment_rentals:
        for eq_req in verify_in.equipment_rentals:
            eq_id = eq_req.get("equipment_id")
            qty = int(eq_req.get("quantity", 0))
            if not eq_id or qty <= 0:
                continue
            eq_item = db.query(Equipment).filter(Equipment.id == eq_id, Equipment.turf_id == turf.id).first()
            if not eq_item:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Equipment {eq_id} not found.")
            if eq_item.available_quantity < qty:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock for '{eq_item.name}'.")
            
            rental_cost = eq_item.price_per_hour * qty * num_hours
            equipment_amount += rental_cost
            equipment_items_to_rent.append({
                "item": eq_item,
                "quantity": qty,
                "cost": rental_cost
            })

    total_amount = slot_amount + equipment_amount

    # 5. Create Booking
    booking = Booking(
        booking_reference=generate_booking_ref(),
        user_id=current_user.id,
        turf_id=turf.id,
        ground_id=ground.id,
        booking_date=verify_in.booking_date,
        start_time=start_time_sorted,
        end_time=end_time_sorted,
        total_amount=total_amount,
        discount_amount=0.0,
        final_amount=total_amount,
        status=BookingStatusEnum.CONFIRMED,
        customer_notes=verify_in.customer_notes or "Booked via Razorpay Checkout"
    )
    db.add(booking)
    db.flush()

    # 6. Mark slots as BOOKED
    for slot in selected_slots:
        slot.status = SlotStatusEnum.BOOKED
        slot.booking_id = booking.id

    # 7. Create Payment record with gateway details
    payment = Payment(
        booking_id=booking.id,
        user_id=current_user.id,
        amount=total_amount,
        currency="INR",
        payment_method=verify_in.payment_method,
        gateway_order_id=verify_in.razorpay_order_id,
        gateway_payment_id=verify_in.razorpay_payment_id,
        status=PaymentStatusEnum.SUCCESS,
        paid_at=datetime.utcnow()
    )
    db.add(payment)

    # 8. Record equipment rentals
    rental_outs = []
    for eq_info in equipment_items_to_rent:
        eq_item = eq_info["item"]
        qty = eq_info["quantity"]
        cost = eq_info["cost"]
        eq_item.available_quantity -= qty
        eq_rental = EquipmentRental(
            booking_id=booking.id,
            equipment_id=eq_item.id,
            user_id=current_user.id,
            quantity=qty,
            rental_date=verify_in.booking_date,
            total_price=cost,
            status="RENTED"
        )
        db.add(eq_rental)
        db.flush()
        rental_outs.append(EquipmentRentalItemOut(
            id=eq_rental.id,
            equipment_id=eq_item.id,
            name=eq_item.name,
            category=eq_item.category,
            quantity=qty,
            total_price=cost
        ))

    # 9. Send notification
    gear_msg = f" + {len(rental_outs)} equipment item(s)" if rental_outs else ""
    notif = Notification(
        user_id=current_user.id,
        title="Payment Verified & Turf Booked! ⚽",
        message=f"Payment of ₹{total_amount:.2f} received. Booking {booking.booking_reference} for {turf.name} on {booking.booking_date} ({booking.start_time} - {booking.end_time}){gear_msg} is confirmed.",
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
        payment_id=payment.transaction_id,
        equipment_rentals=rental_outs
    )

@router.post("/razorpay/create-equipment-order", response_model=RazorpayOrderOut)
def create_equipment_order(
    order_in: EquipmentOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates standalone equipment inventory, computes rental cost for specified hours,
    and creates a Razorpay order.
    """
    turf = db.query(Turf).filter(Turf.id == order_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf facility not found")

    total_amount = 0.0
    items_count = 0
    for req in order_in.items:
        eq_id = req.get("equipment_id")
        qty = int(req.get("quantity", 0))
        if not eq_id or qty <= 0:
            continue
        eq_item = db.query(Equipment).filter(Equipment.id == eq_id, Equipment.turf_id == turf.id).first()
        if not eq_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Equipment ID {eq_id} not found at this turf")
        if eq_item.available_quantity < qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {eq_item.available_quantity} units of '{eq_item.name}' available."
            )
        total_amount += (eq_item.price_per_hour * qty * order_in.hours)
        items_count += qty

    if total_amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid items in rental request")

    receipt_code = f"EQP_{current_user.id}_{int(datetime.utcnow().timestamp())}"
    rzp_order = razorpay_service.create_order(
        amount_inr=total_amount,
        receipt=receipt_code,
        notes={
            "user_id": str(current_user.id),
            "turf_id": str(turf.id),
            "turf_name": turf.name,
            "hours": str(order_in.hours),
            "date": order_in.rental_date,
            "type": "equipment_rental"
        }
    )

    return RazorpayOrderOut(
        order_id=rzp_order["id"],
        amount=rzp_order["amount"],
        currency=rzp_order["currency"],
        key_id=rzp_order["key_id"],
        is_mock=rzp_order["is_mock"],
        total_amount_inr=total_amount,
        title=f"Equipment Rental at {turf.name}",
        description=f"{items_count} item(s) for {order_in.hours} hr(s) on {order_in.rental_date}"
    )

@router.post("/razorpay/verify-equipment-rental", response_model=BookingDetailOut, status_code=status.HTTP_201_CREATED)
def verify_equipment_rental(
    verify_in: EquipmentRentalVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifies Razorpay payment signature and confirms standalone equipment rental.
    Records booking, payment, and inventory update.
    """
    # 1. Cryptographic HMAC Signature Verification
    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=verify_in.razorpay_order_id,
        razorpay_payment_id=verify_in.razorpay_payment_id,
        razorpay_signature=verify_in.razorpay_signature
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed: Invalid cryptographic signature from Razorpay."
        )

    # 2. Check turf
    turf = db.query(Turf).filter(Turf.id == verify_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf facility not found")

    ground = db.query(Ground).filter(Ground.turf_id == turf.id).first()
    if not ground:
        ground = Ground(
            turf_id=turf.id,
            name="Facility Front Desk",
            sport_type="General",
            surface_type="Inventory Reception",
            hourly_rate=0.0
        )
        db.add(ground)
        db.flush()

    # 3. Calculate and validate equipment
    items_to_rent = []
    total_amount = 0.0
    for req in verify_in.items:
        eq_id = req.get("equipment_id")
        qty = int(req.get("quantity", 0))
        if not eq_id or qty <= 0:
            continue
        eq_item = db.query(Equipment).filter(Equipment.id == eq_id, Equipment.turf_id == turf.id).first()
        if not eq_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Equipment {eq_id} not found.")
        if eq_item.available_quantity < qty:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock for '{eq_item.name}'.")

        cost = eq_item.price_per_hour * qty * verify_in.hours
        total_amount += cost
        items_to_rent.append({
            "item": eq_item,
            "quantity": qty,
            "cost": cost
        })

    if not items_to_rent:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid items to rent.")

    # 4. Create Booking record for reservation & receipts
    booking_ref = f"EQP-{uuid.uuid4().hex[:5].upper()}"
    booking = Booking(
        booking_reference=booking_ref,
        user_id=current_user.id,
        turf_id=turf.id,
        ground_id=ground.id,
        booking_date=verify_in.rental_date,
        start_time="Gear Pickup",
        end_time=f"{verify_in.hours} hr rental",
        total_amount=total_amount,
        discount_amount=0.0,
        final_amount=total_amount,
        status=BookingStatusEnum.CONFIRMED,
        customer_notes=verify_in.customer_notes or f"Sports gear rental for {verify_in.hours} hr(s) at {turf.name}"
    )
    db.add(booking)
    db.flush()

    # 5. Create Payment record
    payment = Payment(
        booking_id=booking.id,
        user_id=current_user.id,
        amount=total_amount,
        currency="INR",
        payment_method=verify_in.payment_method,
        gateway_order_id=verify_in.razorpay_order_id,
        gateway_payment_id=verify_in.razorpay_payment_id,
        status=PaymentStatusEnum.SUCCESS,
        paid_at=datetime.utcnow()
    )
    db.add(payment)

    # 6. Record equipment rentals and adjust stock
    rental_outs = []
    for info in items_to_rent:
        eq_item = info["item"]
        qty = info["quantity"]
        cost = info["cost"]
        eq_item.available_quantity -= qty
        rental = EquipmentRental(
            booking_id=booking.id,
            equipment_id=eq_item.id,
            user_id=current_user.id,
            quantity=qty,
            rental_date=verify_in.rental_date,
            total_price=cost,
            status="RENTED"
        )
        db.add(rental)
        db.flush()
        rental_outs.append(EquipmentRentalItemOut(
            id=rental.id,
            equipment_id=eq_item.id,
            name=eq_item.name,
            category=eq_item.category,
            quantity=qty,
            total_price=cost
        ))

    # 7. Notification
    notif = Notification(
        user_id=current_user.id,
        title="Equipment Rental Confirmed! 🎽",
        message=f"Rental {booking.booking_reference} ({len(rental_outs)} item(s) for {verify_in.hours} hr(s)) confirmed at {turf.name}. Paid: ₹{total_amount:.2f}.",
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
        ground_name="Equipment Desk",
        customer_name=current_user.full_name,
        customer_email=current_user.email,
        customer_phone=current_user.phone,
        payment_status=payment.status.value,
        payment_id=payment.transaction_id,
        equipment_rentals=rental_outs
    )

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
    rentals = db.query(EquipmentRental).filter(EquipmentRental.booking_id == booking.id).all()
    rental_items = []
    for r in rentals:
        eq = db.query(Equipment).filter(Equipment.id == r.equipment_id).first()
        rental_items.append({
            "name": eq.name if eq else "Equipment",
            "quantity": r.quantity,
            "price": r.total_price
        })

    return {
        "booking_id": booking.booking_reference,
        "turf_name": booking.turf.name if booking.turf else "PlayZone Arena",
        "ground_name": booking.ground.name if booking.ground else "Turf A",
        "date": booking.booking_date,
        "time": f"{booking.start_time} - {booking.end_time}",
        "amount": booking.final_amount,
        "payment_method": payment.payment_method.value if payment else "UPI",
        "transaction_id": payment.transaction_id if payment else "N/A",
        "gateway_order_id": payment.gateway_order_id if payment else None,
        "gateway_payment_id": payment.gateway_payment_id if payment else None,
        "status": payment.status.value if payment else "SUCCESS",
        "customer_name": booking.user.full_name if booking.user else "Customer",
        "customer_email": booking.user.email if booking.user else "",
        "equipment_rentals": rental_items
    }
