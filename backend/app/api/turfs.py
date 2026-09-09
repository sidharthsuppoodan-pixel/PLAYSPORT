import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_owner_or_admin, get_current_user
from app.models.turf import Turf
from app.models.ground import Ground
from app.models.user import User, RoleEnum
from app.schemas.turf import TurfCreate, TurfUpdate, TurfOut, TurfDetailOut

router = APIRouter(prefix="/turfs", tags=["Turfs"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text)

@router.get("", response_model=List[TurfOut])
def list_turfs(
    city: Optional[str] = Query(None, description="Filter by city"),
    sport: Optional[str] = Query(None, description="Filter by sport"),
    search: Optional[str] = Query(None, description="General search term"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Turf).filter(Turf.is_active == True)
    
    if city:
        query = query.filter(Turf.city.ilike(f"%{city}%"))
    if sport and sport != "All Sports":
        query = query.filter(Turf.sports_supported.ilike(f"%{sport}%"))
    if search:
        query = query.filter(
            (Turf.name.ilike(f"%{search}%")) |
            (Turf.city.ilike(f"%{search}%")) |
            (Turf.address.ilike(f"%{search}%")) |
            (Turf.sports_supported.ilike(f"%{search}%"))
        )
    
    return query.order_by(Turf.rating.desc(), Turf.created_at.desc()).limit(limit).all()

@router.get("/popular", response_model=List[TurfOut])
def get_popular_turfs(
    limit: int = Query(6, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Returns popular active turfs ordered by rating and newest creation."""
    return db.query(Turf).filter(Turf.is_active == True).order_by(Turf.rating.desc(), Turf.created_at.desc()).limit(limit).all()

@router.get("/my-turfs", response_model=List[TurfOut])
def get_my_turfs(
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    """Returns turfs owned specifically by the logged-in owner."""
    if current_user.role == RoleEnum.ADMIN:
        return db.query(Turf).order_by(Turf.created_at.desc()).all()
    
    return db.query(Turf).filter(Turf.owner_id == current_user.id).order_by(Turf.created_at.desc()).all()

@router.get("/{id_or_slug}", response_model=TurfDetailOut)
def get_turf_by_id_or_slug(id_or_slug: str, db: Session = Depends(get_db)):
    if id_or_slug.isdigit():
        turf = db.query(Turf).filter(Turf.id == int(id_or_slug)).first()
    else:
        turf = db.query(Turf).filter(Turf.slug == id_or_slug).first()
    
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")
    
    return turf

@router.post("", response_model=TurfOut, status_code=status.HTTP_201_CREATED)
def create_turf(
    turf_in: TurfCreate,
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    # Generate unique slug
    base_slug = slugify(turf_in.name)
    slug = base_slug
    counter = 1
    while db.query(Turf).filter(Turf.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    turf = Turf(
        owner_id=current_user.id,
        name=turf_in.name,
        slug=slug,
        description=turf_in.description,
        address=turf_in.address,
        city=turf_in.city,
        state=turf_in.state,
        pincode=turf_in.pincode,
        latitude=turf_in.latitude,
        longitude=turf_in.longitude,
        contact_phone=turf_in.contact_phone or current_user.phone,
        contact_email=turf_in.contact_email or current_user.email,
        starting_price=turf_in.starting_price,
        dimension_text=turf_in.dimension_text,
        sports_supported=turf_in.sports_supported,
        facilities_json=None,
        images_json=None,
        opening_time=turf_in.opening_time,
        closing_time=turf_in.closing_time,
        is_active=True
    )
    turf.facilities = turf_in.facilities
    turf.images = turf_in.images
    
    db.add(turf)
    db.commit()
    db.refresh(turf)
    
    # Also create a default ground for this turf
    default_ground = Ground(
        turf_id=turf.id,
        name="Main Arena (5v5)",
        sport_type="Football",
        ground_size="5v5",
        surface_type="FIFA Approved Artificial Turf",
        hourly_rate=turf.starting_price,
        is_active=True
    )
    db.add(default_ground)
    db.commit()
    
    return turf

@router.put("/{turf_id}", response_model=TurfOut)
def update_turf(
    turf_id: int,
    turf_in: TurfUpdate,
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    turf = db.query(Turf).filter(Turf.id == turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")
    
    if current_user.role != RoleEnum.ADMIN and turf.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this turf")
    
    update_data = turf_in.model_dump(exclude_unset=True)
    if "facilities" in update_data:
        turf.facilities = update_data.pop("facilities")
    if "images" in update_data:
        turf.images = update_data.pop("images")
        
    for field, value in update_data.items():
        setattr(turf, field, value)
        
    db.commit()
    db.refresh(turf)
    return turf
