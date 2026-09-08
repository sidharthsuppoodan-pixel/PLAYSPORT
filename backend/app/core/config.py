import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PLAYSPORT - Sports Facility Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "playsport_super_secret_jwt_key_mca_minor_project_2026_sports_mgmt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for development convenience
    
    # Database (PostgreSQL strictly enforced)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/playsport"
    )
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Admin Seed Credentials
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@playsport.com")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@123")
    ADMIN_NAME: str = "Alex Admin"
    ADMIN_USERNAME: str = "superadmin"
    ADMIN_PHONE: str = "9876543210"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
