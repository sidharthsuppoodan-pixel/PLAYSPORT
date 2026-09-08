#!/usr/bin/env python3
"""
Clean Database Initializer for PlaySport.
Clears all dummy seeded data (turfs, bookings, matches, tournaments, reviews)
and initializes clean empty tables with primary user credentials.
"""

import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, RoleEnum

def reset_clean_database():
    print("🛠️ Recreating fresh PostgreSQL database schema...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("👤 Creating primary admin user account...")
        admin = User(
            email="admin@playsport.com",
            username="superadmin",
            full_name="Alex Admin",
            phone="9876543210",
            hashed_password=get_password_hash("Admin@123"),
            role=RoleEnum.ADMIN,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        db.add(admin)
        db.commit()
        print("✨ Clean database reset complete! Dummy seed data removed.")
    finally:
        db.close()

if __name__ == "__main__":
    reset_clean_database()
