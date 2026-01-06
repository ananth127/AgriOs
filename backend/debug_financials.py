import sys
import os

# Load env
try:
    from load_env import load_env_with_decryption
    load_env_with_decryption()
except Exception:
    pass

from app.core.database import SessionLocal
from app.modules.farm_management import services

def debug_financials():
    print("--- Debugging Financials Service ---")
    db = SessionLocal()
    try:
        svc = services.FarmManagementService(db)
        print("Calling get_financial_summary(1)...")
        result = svc.get_financial_summary(1)
        print("Result:", result)
    except Exception as e:
        print("CRASHED:")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_financials()
