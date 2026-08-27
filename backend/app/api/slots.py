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

DEFAULT_HOURS = [
    ("06:00 AM", "07:00 AM"),
    ("07:00 AM", "08:00 AM"),
    ("08:00 AM", "09:00 AM"),
    ("09:00 AM", "10:00 AM"),
    ("10:00 AM", "11:00 AM"),
    ("11:00 AM", "12:00 PM"),
    ("04:00 PM", "05:00 PM"),
    ("05:00 PM", "06:00 PM"),
    ("06:00 PM", "07:00 PM"),
    ("07:00 PM", "08:00 PM"),
    ("08:00 PM", "09:00 PM"),
    ("09:00 PM", "10:00 PM"),
]

def ensure_slots_for_ground_date(db: Session, ground: Ground, date_str: str) -> List[TimeSlot]:
    """Auto-generates default slots for a ground on a given date if none exist yet."""
    existing_slots = db.query(TimeSlot).filter(
        TimeSlot.ground_id == ground.id,
        TimeSlot.slot_date == date_str
    ).order_by(TimeSlot.id.asc()).all()

    if existing_slots:
        return existing_slots

    new_slots = []
    for start_t, end_t in DEFAULT_HOURS:
        slot = TimeSlot(
            ground_id=ground.id,
            slot_date=date_str,
            start_time=start_t,
            end_time=end_t,
            price=ground.hourly_rate,
            status=SlotStatusEnum.AVAILABLE
        )
        db.add(slot)
        new_slots.append(slot)
    
    db.commit()
    for s in new_slots:
        db.refresh(s)
    return new_slots

@router.get("/by-ground/{ground_id}", response_model=List[DateSlotsGroup])
def get_slots_by_ground(
    ground_id: int,
    days: int = Query(7, ge=1, le=14),
    db: Session = Depends(get_db)
):
    ground = db.query(Ground).filter(Ground.id == ground_id).first()
    if not ground:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ground not found")

    today = datetime.now()
    result: List[DateSlotsGroup] = []

    for i in range(days):
        target_date = today + timedelta(days=i)
        date_str = target_date.strftime("%Y-%m-%d")
        day_name = "TODAY" if i == 0 else target_date.strftime("%a").upper()
        display_date = target_date.strftime("%d %b") # e.g. "14 Oct"
        
        slots = ensure_slots_for_ground_date(db, ground, date_str)
        
        result.append(DateSlotsGroup(
            date=date_str,
            day_name=day_name,
            display_date=display_date,
            is_today=(i == 0),
            slots=[SlotOut.model_validate(s) for s in slots]
        ))

    return result

@router.post("/batch-generate", response_model=dict)
def batch_generate_slots(
    payload: SlotBatchGenerate,
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    ground = db.query(Ground).filter(Ground.id == payload.ground_id).first()
    if not ground:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ground not found")

    created_count = 0
    start_dt = datetime.strptime(payload.start_date, "%Y-%m-%d")
    end_dt = datetime.strptime(payload.end_date, "%Y-%m-%d")
    
    cur_dt = start_dt
    while cur_dt <= end_dt:
        date_str = cur_dt.strftime("%Y-%m-%d")
        for hr in range(payload.start_time_hour, payload.end_time_hour):
            st_time = f"{hr:02d}:00"
            end_time = f"{(hr+1):02d}:00"
            
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
