# Load encrypted environment variables (if .env.enc exists)
try:
    from load_env import load_env_with_decryption
    load_env_with_decryption()
except Exception as e:
    print(f"⚠️  Could not load encrypted .env: {e}")
    # Continue anyway - env vars might be set directly

from fastapi import FastAPI
from app.core import database
from app.modules.registry import models as registry_models
from app.modules.registry import router as registry_router
from app.modules.farms import router as farms_router
from app.modules.prophet import router as prophet_router
from app.modules.drone import router as drone_router
from app.modules.marketplace import router as marketplace_router
from app.modules.voice_search import router as voice_router
from app.modules.crops import router as crops_router
from app.modules.livestock import router as livestock_router
from app.modules.supply_chain import router as supply_router
from app.modules.farm_management import routers as farm_mgmt_router

from app.modules.auth import models as auth_models
from app.modules.auth import router as auth_router

# Create tables (Registry, Auth, etc)
# Using database.Base ensures all imported models are created
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Agri-OS Backend")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://agri-os.vercel.app",
        "https://agri-os.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(registry_router.router, prefix="/api/v1/registry", tags=["registry"])
app.include_router(farms_router.router, prefix="/api/v1/farms", tags=["farms"])
app.include_router(prophet_router.router, prefix="/api/v1/prophet", tags=["prophet"])
app.include_router(drone_router.router, prefix="/api/v1/drone", tags=["drone"])
app.include_router(marketplace_router.router, prefix="/api/v1/marketplace", tags=["marketplace"])
app.include_router(voice_router.router, prefix="/api/v1/voice-search", tags=["voice-search"])
app.include_router(crops_router.router, prefix="/api/v1/crops", tags=["crops"])
app.include_router(livestock_router.router, prefix="/api/v1/livestock", tags=["livestock"])
app.include_router(supply_router.router, prefix="/api/v1/supply-chain", tags=["supply_chain"])
app.include_router(farm_mgmt_router.router, prefix="/api/v1/farm-management", tags=["farm_management"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Agri-OS Universal Backend"}
