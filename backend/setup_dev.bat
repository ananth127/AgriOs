@echo off
echo Setting up AgriOS Backend Development Environment...

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
) else (
    echo Virtual environment already exists.
)

echo Activate venv...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Setup Complete!
echo To run the backend:
echo   venv\Scripts\uvicorn main:app --reload
pause
