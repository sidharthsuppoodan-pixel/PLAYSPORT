from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User, RoleEnum
from app.models.turf import Turf
from app.models.booking import Booking, BookingStatusEnum
from app.models.payment import Payment, PaymentStatusEnum
from app.models.audit_log import AuditLog
from app.models.notification import Notification, NotificationTypeEnum
from app.models.slot import TimeSlot, SlotStatusEnum
from app.models.ground import Ground
from app.schemas.user import UserOut
from app.schemas.admin import (
    AdminMetricsOut, RevenueChartPoint, PendingOwnerOut, AdminFacilityOut,
    AdminBookingOut, AdminSlotOut, AdminAnalyticsOut
)

router = APIRouter(prefix="/admin", tags=["Super Administrator"])

@router.get("/metrics", response_model=AdminMetricsOut)
def get_admin_dashboard_metrics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users_count = db.query(User).count()
    approved_owners_count = db.query(User).filter(User.role == RoleEnum.OWNER, User.is_approved == True).count()
    pending_approvals_count = db.query(User).filter(User.role == RoleEnum.OWNER, User.is_approved == False).count()
    
    # Total revenue from payments
    payments = db.query(Payment).filter(Payment.status == PaymentStatusEnum.SUCCESS).all()
    real_rev = float(sum(p.amount for p in payments))
    
    if real_rev >= 100000:
        rev_display = f"₹{real_rev / 100000:.1f}L"
    else:
        rev_display = f"₹{real_rev:,.0f}"

    # Unique owner cities count
    owner_cities = db.query(User.city).filter(User.role == RoleEnum.OWNER, User.city.isnot(None)).distinct().count()

    return AdminMetricsOut(
        total_users=total_users_count,
        approved_owners=approved_owners_count,
        pending_approvals=pending_approvals_count,
        total_revenue=real_rev,
        total_revenue_display=rev_display,
        user_growth_pct="Real-time count",
        owner_regions_count=owner_cities,
        revenue_growth_pct="Real-time tracking"
    )

@router.get("/revenue-chart", response_model=dict)
def get_revenue_chart_data(
    period: str = Query("monthly", regex="^(monthly|weekly)$"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Fetch real payment data
    payments = db.query(Payment).filter(Payment.status == PaymentStatusEnum.SUCCESS).all()
    total_revenue = sum(p.amount for p in payments)

    if period == "monthly":
        series = [
            {"label": "Current", "revenue": total_revenue, "display_value": f"₹{total_revenue:,.0f}"}
        ]
    else:
        series = [
            {"label": "This Week", "revenue": total_revenue, "display_value": f"₹{total_revenue:,.0f}"}
        ]
    return {"period": period, "data": series}

@router.get("/pending-owners", response_model=List[PendingOwnerOut])
def list_pending_owners(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    pending_owners = db.query(User).filter(
        User.role == RoleEnum.OWNER,
        User.is_approved == False
    ).order_by(User.created_at.desc()).all()
    
    return [
        PendingOwnerOut(
            id=o.id,
            business_name=o.business_name or "Sports Facility Arena",
            owner_name=o.full_name,
            email=o.email,
            phone=o.phone,
            city=o.city or "Kerala",
            created_at=o.created_at,
            formatted_date=o.created_at.strftime("%b %d, %Y")
        )
        for o in pending_owners
    ]

@router.post("/pending-owners/{owner_id}/approve", response_model=dict)
def approve_owner(
    owner_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    owner = db.query(User).filter(User.id == owner_id, User.role == RoleEnum.OWNER).first()
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")
    
    owner.is_approved = True
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="APPROVE_TURF_OWNER",
        entity_type="USER",
        entity_id=str(owner.id),
        details=f"Approved Turf Owner {owner.full_name} ({owner.business_name})"
    )
    db.add(audit)
    
    # Notification to owner
    notif = Notification(
        user_id=owner.id,
        title="Account Approved! 🎉",
        message="Your Turf Owner account has been approved by the Administrator. You can now create turfs and manage slots.",
        type=NotificationTypeEnum.ADMIN,
        link="/owner/dashboard"
    )
    db.add(notif)
    
    db.commit()
    return {"message": f"Owner '{owner.full_name}' successfully approved.", "id": owner_id}

@router.post("/pending-owners/{owner_id}/reject", response_model=dict)
def reject_owner(
    owner_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    owner = db.query(User).filter(User.id == owner_id, User.role == RoleEnum.OWNER).first()
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="REJECT_TURF_OWNER",
        entity_type="USER",
        entity_id=str(owner.id),
        details=f"Rejected Turf Owner application for {owner.full_name}"
    )
    db.add(audit)
    
    db.delete(owner)
    db.commit()
    return {"message": f"Owner request rejected and removed.", "id": owner_id}

@router.get("/users", response_model=List[UserOut])
def list_all_users(
    role: Optional[RoleEnum] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()

@router.get("/facilities", response_model=List[AdminFacilityOut])
def list_facilities_for_admin(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    turfs = db.query(Turf).all()
    results = []
    for turf in turfs:
        bookings_count = db.query(Booking).filter(Booking.turf_id == turf.id).count()
        payments = db.query(Payment).join(Booking).filter(
            Booking.turf_id == turf.id,
            Payment.status == PaymentStatusEnum.SUCCESS
        ).all()
        total_rev = sum(p.amount for p in payments)
        
        results.append(
            AdminFacilityOut(
                id=turf.id,
                name=turf.name,
                owner_name=turf.owner.full_name if turf.owner else "Unknown",
                city=turf.city or "Unknown",
                total_bookings=bookings_count,
                total_revenue=total_rev,
                created_at=turf.created_at or datetime.utcnow()
            )
        )
    return results

@router.delete("/facilities/{turf_id}", response_model=dict)
def terminate_facility(
    turf_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    turf = db.query(Turf).filter(Turf.id == turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")
    
    turf_name = turf.name
    
    audit = AuditLog(
        user_id=current_user.id,
        action="TERMINATE_TURF",
        entity_type="TURF",
        entity_id=str(turf.id),
        details=f"Terminated and deleted Turf: {turf_name}"
    )
    db.add(audit)
    
    db.delete(turf)
    db.commit()
    
    return {"message": f"Turf '{turf_name}' has been terminated successfully."}

@router.get("/bookings", response_model=List[AdminBookingOut])
def get_all_bookings_for_admin(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(100).all()
    results = []
    for b in bookings:
        results.append(AdminBookingOut(
            id=b.id,
            reference=b.booking_reference,
            customer_name=b.user.full_name if b.user else "Unknown",
            turf_name=b.turf.name if b.turf else "Unknown",
            date=b.booking_date.strftime("%b %d, %Y") if isinstance(b.booking_date, datetime) else str(b.booking_date),
            time=f"{b.start_time.strftime('%H:%M')} - {b.end_time.strftime('%H:%M')}" if not isinstance(b.start_time, str) else f"{b.start_time} - {b.end_time}",
            amount=b.final_amount,
            status=b.status.value
        ))
    return results

@router.get("/schedules", response_model=List[AdminSlotOut])
def get_all_schedules_for_admin(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Get upcoming slots limit 100 for global view
    today_str = datetime.now().date().isoformat()
    slots = db.query(TimeSlot).filter(TimeSlot.slot_date >= today_str).order_by(TimeSlot.slot_date.asc(), TimeSlot.start_time.asc()).limit(100).all()
    
    results = []
    for s in slots:
        results.append(AdminSlotOut(
            id=s.id,
            turf_name=s.ground.turf.name if s.ground and s.ground.turf else "Unknown",
            ground_name=s.ground.name if s.ground else "Unknown",
            date=s.slot_date.strftime("%b %d, %Y") if isinstance(s.slot_date, datetime) else str(s.slot_date),
            time=f"{s.start_time.strftime('%H:%M')} - {s.end_time.strftime('%H:%M')}" if not isinstance(s.start_time, str) else f"{s.start_time} - {s.end_time}",
            price=s.price,
            status=s.status.value
        ))
    return results

@router.get("/analytics", response_model=AdminAnalyticsOut)
def get_admin_analytics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    city_counts = {}
    
    # 1. Group turfs by city
    turfs = db.query(Turf).all()
    for t in turfs:
        c = (t.city or "").strip()
        if c:
            title_c = c.title()
            city_counts[title_c] = city_counts.get(title_c, 0) + 1
            
    # 2. Include owner/user cities
    users_with_city = db.query(User).filter(User.city.isnot(None)).all()
    for u in users_with_city:
        c = (u.city or "").strip()
        if c:
            title_c = c.title()
            # Count user/owner presence if not already heavily counted by turfs
            if title_c not in city_counts:
                city_counts[title_c] = 1

    bookings_by_city = [{"name": k, "value": v} for k, v in city_counts.items()]
    
    # Revenue per turf
    revenue_by_turf = []
    for t in turfs:
        payments = db.query(Payment).join(Booking).filter(
            Booking.turf_id == t.id,
            Payment.status == PaymentStatusEnum.SUCCESS
        ).all()
        rev = sum(p.amount for p in payments)
        revenue_by_turf.append({"name": t.name, "revenue": float(rev)})
        
    return AdminAnalyticsOut(
        bookings_by_city=bookings_by_city,
        revenue_by_turf=revenue_by_turf
    )
