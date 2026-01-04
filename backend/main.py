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

# Create tables (Registry)
registry_models.Base.metadata.create_all(bind=database.engine)
# Note: Farms table creation might fail on SQLite without SpatiaLite. 
# In production, use Alembic.

app = FastAPI(title="Agri-OS Backend")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(registry_router.router, prefix="/api/v1/registry", tags=["registry"])
app.include_router(farms_router.router, prefix="/api/v1/farms", tags=["farms"])
app.include_router(prophet_router.router, prefix="/api/v1/prophet", tags=["prophet"])
app.include_router(drone_router.router, prefix="/api/v1/drone", tags=["drone"])
app.include_router(marketplace_router.router, prefix="/api/v1/marketplace", tags=["marketplace"])
app.include_router(voice_router.router, prefix="/api/v1/voice", tags=["voice"])
app.include_router(crops_router.router, prefix="/api/v1/crops", tags=["crops"])
app.include_router(livestock_router.router, prefix="/api/v1/livestock", tags=["livestock"])
app.include_router(supply_router.router, prefix="/api/v1/supply-chain", tags=["supply_chain"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Agri-OS Universal Backend"}
