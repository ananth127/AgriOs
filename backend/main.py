# Load encrypted environment variables (if .env.enc exists)
try:
    from load_env import load_env_with_decryption
    load_env_with_decryption()
except Exception as e:
    print(f"Could not load encrypted .env: {e}")
    # Continue anyway - env vars might be set directly

import os
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core import database

# --- Model imports (needed for create_all) ---
from app.modules.registry import models as registry_models
from app.modules.auth import models as auth_models
from app.modules.knowledge_graph import models as kg_models
from app.modules.diagnosis import models as diagnosis_models
from app.modules.iot import models as iot_models
from app.modules.machinery import models as mach_models
from app.modules.labor import models as labor_models
from app.modules.inventory import models as inv_models
from app.modules.retailer import models as retail_models
from app.modules.market_access import models as market_models
from app.modules.fintech import models as fintech_models
from app.modules.traceability import models as trace_models

# --- Router imports ---
from app.modules.auth import router as auth_router
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
from app.modules.weather import router as weather_router
from app.modules.sync import router as sync_router
from app.modules.ufsi import router as ufsi_router
from app.modules.consent import router as consent_router
from app.modules.diagnosis import router as diagnosis_router
from app.modules.diagnosis import model_router as model_registry_router
from app.modules.knowledge_graph import router as kg_router
from app.modules.iot import router as iot_router
from app.modules.iot import lorawan_router
from app.modules.dashboard import router as dashboard_router
from app.modules.irrigation import router as irrigation_router
from app.modules.irrigation import models as irrigation_models
from app.modules.logging import router as logging_router

from app.admin import setup_admin

# Create tables
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Agri-OS Backend")

# Setup Admin Interface
setup_admin(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.108:3000",
        "http://192.168.1.108:8000",
        "http://192.168.1.107:3000",
        "http://192.168.1.107:8000",
    ],
    # Allow all local network IPs for development
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Mount all routers ---
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
app.include_router(weather_router.router, prefix="/api/v1/weather", tags=["weather"])
app.include_router(sync_router.router, prefix="/api/v1/sync", tags=["sync"])
app.include_router(ufsi_router.router, prefix="/api/v1/ufsi", tags=["ufsi"])
app.include_router(consent_router.router, prefix="/api/v1/consent", tags=["consent"])
app.include_router(diagnosis_router.router, prefix="/api/v1/diagnosis", tags=["diagnosis"])
app.include_router(model_registry_router.router, prefix="/api/v1/edge", tags=["edge_models"])
app.include_router(kg_router.router, prefix="/api/v1/library", tags=["knowledge_graph"])
app.include_router(iot_router.router, prefix="/api/v1/iot", tags=["iot"])
app.include_router(lorawan_router.router, prefix="/api/v1/iot", tags=["lorawan"])
app.include_router(dashboard_router.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(irrigation_router.router, prefix="/api/v1", tags=["irrigation"])
app.include_router(logging_router, prefix="/api/v1", tags=["logging"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Agri-OS Universal Backend"}


from app.core.id_generator import generate_numeric_id, generate_alphanumeric_id

def _run_schema_migrations():
    """Internal schema migration — runs at startup, not exposed as an endpoint."""
    try:
        with database.engine.connect() as connection:
            # Helper for safe column addition (works on both PostgreSQL and SQLite)
            def _add_column(table, col_def):
                try:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col_def};"))
                    connection.commit()
                except Exception:
                    connection.rollback()
                    try:
                        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_def};"))
                        connection.commit()
                    except Exception as e2:
                        connection.rollback()
                        # print(f"Migration skipped: {table}.{col_def.split()[0]} — {e2}")

            # 1. Labor jobs
            _add_column("labor_jobs", "filled_count INTEGER DEFAULT 0")

            # 2. Diagnosis detailed columns
            for col in ["cause TEXT", "prevention TEXT", "treatment_organic TEXT", "treatment_chemical TEXT", "identified_crop VARCHAR"]:
                _add_column("diagnosis_logs", col)

            # 3. Commercial products
            for col in ["category VARCHAR", "image_url VARCHAR"]:
                _add_column("commercial_products", col)

            # 4. Product listings
            for col in ["listing_type VARCHAR DEFAULT 'SELL'", "description TEXT", "image_url VARCHAR", "category VARCHAR"]:
                _add_column("product_listings", col)
            _add_column("product_listings", "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

            # 5. Users
            for col in ["survey_number VARCHAR", "boundary JSON"]:
                _add_column("users", col)

            # 6. Livestock QR + profile columns
            for col in ["qr_code VARCHAR", "qr_created_at TIMESTAMP", "name VARCHAR", "gender VARCHAR DEFAULT 'Female'", "purpose VARCHAR DEFAULT 'Dairy'", "origin VARCHAR DEFAULT 'BORN'", "source_details TEXT", "parent_id INTEGER"]:
                _add_column("livestock", col)

            # 7. Multi-user isolation
            _add_column("diagnosis_logs", "user_id INTEGER")
            _add_column("supply_chain_batches", "user_id INTEGER")

            # 9. IoT Smart Logic (Fixes OperationalError)
            for col in ["parent_device_id INTEGER", "last_active_at TIMESTAMP", "total_runtime_minutes FLOAT DEFAULT 0.0", "current_run_start_time TIMESTAMP", "target_turn_off_at TIMESTAMP", "asset_type VARCHAR DEFAULT 'Device'"]:
                _add_column("iot_devices", col)

            # --- Unique ID Migration ---
            # Format: (table_name, id_column_name, is_numeric)
            unique_id_configs = [
                ("users", "user_unique_id", True),
                ("farms", "farm_unique_id", False),
                ("zones", "zone_unique_id", False),
                ("machines", "machine_unique_id", False),
                ("crop_cycles", "crop_unique_id", False),
                ("iot_devices", "device_unique_id", False),
                ("livestock", "animal_unique_id", False),
                ("labor_jobs", "job_unique_id", False),
                ("field_workers", "worker_unique_id", False),
                ("inventory_items", "item_unique_id", False),
            ]

            for table, id_col, is_numeric in unique_id_configs:
                # 1. Add the primary unique ID column
                _add_column(table, f"{id_col} VARCHAR")
                
                # 2. Add user_unique_id column for linking (except on users table itself)
                if table != "users":
                    _add_column(table, "user_unique_id VARCHAR")

                # 3. Backfill Logic
                try:
                    # Check for NULL unique IDs
                    rows = connection.execute(text(f"SELECT id, {id_col} FROM {table} WHERE {id_col} IS NULL")).fetchall()
                    if rows:
                        # print(f"Backfilling {len(rows)} IDs for {table}...")
                        for row in rows:
                            row_id = row[0]
                            if is_numeric:
                                new_id = generate_numeric_id(12)
                            else:
                                new_id = generate_alphanumeric_id(12)
                            
                            connection.execute(text(f"UPDATE {table} SET {id_col} = :uid WHERE id = :rid"), {"uid": new_id, "rid": row_id})
                        connection.commit()
                except Exception:
                    connection.rollback()

            print("Schema migrations completed.")
    except Exception as e:
        print(f"Schema migration error: {e}")


@app.on_event("startup")
def startup_event():
    _run_schema_migrations()
    print("Agri-OS Backend started.")
