import sys
import os

print("--- Agri-OS Diagnostic & Fix Tool ---")

# 1. Load Environment (Decryption)
try:
    from load_env import load_env_with_decryption
    load_env_with_decryption()
except ImportError:
    print("⚠️ Could not import load_env. Assuming environment variables (DATABASE_URL) are set.")
except Exception as e:
    print(f"⚠️ Error loading environment: {e}")

from app.core import database
from sqlalchemy import text
from app.modules.farm_management import services

def fix_schema():
    print("\n[1/2] Checking Database Schema (labor_jobs)...")
    try:
        with database.engine.connect() as connection:
            # fixes column labor_jobs.filled_count does not exist
            connection.execute(text("ALTER TABLE labor_jobs ADD COLUMN IF NOT EXISTS filled_count INTEGER DEFAULT 0;"))
            connection.commit()
            print("✅ Schema Patch Applied: labor_jobs.filled_count")
    except Exception as e:
        print(f"❌ Schema Patch Failed: {e}")
        # Identify if it's strictly a connection error or syntax
        if "password" in str(e).lower():
            print("   (Check database password/env vars)")

def test_financials():
    print("\n[2/2] Testing Financials API Logic...")
    db = database.SessionLocal()
    try:
        svc = services.FarmManagementService(db)
        print("   Calling get_financial_summary(1)...")
        data = svc.get_financial_summary(1)
        print(f"✅ Success! Data: {data}")
    except Exception as e:
        print("❌ Financials Service Failed!")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    fix_schema()
    test_financials()
