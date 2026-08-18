# PLAYSPORT — Online Sports Facility Management System
### MCA Minor Project (Full-Stack Implementation)

PLAYSPORT is a modern, full-stack Sports Facility Management web application designed to streamline turf discovery, real-time hourly time slot reservations, open match player matchmaking, tournament registrations, and sports equipment rentals. 

Built strictly following the **Google Stitch UI/UX design specifications**, PLAYSPORT combines a high-performance **FastAPI** backend with a responsive **React (Vite + Tailwind CSS)** client, managed under an isolated **SQLAlchemy** relational schema with strict concurrency and double-booking prevention safeguards.

---

## 🌟 Key Features & Modules

### 1. 🏟️ Turf & Facility Discovery
- Search turfs by sport (`5v5 Football`, `Box Cricket`, `Badminton`, `Tennis`), city (`Kochi`, `Thiruvananthapuram`, `Bangalore`, `New Delhi`, `Mumbai`), and date.
- Multi-photo gallery, amenities showcase (LED Floodlights, Locker Rooms, Parking, Spectator Seating), and Google Maps integration.
- Verified customer reviews with 5-star rating averages and customer initials.

### 2. ⚡ Real-Time Slot Reservation & Double-Booking Guard
- Interactive horizontal date carousel (`TODAY 14 Oct`, `TUE 15 Oct`...).
- 3-column slot status grid (`Available`, `Booked`, `Selected`).
- **Strict Concurrency Control**: Backend transaction isolation + atomic row-locking (`SELECT ... FOR UPDATE` & unique slot constraints) prevents conflicting bookings on the same ground and time slot.
- Instant digital receipt modal with unique reference (`STC-78429`) and celebration confetti.

### 3. 🏆 Open Match Arena (No Team Needed)
- Individual athletes can host or join casual & competitive open matches.
- **Capacity Enforcement**: Real-time progress bar (`2/10 Slots Left`). Once player limit is reached, status switches to `FULL` and additional registration attempts are rejected.

### 4. 🥇 Tournament Management
- Knockout and league championships with entry fee collection, prize pool displays (`₹25,000+`), squad member registration, and bracket fixtures.

### 5. 🎽 Equipment Rental Shop
- Rent official match balls (FIFA Pro Size 5), English willow bats, badminton rackets, and training bibs.
- Automatic inventory tracking preventing reservations exceeding stock.

### 6. 👑 Dual Administrative Dashboards
- **Super Administrator Console (`/admin/dashboard`)**:
  - 4 KPI cards: Total Users (`1,240`), Approved Owners (`45`), Pending Approvals (`3`), Total Revenue (`₹1.2L`).
  - Monthly & Weekly Revenue Area Chart with emerald green gradient.
  - Pending Turf Owner Applications with `✓ Approve` and `✕ Reject` workflows.
- **Turf Manager Dashboard (`/owner/dashboard`)**:
  - 4 KPI cards: Total Turfs, Today's Bookings, Revenue (Today), Active Matches.
  - Recent Bookings table with status badges (`Confirmed`, `Pending`).
  - Real-time **Facility Status** indicators (`⚽ Turf A (5v5) - Booked until 19:00`, `🏏 Turf B - Available next: 19:00`).
  - Batch time slot generator.

---

## 🚀 Quickstart & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Seed the database with demo users, turfs, slots, and matches
python seed.py

# Launch FastAPI development server
uvicorn app.main:app --reload --port 8000
```
- API Swagger Docs: `http://localhost:8000/docs`
- Redoc Documentation: `http://localhost:8000/redoc`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Application URL: `http://localhost:5173`

---

## 🔐 Default Demo Credentials

| Role | Email | Password | Features |
|---|---|---|---|
| **Super Admin** | `admin@playsport.com` | `Admin@123` | Full admin console, owner approvals, revenue charts |
| **Turf Owner** | `owner.kochi@playsport.com` | `Owner@123` | Turf manager dashboard, slot scheduling, utilization |
| **Customer** | `arjun.nair@example.com` | `Customer@123` | Turf booking, open matches, equipment, reviews |
| **Customer** | `rahul.kumar@example.com` | `Customer@123` | Second customer for concurrency testing |

*Note: Use the "Quick Demo Switch" bar in the top navbar for instant 1-click role swapping.*

---

## 🧪 Automated Testing

Run the comprehensive pytest test suite covering authentication, double-booking collisions, and participant capacity limits:
```bash
PYTHONPATH=backend ./backend/venv/bin/pytest -v
```

---

## 📁 Repository Structure
```
playsport/
├── backend/
│   ├── app/
│   │   ├── api/            # REST API route handlers
│   │   ├── core/           # Config, database engine, JWT & security
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic validation schemas
│   │   └── main.py         # FastAPI application entry
│   ├── tests/              # Pytest test suite
│   ├── seed.py             # Rich database seeder matching Stitch UI
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable Stitch UI components
│   │   ├── context/        # Auth & Notification contexts
│   │   ├── pages/          # Application views & dashboards
│   │   ├── services/       # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── docs/                   # Architectural & technical documentation
```
