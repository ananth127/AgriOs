from app.core.database import engine, Base
from app.modules.iot import models as iot_models
from app.modules.auth import models as auth_models
from app.modules.farm_management import models as farm_models
from app.modules.crops import models as crop_models
from app.modules.farms import models as farm_loc_models
from app.modules.machinery import models as mach_models

def init_tables():
    print("Creating missing tables...")
    try:
        iot_models.Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    init_tables()
