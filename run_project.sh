#!/usr/bin/env bash

# ==============================================================================
# PlaySport Full-Stack Application Launcher
# Starts FastAPI Backend (Port 8000) & React Vite Frontend (Port 5173 / Vite default)
# ==============================================================================

set -e

# Color helpers
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}        ⚽ PLAYSPORT APPLICATION LAUNCHER 🏆        ${NC}"
echo -e "${CYAN}====================================================${NC}"

# Function to handle shutdown of background services on Ctrl+C
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down backend and frontend services...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo -e "${GREEN}✓ All services stopped safely.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Ensure ports 8000 and 5173 are free before launching
echo -e "${YELLOW}Cleaning up any existing processes on ports 8000 and 5173...${NC}"
lsof -ti:8000,5173 | xargs kill -9 2>/dev/null || true

# ------------------------------------------------------------------------------
# 1. SETUP & START BACKEND (FastAPI + Uvicorn)
# ------------------------------------------------------------------------------
echo -e "\n${GREEN}[1/2] Setting up Backend (FastAPI)...${NC}"
cd "$PROJECT_ROOT/backend"

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment in backend/venv...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate

echo -e "${YELLOW}Installing backend dependencies...${NC}"
pip install -q -r requirements.txt

echo -e "${YELLOW}Verifying PostgreSQL database schema...${NC}"
python -c "from app.core.database import engine, Base; import app.models; Base.metadata.create_all(bind=engine)"

echo -e "${GREEN}🚀 Starting FastAPI Backend at http://localhost:8000...${NC}"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# ------------------------------------------------------------------------------
# 2. SETUP & START FRONTEND (Vite + React)
# ------------------------------------------------------------------------------
echo -e "\n${GREEN}[2/2] Setting up Frontend (Vite + React)...${NC}"
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing npm packages...${NC}"
    npm install
fi

echo -e "${GREEN}🚀 Starting React Vite Frontend...${NC}"
npm run dev &
FRONTEND_PID=$!

echo -e "\n${CYAN}====================================================${NC}"
echo -e "${GREEN}✨ PlaySport Application is running!${NC}"
echo -e "🔹 Backend API Docs: ${CYAN}http://localhost:8000/docs${NC}"
echo -e "🔹 Frontend App:    ${CYAN}http://localhost:5173${NC}"
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all services."
echo -e "${CYAN}====================================================${NC}\n"

# Keep script running to maintain background processes
wait $BACKEND_PID $FRONTEND_PID
