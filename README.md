# 🚜 Agri-OS: The Universal Agricultural Operating System

Welcome to the future of farming. This Monorepo contains the "Agri-OS" platform, designed to manage Crops, Livestock, and Supply Chains with a unified, localized, and AI-driven interface.

## 🌟 Key Features
- **Universal Registry**: Define ANY crop or animal without changing code.
- **7-Language Support**: Native UI and Backend support for En, Hi, Kn, Ta, Te, Ml, Mr.
- **Prophet Engine**: AI-driven price prediction and crop suggestion.
- **Drone Intelligence**: Analyze crop health using computer vision.
- **Marketplace**: "Waste-to-Wealth" trading and service booking.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (Supabase recommended with PostGIS enabled)

### 1. Backend Setup (The Brain)
```bash
cd Agri-OS/backend
# Create virtual env
python -m venv venv
# Activate (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt

# Run Server
uvicorn main:app --reload
```
*API Documentation will be available at: http://localhost:8000/docs*

### 2. Frontend Setup (The Interface)
```bash
cd Agri-OS/frontend
npm install
npm run dev
```
*Access the dashboard at: http://localhost:3000*

### 3. Database Configuration
Rename `backend/.env.example` to `backend/.env` and update the `DATABASE_URL` with your Supabase credentials.

## 📂 Project Structure
- `/backend/app/modules/registry`: The core definition engine.
- `/backend/app/modules/farms`: Plot management with PostGIS.
- `/frontend/src/app/[locale]`: Dynamic localized routes.
