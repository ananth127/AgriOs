# AgriOS Backend

## Development Setup

This project uses a virtual environment (`venv`) to isolate dependencies.

### 1. Initial Setup (Windows)

Simply run the helper script:
```powershell
.\setup_dev.bat
```

Or manually:
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Running the Server

ALWAYS ensure the virtual environment is activated before running the server.

```powershell
.\venv\Scripts\uvicorn main:app --reload
```

## Project Structure
- `app/`: Main application code
- `venv/`: Virtual environment (Do not commit)
- `requirements.txt`: Python dependencies
