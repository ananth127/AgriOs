# Agri-OS

Agri-OS is a comprehensive Full Stack application for agricultural management.

## 🏗️ Tech Stack

- **Backend**: Python (FastAPI), SQLAlchemy, Pydantic
- **Frontend**: TypeScript, Next.js, Tailwind CSS
- **Database**: PostgreSQL with PostGIS
- **Infrastructure**: Docker, Redis, Meilisearch

## 🚀 Quick Start (Docker - Recommended)

The easiest way to run the entire stack is using Docker Compose.

1. **Start the application**:
   ```bash
   docker compose up --build
   ```

2. **Access the application**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Database: localhost:5432

3. **Default Admin Credentials**:
   - Email: `admin@agrios.com`
   - Password: `password123`
   *Note: You may need to run the seed script if these don't exist (see below).*

## 🛠️ Manual Implementation (Local Dev)

If you prefer running services locally without Docker (except maybe the DB):

### 1. Database Setup
Ensure you have PostgreSQL running locally or use the Docker container for just the DB:
```bash
docker compose up -d db redis meilisearch
```

### 2. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` file (if not exists) with:
```ini
DATABASE_URL=postgresql://postgres:anth123@localhost:5432/agrios
GEMINI_API_KEY=your_gemini_api_key_here
```

Initialize the database:
```bash
# Run migrations/fix schema
python fix_db_schema.py
# Seed default data
python seed.py
```

Run the server:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Create `.env.local` file (if not exists) with:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Run the development server:
```bash
npm run dev
```

## 📱 Mobile/Android Development
If you are testing on a mobile device on the same network:
1. Find your machine's local IP (e.g., `192.168.1.106`).
2. Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to `http://YOUR_IP:8000/api/v1`.
3. Access the frontend via `http://YOUR_IP:3000` on your mobile device.

## 🔐 Authentication
See [AUTH_SYSTEM.md](./AUTH_SYSTEM.md) for detailed authentication documentation.
