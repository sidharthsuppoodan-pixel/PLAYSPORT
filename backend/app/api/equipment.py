from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_owner_or_admin
from app.models.equipment import Equipment, EquipmentRental
from app.models.turf import Turf
from app.models.user import User
from app.schemas.equipment import EquipmentCreate, EquipmentOut, EquipmentRentalRequest

router = APIRouter(prefix="/equipment", tags=["Equipment Rental"])

@router.get("", response_model=List[EquipmentOut])
def list_equipment(
    turf_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Equipment)
    if turf_id:
        query = query.filter(Equipment.turf_id == turf_id)
    if category and category != "All":
        query = query.filter(Equipment.category == category)
    return query.all()

@router.post("", response_model=EquipmentOut, status_code=status.HTTP_201_CREATED)
def create_equipment(
    eq_in: EquipmentCreate,
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    turf = db.query(Turf).filter(Turf.id == eq_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")

    equipment = Equipment(
        turf_id=eq_in.turf_id,
        name=eq_in.name,
        category=eq_in.category,
        total_quantity=eq_in.total_quantity,
        available_quantity=eq_in.available_quantity,
        price_per_hour=eq_in.price_per_hour,
        deposit_amount=eq_in.deposit_amount,
        image_url=eq_in.image_url,
        description=eq_in.description
    )
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment
