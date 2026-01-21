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
from app.modules.knowledge_graph import models as kg_models
from app.modules.diagnosis import models as diagnosis_models

# Create tables (Registry, Auth, etc)
# Using database.Base ensures all imported models are created
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Agri-OS Backend")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"], # Wildcard can be problematic with credentials
    allow_origin_regex="https?://.*", # Better for dynamic local IPs (192.168.x.x)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

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

from app.modules.weather import router as weather_router
app.include_router(weather_router.router, prefix="/api/v1/weather", tags=["weather"])

from app.modules.sync import router as sync_router
app.include_router(sync_router.router, prefix="/api/v1/sync", tags=["sync"])

# Phase 3: Farm Operations
from app.modules.machinery import models as mach_models
from app.modules.labor import models as labor_models
from app.modules.inventory import models as inv_models
# (Routers would go here, omitting for brevity in this step)

# Phase 4: Commerce
from app.modules.retailer import models as retail_models
from app.modules.market_access import models as market_models

# Phase 5: Fintech
from app.modules.fintech import models as fintech_models

# Phase 6: Traceability
from app.modules.traceability import models as trace_models

from app.modules.ufsi import router as ufsi_router
app.include_router(ufsi_router.router, prefix="/api/v1/ufsi", tags=["ufsi"])

from app.modules.consent import router as consent_router

from app.modules.consent import router as consent_router
app.include_router(consent_router.router, prefix="/api/v1/consent", tags=["consent"])

from app.modules.diagnosis import router as diagnosis_router
app.include_router(diagnosis_router.router, prefix="/api/v1/diagnosis", tags=["diagnosis"])
from app.modules.knowledge_graph import router as kg_router
app.include_router(kg_router.router, prefix="/api/v1/library", tags=["knowledge_graph"])

# Trigger Reload: Fixed Services Import

# Trigger Reload: Added exception handling to routers

@app.get("/")
def read_root():
    return {"message": "Welcome to Agri-OS Universal Backend"}

from sqlalchemy import text
from app.core import database
import traceback

@app.get("/fix-db")
def fix_db():
    try:
        with database.engine.connect() as connection:
            # 1. Add filled_count to labor_jobs
            try:
                connection.execute(text("ALTER TABLE labor_jobs ADD COLUMN IF NOT EXISTS filled_count INTEGER DEFAULT 0;"))
                connection.commit()
            except Exception as e:
                connection.rollback()
                print(f"Labor jobs update skipped: {e}")
            
            # 2. Add diagnosis detailed columns
            columns = [
                "cause TEXT", 
                "prevention TEXT", 
                "treatment_organic TEXT", 
                "treatment_chemical TEXT", 
                "identified_crop VARCHAR"
            ]
            
            for col_def in columns:
                try:
                    connection.execute(text(f"ALTER TABLE diagnosis_logs ADD COLUMN {col_def};"))
                    connection.commit()
                except Exception as db_err:
                    connection.rollback()
                    print(f"Column likely exists or error adding {col_def}: {db_err}")

            # 3. Add category and image_url to commercial_products
            commercial_cols = ["category VARCHAR", "image_url VARCHAR"]
            for col_def in commercial_cols:
                try:
                    connection.execute(text(f"ALTER TABLE commercial_products ADD COLUMN IF NOT EXISTS {col_def};"))
                    connection.commit()
                except Exception as e:
                    connection.rollback()
                    print(f"Commercial products update skipped for {col_def}: {e}")

            # 4. Add listing_type, description, image_url to product_listings
            listing_cols = ["listing_type VARCHAR DEFAULT 'SELL'", "description TEXT", "image_url VARCHAR", "category VARCHAR"]
            for col_def in listing_cols:
                try:
                    connection.execute(text(f"ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS {col_def};"))
                    connection.commit()
                except Exception as e:
                    connection.rollback()
                    print(f"Product listings update skipped for {col_def}: {e}")

            # 5. Add created_at to product_listings
            try:
                connection.execute(text("ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"))
                connection.commit()
            except Exception as e:
                connection.rollback()
                print(f"Product listings update skipped for created_at: {e}")

            # 6. Add survey_number and boundary to users
            user_cols = ["survey_number VARCHAR", "boundary JSON"]
            for col_def in user_cols:
                try:
                    connection.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_def};"))
                    connection.commit()
                except Exception as e:
                    connection.rollback()
                    print(f"Users update skipped for {col_def}: {e}")

            return {"status": "success", "message": "Database schema updated."}
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

@app.get("/debug-financials-error")
def debug_financials_error():
    try:
        from app.modules.farm_management import services
        db = database.SessionLocal()
        svc = services.FarmManagementService(db)
        # Attempt to get financials for farm 1
        return svc.get_financial_summary(1)
    except Exception as e:
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

# Trigger Reload: New Env VARS loaded

@app.on_event("startup")
def startup_event():
    # Run DB Fixes
    print("Running startup DB checks...")
    fix_db()
