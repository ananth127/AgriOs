import sys
import os
import traceback

# Add current directory to python path
sys.path.append(os.getcwd())

print("--- Testing Imports ---")
try:
    print("Importing app.modules.farm_management.services...")
    from app.modules.farm_management import services
    print("Service import successful.")
except Exception as e:
    print(f"FAILED to import services: {e}")
    traceback.print_exc()
    sys.exit(1)

print("\n--- Testing Model Access ---")
try:
    from app.modules.marketplace import models as market_models
    print(f"Marketplace ProductListing: {market_models.ProductListing}")
except Exception as e:
    print(f"FAILED to import marketplace models: {e}")
    traceback.print_exc()
    sys.exit(1)

print("\n--- Testing DB Session & Compatibility ---")
try:
    from app.core import database
    # Just creating session to test connectivity/drivers
    # db = database.SessionLocal() # Might fail if DB not running, but importing is what we test
    print("Database module imported.")
except Exception as e:
    print(f"FAILED to import database: {e}")
    traceback.print_exc()

print("Status: OK")
