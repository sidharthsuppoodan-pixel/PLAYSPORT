from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.review import Review
from app.models.turf import Turf
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["Reviews"])

def get_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[1][0]}".upper()
    elif len(parts) == 1 and parts[0]:
        return parts[0][:2].upper()
    return "PS"

@router.get("/by-turf/{turf_id}", response_model=List[ReviewOut])
def list_reviews_by_turf(turf_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.turf_id == turf_id).order_by(Review.created_at.desc()).all()
    results = []
    for r in reviews:
        user = db.query(User).filter(User.id == r.user_id).first()
        user_name = user.full_name if user else "Verified Customer"
        initials = r.user_initials or get_initials(user_name)
        results.append(ReviewOut(
            id=r.id,
            turf_id=r.turf_id,
            user_id=r.user_id,
            user_name=user_name,
            user_initials=initials,
            rating=r.rating,
            comment=r.comment,
            is_verified=r.is_verified,
            created_at=r.created_at,
            formatted_date=r.created_at.strftime("%b %d, %Y")
        ))
    return results

@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def submit_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    turf = db.query(Turf).filter(Turf.id == review_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")

    initials = get_initials(current_user.full_name)

    review = Review(
        turf_id=review_in.turf_id,
        user_id=current_user.id,
        booking_id=review_in.booking_id,
        rating=review_in.rating,
        comment=review_in.comment,
        is_verified=True,
        user_initials=initials
    )
    db.add(review)

    # Recalculate average turf rating
    all_turf_reviews = db.query(Review).filter(Review.turf_id == turf.id).all()
    ratings = [r.rating for r in all_turf_reviews] + [review_in.rating]
    turf.rating = round(sum(ratings) / len(ratings), 1)
    turf.review_count = len(ratings)

    db.commit()
    db.refresh(review)

    return ReviewOut(
        id=review.id,
        turf_id=review.turf_id,
        user_id=review.user_id,
        user_name=current_user.full_name,
        user_initials=initials,
        rating=review.rating,
        comment=review.comment,
        is_verified=review.is_verified,
        created_at=review.created_at,
        formatted_date=review.created_at.strftime("%b %d, %Y")
    )
