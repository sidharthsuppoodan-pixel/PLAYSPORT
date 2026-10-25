import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
import app.models # Register all models

# API Routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.turfs import router as turfs_router
from app.api.grounds import router as grounds_router
from app.api.slots import router as slots_router
from app.api.bookings import router as bookings_router
from app.api.payments import router as payments_router
from app.api.open_matches import router as open_matches_router
from app.api.tournaments import router as tournaments_router
from app.api.equipment import router as equipment_router
from app.api.reviews import router as reviews_router
from app.api.notifications import router as notifications_router
from app.api.admin import router as admin_router
from app.api.reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PLAYSPORT Sports Facility Management System REST API (MCA Minor Project)",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(users_router, prefix=api_v1)
app.include_router(turfs_router, prefix=api_v1)
app.include_router(grounds_router, prefix=api_v1)
app.include_router(slots_router, prefix=api_v1)
app.include_router(bookings_router, prefix=api_v1)
app.include_router(payments_router, prefix=api_v1)
app.include_router(open_matches_router, prefix=api_v1)
app.include_router(tournaments_router, prefix=api_v1)
app.include_router(equipment_router, prefix=api_v1)
app.include_router(reviews_router, prefix=api_v1)
app.include_router(notifications_router, prefix=api_v1)
app.include_router(admin_router, prefix=api_v1)
app.include_router(reports_router, prefix=api_v1)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "Online",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "playsport-backend"}
