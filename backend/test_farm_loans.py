
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.modules.farm_management.models import FarmLoan
from app.modules.farms.models import FarmTable
from app.modules.auth.models import User
from app.core.ownership import verify_farm_ownership
from fastapi import HTTPException

# Explicitly check if we can reach the DB and query relevant tables
def diagnose_loans_request(farm_id_to_check=2):
    db = SessionLocal()
    try:
        print("="*60)
        print(f"DIAGNOSING FARM LOANS REQUEST FOR FARM ID: {farm_id_to_check}")
        print("="*60)

        # 1. Check Farm Existence
        print("[1] Checking Farm Existence...")
        farm = db.query(FarmTable).filter(FarmTable.id == farm_id_to_check).first()
        if not farm:
            print(f"ERROR: Farm {farm_id_to_check} does not exist in DB.")
            return
        
        print(f"SUCCESS: Found Farm '{farm.name}' (ID: {farm.id}, Owner ID: {farm.owner_id})")

        # 2. Check Owner Existence
        print("[2] Checking Owner User...")
        user = db.query(User).filter(User.id == farm.owner_id).first()
        if not user:
            print(f"ERROR: User with ID {farm.owner_id} (owner of farm {farm_id_to_check}) not found!")
            return
        
        print(f"SUCCESS: Found Owner '{user.full_name}' (ID: {user.id})")

        # 3. Test verify_farm_ownership logic
        print("[3] Testing verify_farm_ownership function...")
        try:
            verified_farm = verify_farm_ownership(db, farm_id_to_check, user.id, raise_error=True)
            if verified_farm:
                print("SUCCESS: Ownership verification passed.")
            else:
                print("ERROR: Ownership verification returned None unexpectedly.")
        except HTTPException as e:
            print(f"ERROR: verify_farm_ownership raised HTTPException: {e.detail}")
        except Exception as e:
            print(f"CRITICAL ERROR: verify_farm_ownership crashed: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

        # 4. Check Farm Loans Table
        print("[4] Querying Farm Loans...")
        try:
            loans = db.query(FarmLoan).filter(FarmLoan.farm_id == farm_id_to_check).all()
            print(f"SUCCESS: Query executed. Found {len(loans)} loans.")
            for loan in loans:
                print(f"   - Loan ID: {loan.id}, Amount: {loan.amount}, Purpose: {loan.purpose}")
        except Exception as e:
            print(f"CRITICAL ERROR: Querying FarmLoan failed: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

    except Exception as main_e:
        print(f"Main Execution Error: {main_e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    diagnose_loans_request()
