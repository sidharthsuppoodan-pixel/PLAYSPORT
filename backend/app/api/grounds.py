from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_owner_or_admin
from app.models.ground import Ground
from app.models.turf import Turf
from app.models.user import User, RoleEnum
from app.schemas.ground import GroundCreate, GroundUpdate, GroundOut

router = APIRouter(prefix="/grounds", tags=["Grounds & Pitches"])

@router.get("/by-turf/{turf_id}", response_model=List[GroundOut])
def get_grounds_by_turf(turf_id: int, db: Session = Depends(get_db)):
    return db.query(Ground).filter(Ground.turf_id == turf_id, Ground.is_active == True).all()

@router.post("", response_model=GroundOut, status_code=status.HTTP_201_CREATED)
def create_ground(
    ground_in: GroundCreate,
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    turf = db.query(Turf).filter(Turf.id == ground_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")
    
    if current_user.role != RoleEnum.ADMIN and turf.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this turf")
    
    ground = Ground(
        turf_id=ground_in.turf_id,
        name=ground_in.name,
        sport_type=ground_in.sport_type,
        ground_size=ground_in.ground_size,
        surface_type=ground_in.surface_type,
        hourly_rate=ground_in.hourly_rate,
        is_active=ground_in.is_active
    )
    db.add(ground)
    db.commit()
    db.refresh(ground)
    return ground
