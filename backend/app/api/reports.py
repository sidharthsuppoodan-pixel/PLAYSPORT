from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_owner_or_admin
from app.models.user import User, RoleEnum
from app.models.turf import Turf
from app.models.ground import Ground
from app.models.booking import Booking, BookingStatusEnum
from app.models.payment import Payment, PaymentStatusEnum
from app.models.open_match import OpenMatch, MatchStatusEnum
from app.schemas.admin import OwnerDashboardMetricsOut, FacilityStatusItem, RecentBookingItem

router = APIRouter(prefix="/reports", tags=["Reports & Manager Analytics"])

def get_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[1][0]}".upper()
    elif len(parts) == 1 and parts[0]:
        return parts[0][:2].upper()
    return "US"

@router.get("/owner-dashboard", response_model=OwnerDashboardMetricsOut)
def get_owner_dashboard_metrics(
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    if current_user.role == RoleEnum.ADMIN:
        turfs_count = db.query(Turf).count()
        matches_count = db.query(OpenMatch).filter(OpenMatch.status.in_([MatchStatusEnum.OPEN, MatchStatusEnum.IN_PROGRESS])).count()
        bookings_count = db.query(Booking).count()
        payments = db.query(Payment).filter(Payment.status == PaymentStatusEnum.SUCCESS).all()
        rev_today = float(sum(p.amount for p in payments))
    else:
        turfs = db.query(Turf).filter(Turf.owner_id == current_user.id).all()
        turf_ids = [t.id for t in turfs]
        turfs_count = len(turf_ids)
        
        matches_count = db.query(OpenMatch).filter(OpenMatch.turf_id.in_(turf_ids)).count() if turf_ids else 0
        bookings_count = db.query(Booking).filter(Booking.turf_id.in_(turf_ids)).count() if turf_ids else 0
        payments = db.query(Payment).join(Booking).filter(Booking.turf_id.in_(turf_ids), Payment.status == PaymentStatusEnum.SUCCESS).all() if turf_ids else []
        rev_today = float(sum(p.amount for p in payments))

    if rev_today >= 100000:
        rev_display = f"₹{rev_today / 100000:.1f}L"
    else:
        rev_display = f"₹{rev_today:,.0f}"

    return OwnerDashboardMetricsOut(
        total_turfs=turfs_count,
        todays_bookings=bookings_count,
        revenue_today=rev_today,
        revenue_today_display=rev_display,
        revenue_projected_display=f"Total Rev: {rev_display}",
        active_matches=matches_count
    )

@router.get("/recent-bookings", response_model=List[RecentBookingItem])
def get_recent_bookings_table(
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    # Retrieve recent real bookings filtered by user role
    if current_user.role == RoleEnum.ADMIN:
        bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(10).all()
    else:
        turfs = db.query(Turf).filter(Turf.owner_id == current_user.id).all()
        turf_ids = [t.id for t in turfs]
        if not turf_ids:
            return []
        bookings = db.query(Booking).filter(Booking.turf_id.in_(turf_ids)).order_by(Booking.created_at.desc()).limit(10).all()

    results = []
    for b in bookings:
        cust_name = b.user.full_name if b.user else "Customer"
        results.append(RecentBookingItem(
            id=b.id,
            booking_reference=f"#{b.booking_reference}",
            customer_name=cust_name,
            customer_initials=get_initials(cust_name),
            turf_name=b.turf.name if b.turf else "Arena",
            ground_name=b.ground.name if b.ground else "Main Ground",
            time_display=f"Today, {b.start_time} - {b.end_time}",
            status="Confirmed" if b.status == BookingStatusEnum.CONFIRMED else "Pending",
            amount=b.final_amount
        ))
    return results

@router.get("/facility-status", response_model=List[FacilityStatusItem])
def get_facility_status(
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    if current_user.role == RoleEnum.ADMIN:
        grounds = db.query(Ground).all()
    else:
        turfs = db.query(Turf).filter(Turf.owner_id == current_user.id).all()
        turf_ids = [t.id for t in turfs]
        if not turf_ids:
            return []
        grounds = db.query(Ground).filter(Ground.turf_id.in_(turf_ids)).all()

    items = []
    for g in grounds:
        active_booking = db.query(Booking).filter(
            Booking.ground_id == g.id,
            Booking.status == BookingStatusEnum.CONFIRMED
        ).first()
        if active_booking:
            status = "BOOKED"
            status_text = f"Booked ({active_booking.start_time}-{active_booking.end_time})"
            is_available = False
        else:
            status = "AVAILABLE"
            status_text = "Available Now"
            is_available = True

        items.append(FacilityStatusItem(
            id=g.id,
            name=f"{g.name} ({g.ground_size})" if g.ground_size else g.name,
            sport_type=g.sport_type,
            status=status,
            status_text=status_text,
            is_available=is_available
        ))
    return items
