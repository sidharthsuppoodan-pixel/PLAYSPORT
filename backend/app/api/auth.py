from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.models.user import User, RoleEnum
from app.models.notification import Notification, NotificationTypeEnum
from app.schemas.user import UserCreate, OwnerRegister, UserLogin, Token, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_customer(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email or username exists
    existing_user = db.query(User).filter(
        (User.email == user_in.email) | (User.username == user_in.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or username already exists."
        )
    
    new_user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        phone=user_in.phone,
        hashed_password=get_password_hash(user_in.password),
        role=RoleEnum.CUSTOMER,
        is_active=True,
        is_verified=True,
        is_approved=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send welcome notification
    welcome_notif = Notification(
        user_id=new_user.id,
        title="Welcome to PLAYSPORT! 🏟️",
        message="Your account has been created. Discover top sports turfs and join open matches near you.",
        type=NotificationTypeEnum.SYSTEM,
        link="/turfs"
    )
    db.add(welcome_notif)
    db.commit()
    
    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role.value})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@router.post("/register-owner", response_model=dict, status_code=status.HTTP_201_CREATED)
def register_turf_owner(owner_in: OwnerRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.email == owner_in.email) | (User.username == owner_in.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or username already exists."
        )
    
    new_owner = User(
        email=owner_in.email,
        username=owner_in.username,
        full_name=owner_in.full_name,
        phone=owner_in.phone,
        business_name=owner_in.business_name,
        city=owner_in.city,
        hashed_password=get_password_hash(owner_in.password),
        role=RoleEnum.OWNER,
        is_active=True,
        is_verified=True,
        is_approved=False  # Must be verified & approved by Super Admin with registration details
    )
    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)
    
    # Send notification to Admin
    admin_user = db.query(User).filter(User.role == RoleEnum.ADMIN).first()
    if admin_user:
        admin_notif = Notification(
            user_id=admin_user.id,
            title="New Turf Owner Registration 📝",
            message=f"Turf Owner application received for '{new_owner.full_name}' ({new_owner.business_name}). Pending approval.",
            type=NotificationTypeEnum.ADMIN,
            link="/admin/dashboard"
        )
        db.add(admin_notif)
        db.commit()

    return {
        "access_token": "",
        "token_type": "bearer",
        "user": {
            "id": new_owner.id,
            "email": new_owner.email,
            "full_name": new_owner.full_name,
            "role": new_owner.role.value,
            "is_approved": False
        },
        "message": "Registration submitted! Your Turf Owner account is pending admin approval."
    }

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account is disabled. Contact support."
        )

    if user.role == RoleEnum.OWNER and not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your Turf Owner registration is pending Admin approval. Please wait for approval before logging in."
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/admin-login", response_model=Token)
def admin_login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Administrative credentials required."
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
