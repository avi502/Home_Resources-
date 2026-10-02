@echo off
set DISABLE_SQLALCHEMY_CEXT=1
echo ========================================================
echo   HomeResource - Household Resource Intelligence Platform
echo ========================================================
echo Starting FastAPI application server at http://localhost:8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
