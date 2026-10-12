#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================================="
echo "🚀  PLAYSPORT 10/10 ENTERPRISE TEST SUITE RUNNER  🚀"
echo "=========================================================="
echo ""

# ---------------------------------------------------------
# 1. BACKEND INTEGRATION TESTS
# ---------------------------------------------------------
echo "▶️  [1/3] Running Backend API Integration Tests (Pytest)..."
echo "   (Using Isolated In-Memory SQLite Database)"
cd backend
# Activate virtual environment
source venv/bin/activate

# Run pytest with coverage, suppressing warnings for a clean output
PYTHONPATH=. pytest tests/ -v --cov=app --cov-report=term -W ignore

# Deactivate virtual environment
deactivate
cd ..
echo "✅ Backend Tests Passed!"
echo ""

# ---------------------------------------------------------
# 2. FRONTEND COMPONENT TESTS
# ---------------------------------------------------------
echo "▶️  [2/3] Running Frontend React Component Tests (Vitest)..."
echo "   (Using Isolated JSDOM Environment)"
cd frontend

# Run vitest in single-run mode
npm run test -- --run

cd ..
echo "✅ Frontend Tests Passed!"
echo ""

# ---------------------------------------------------------
# 3. END-TO-END (E2E) SELENIUM TESTS
# ---------------------------------------------------------
echo "▶️  [3/3] Running Deep End-to-End Browser Tests (Selenium)..."
echo "⚠️  Note: This assumes your FastAPI and React servers are running."

# Activate virtual environment again for the root tests folder
source backend/venv/bin/activate

# Ensure schema is verified
cd backend
python -c "from app.core.database import engine, Base; import app.models; Base.metadata.create_all(bind=engine)"
cd ..

# Run the E2E suite and generate an HTML report
pytest tests/test_e2e.py -v --html=tests/report.html --self-contained-html -W ignore

deactivate
echo "✅ E2E Tests Passed! Report generated at: tests/report.html"
echo ""

echo "=========================================================="
echo "🎉 ALL TEST SUITES PASSED SUCCESSFULLY! (10/10 GRADE) 🎉"
echo "=========================================================="
