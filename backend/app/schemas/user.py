from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.user import RoleEnum
import re


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None)

    @field_validator("email")
    @classmethod
    def validate_strict_email(cls, v):
        v_str = str(v)
        if re.search(r"[A-Z]", v_str):
            raise ValueError("Email address cannot contain uppercase letters (must be strictly lowercase).")
        return v

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username can only contain letters, numbers, and underscores (no spaces or dots).")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v is None:
            return v
        digits = re.sub(r"\D", "", v)
        if len(digits) != 10:
            raise ValueError("Phone number must be exactly 10 digits.")
        if not re.match(r"^[6-9]", digits):
            raise ValueError("Phone number must start with 6, 7, 8, or 9 (Indian mobile).")
        return digits  # store only digits

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if not re.match(r"^[a-zA-Z\s'.'\-]+$", v.strip()):
            raise ValueError("Full name can only contain letters, spaces, and apostrophes.")
        return v.strip().upper()


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-]', v):
            raise ValueError("Password must contain at least one special character.")
        return v

    role: RoleEnum = RoleEnum.CUSTOMER


class OwnerRegister(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-]', v):
            raise ValueError("Password must contain at least one special character.")
        return v

    business_name: str = Field(..., min_length=3, max_length=150)
    city: str = Field(..., min_length=2, max_length=100)

    @field_validator("city")
    @classmethod
    def validate_city(cls, v):
        if not re.match(r"^[a-zA-Z\s\-/]+$", v.strip()):
            raise ValueError("City name can only contain letters, spaces, or hyphens.")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def validate_strict_login_email(cls, v):
        v_str = str(v)
        if re.search(r"[A-Z]", v_str):
            raise ValueError("Email address cannot contain uppercase letters (must be strictly lowercase).")
        return v


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(UserBase):
    id: int
    role: RoleEnum
    is_approved: bool
    is_active: bool
    is_verified: bool
    business_name: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

Token.model_rebuild()

