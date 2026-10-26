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
        return str(v).strip().lower()

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
        val_str = str(v).strip()
        if not val_str:
            raise ValueError("Phone number is required.")
        digits = re.sub(r"\D", "", val_str)
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        elif len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]
        if len(digits) != 10:
            raise ValueError("Phone number must be exactly 10 digits.")
        if digits[0] not in "6789":
            raise ValueError("10-digit mobile number must begin with 6, 7, 8, or 9.")
        if len(set(digits[:7])) == 1:
            raise ValueError("The first 7 digits cannot be the same number.")
        if len(set(digits)) == 1:
            raise ValueError("Phone number cannot consist of all identical digits.")
        if re.search(r"(\d)\1{6,}", digits):
            raise ValueError("Phone number cannot have more than 6 repetitive digits.")
        return digits  # store only digits

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if not re.match(r"^[a-zA-Z\s'.'\-]+$", v.strip()):
            raise ValueError("Full name can only contain letters, spaces, and apostrophes.")
        return v.strip().upper()


class UserCreate(UserBase):
    phone: str = Field(..., min_length=10, max_length=15)
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
    phone: str = Field(..., min_length=10, max_length=15)
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
        return str(v).strip().lower()



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

