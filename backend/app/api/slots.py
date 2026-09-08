from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_owner_or_admin
from app.models.slot import TimeSlot, SlotStatusEnum
from app.models.ground import Ground
from app.models.turf import Turf
from app.models.user import User, RoleEnum
from app.schemas.slot import SlotCreate, SlotOut, DateSlotsGroup, SlotBatchGenerate

router = APIRouter(prefix="/slots", tags=["Time Slots"])

def parse_slot_time_to_datetime(date_str: str, time_str: str) -> Optional[datetime]:
    """Combines YYYY-MM-DD date_str and time_str into a Python datetime object."""
    time_str = time_str.strip()
    for fmt in ("%Y-%m-%d %I:%M %p", "%Y-%m-%d %I:%M%p", "%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(f"{date_str} {time_str}", fmt)
        except ValueError:
            pass
    return None

def cleanup_expired_slots(db: Session, ground_id: int):
    """Deletes unbooked AVAILABLE time slots whose end time is in the past."""
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    
    # 1. Delete past date available slots
    past_slots = db.query(TimeSlot).filter(
        TimeSlot.ground_id == ground_id,
        TimeSlot.status == SlotStatusEnum.AVAILABLE,
        TimeSlot.slot_date < today_str
    ).all()
    for ps in past_slots:
        db.delete(ps)

    # 2. Delete today's available slots whose end time has passed
    today_slots = db.query(TimeSlot).filter(
        TimeSlot.ground_id == ground_id,
        TimeSlot.status == SlotStatusEnum.AVAILABLE,
        TimeSlot.slot_date == today_str
    ).all()

    for ts in today_slots:
        end_dt = parse_slot_time_to_datetime(ts.slot_date, ts.end_time)
        start_dt = parse_slot_time_to_datetime(ts.slot_date, ts.start_time)
        if (end_dt and end_dt <= now) or (start_dt and start_dt <= now):
            db.delete(ts)

    db.commit()

@router.get("/by-ground/{ground_id}", response_model=List[DateSlotsGroup])
def get_slots_by_ground(
    ground_id: int,
    days: int = Query(7, ge=1, le=14),
    db: Session = Depends(get_db)
):
    ground = db.query(Ground).filter(Ground.id == ground_id).first()
    if not ground:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ground not found")

    # Perform auto-cleanup of expired unbooked slots
    cleanup_expired_slots(db, ground.id)

    now = datetime.now()
    result: List[DateSlotsGroup] = []

    for i in range(days):
        target_date = now + timedelta(days=i)
        date_str = target_date.strftime("%Y-%m-%d")
        day_name = "TODAY" if i == 0 else target_date.strftime("%a").upper()
        display_date = target_date.strftime("%d %b") # e.g. "14 Oct"
        
        # Only fetch slots explicitly created in the database for this date
        slots = db.query(TimeSlot).filter(
            TimeSlot.ground_id == ground.id,
            TimeSlot.slot_date == date_str
        ).order_by(TimeSlot.id.asc()).all()
        
        # Filter out slots in the past if checking today
        valid_slots = []
        for s in slots:
            if i == 0:
                st_dt = parse_slot_time_to_datetime(s.slot_date, s.start_time)
                if st_dt and st_dt <= now:
                    continue
            valid_slots.append(s)

        result.append(DateSlotsGroup(
            date=date_str,
            day_name=day_name,
            display_date=display_date,
            is_today=(i == 0),
            slots=[SlotOut.model_validate(s) for s in valid_slots]
        ))

    return result

@router.post("/batch-generate", response_model=dict)
def batch_generate_slots(
    payload: SlotBatchGenerate,
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    ground = None
    if payload.ground_id:
        ground = db.query(Ground).filter(Ground.id == payload.ground_id).first()
    
    if not ground and payload.turf_id:
        ground = db.query(Ground).filter(Ground.turf_id == payload.turf_id).first()
        if not ground:
            # Create a default ground for this turf if missing
            turf = db.query(Turf).filter(Turf.id == payload.turf_id).first()
            if turf:
                ground = Ground(
                    turf_id=turf.id,
                    name="Main Ground",
                    sport_type="Football",
                    ground_size="5v5",
                    hourly_rate=payload.hourly_price or turf.starting_price,
                    is_active=True
                )
                db.add(ground)
                db.commit()
                db.refresh(ground)

    if ground and current_user.role != RoleEnum.ADMIN:
        turf = db.query(Turf).filter(Turf.id == ground.turf_id).first()
        if not turf or turf.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only generate slots for grounds in your own turf.")

    if not ground:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No valid ground found for your turf to generate slots.")

    created_count = 0
    start_dt = datetime.strptime(payload.start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(payload.end_date, "%Y-%m-%d")
    now = datetime.now()
    
    cur_dt = start_dt
    while cur_dt <= end_dt:
        date_str = cur_dt.strftime("%Y-%m-%d")
        for hr in range(payload.start_time_hour, payload.end_time_hour):
            st_time = f"{hr:02d}:00"
            end_time = f"{(hr+1):02d}:00"

            # Don't create slots in the past
            st_dt_full = parse_slot_time_to_datetime(date_str, st_time)
            if st_dt_full and st_dt_full <= now:
                continue
            
            existing = db.query(TimeSlot).filter(
                TimeSlot.ground_id == ground.id,
                TimeSlot.slot_date == date_str,
                TimeSlot.start_time == st_time
            ).first()
            
            if not existing:
                new_slot = TimeSlot(
                    ground_id=ground.id,
                    slot_date=date_str,
                    start_time=st_time,
                    end_time=end_time,
                    price=payload.hourly_price,
                    status=SlotStatusEnum.AVAILABLE
                )
                db.add(new_slot)
                created_count += 1
        cur_dt += timedelta(days=1)
        
    db.commit()
    return {"message": f"Successfully generated {created_count} slots.", "created_count": created_count}
