from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class AdminMetricsOut(BaseModel):
    total_users: int
    approved_owners: int
    pending_approvals: int
    total_revenue: float
    total_revenue_display: str
    user_growth_pct: str
    owner_regions_count: int
    revenue_growth_pct: str

class OwnerDashboardMetricsOut(BaseModel):
    total_turfs: int
    todays_bookings: int
    revenue_today: float
    revenue_today_display: str
    revenue_projected_display: str
    active_matches: int

class RevenueChartPoint(BaseModel):
    label: str # Jan, Feb, Mar, etc.
    revenue: float # in thousands or raw
    display_value: str

class PendingOwnerOut(BaseModel):
    id: int
    business_name: str
    owner_name: str
    email: str
    phone: Optional[str]
    city: str
    created_at: datetime
    formatted_date: str

class FacilityStatusItem(BaseModel):
    id: int
    name: str # e.g. "Turf A (5v5)"
    sport_type: str
    status: str # "BOOKED" or "AVAILABLE"
    status_text: str # "Booked until 19:00" or "Available next: 19:00" or "Available Now"
    is_available: bool

class RecentBookingItem(BaseModel):
    id: int
    booking_reference: str # "#BK-9042"
    customer_name: str
    customer_initials: str
    turf_name: str
    ground_name: str
    time_display: str # "Today, 18:00 - 19:00"
    status: str # "Confirmed", "Pending"
    amount: float

class AdminFacilityOut(BaseModel):
    id: int
    name: str
    owner_name: str
    city: str
    total_bookings: int
    total_revenue: float
    created_at: datetime

class AdminBookingOut(BaseModel):
    id: int
    reference: str
    customer_name: str
    turf_name: str
    date: str
    time: str
    amount: float
    status: str

class AdminSlotOut(BaseModel):
    id: int
    turf_name: str
    ground_name: str
    date: str
    time: str
    price: float
    status: str

class AdminAnalyticsOut(BaseModel):
    bookings_by_city: List[dict]
    revenue_by_turf: List[dict]
