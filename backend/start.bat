@echo off
echo Starting AgriOS Backend Server...
echo.
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
