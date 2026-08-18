# Setup & Deployment Guide
### PLAYSPORT — Sports Facility Management System (MCA Minor Project)

---

## 1. Local Environment Requirements
- **macOS / Linux / Windows**
- **Python 3.9+** with pip and venv
- **Node.js 18+** with npm

---

## 2. Step-by-Step Installation

### Step A: Backend Environment
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # macOS / Linux
   # On Windows: venv\Scripts\activate
   ```
3. Install all required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Seed the database with the pre-configured entities matching the Stitch design:
   ```bash
   python seed.py
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend will be running at `http://127.0.0.1:8000`.*

---

### Step B: Frontend Environment
1. In a new terminal window, navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend client will be available at `http://localhost:5173`.*

---

## 3. Switching from SQLite to PostgreSQL (Production Mode)

To connect PLAYSPORT to a live PostgreSQL instance:
1. In `backend/.env` (or environment variables), set:
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/playsport_db
   ```
2. Re-run `python seed.py` to generate tables and initial datasets in PostgreSQL.
