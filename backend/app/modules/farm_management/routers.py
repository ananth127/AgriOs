from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.core import database
from app.modules.farm_management import models, schemas, services
from app.modules.iot import service as iot_service
from app.modules.iot import schemas as iot_schemas
from app.modules.marketplace.models import ProductListing
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.farms import models as farm_models
from app.modules.farms import user_farm_service
from app.modules.iot import models as iot_models

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_farm_ownership(db: Session, farm_id: int, user_id: int, raise_error: bool = True):
    """Helper to enforce strict farm ownership"""
    farm = db.query(farm_models.FarmTable).filter(farm_models.FarmTable.id == farm_id).first()
    if not farm:
        if raise_error:
             raise HTTPException(status_code=404, detail="Farm not found")
        return None
    
    if farm.owner_id != user_id:
        if raise_error:
             raise HTTPException(status_code=403, detail="Not authorized to access this farm")
        return None
    return farm

@router.get("/user-farm-id")
def get_user_farm_id(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get or create the user's primary farm ID"""
    farm = user_farm_service.get_or_create_user_farm(db, current_user.id)
    return {"farm_id": farm.id}

# --- Loans ---
@router.post("/loans", response_model=schemas.FarmLoan)
def create_loan(loan: schemas.FarmLoanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership
    verify_farm_ownership(db, loan.farm_id, current_user.id)
    
    db_loan = models.FarmLoan(**loan.dict())
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan

@router.get("/loans/{farm_id}", response_model=List[schemas.FarmLoan])
def get_farm_loans(farm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership (Read Only -> Show Empty if not owned)
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
        return []
    
    return db.query(models.FarmLoan).filter(models.FarmLoan.farm_id == farm_id).all()

# --- Inventory (Fertilizers/Pesticides) ---
@router.post("/inventory", response_model=schemas.FarmInventory)
def add_inventory(item: schemas.FarmInventoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership (Write -> Strict)
    verify_farm_ownership(db, item.farm_id, current_user.id)
    
    db_item = models.FarmInventory(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/inventory/{farm_id}", response_model=List[schemas.FarmInventory])
def get_inventory(farm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership (Read Only -> Show Empty if not owned)
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
        return []
    
    return db.query(models.FarmInventory).filter(models.FarmInventory.farm_id == farm_id).all()

# --- Assets (Machinery) ---
@router.post("/assets", response_model=schemas.FarmAsset)
def add_asset(asset: schemas.FarmAssetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Strict Check: Farm Must Exist and Belong to User
    verify_farm_ownership(db, asset.farm_id, current_user.id)

    # Create Farm Asset
    db_asset = models.FarmAsset(
        **asset.dict(exclude={'config'}),
        iot_settings=asset.config
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)

    # If IoT Enabled, auto-register in IoT Module
    if asset.is_iot_enabled:
        try:
            # We already verified ownership, so owner_id is current_user.id
            owner_id = current_user.id

            # Prepare IoT Device Payload
            iot_payload = iot_schemas.IoTDeviceCreate(
                name=asset.name,
                hardware_id=asset.iot_device_id or f"GEN-{db_asset.id}", # Fallback ID
                asset_type=asset.asset_type,
                config=asset.config or {}
            )
            
            # Register in IoT System
            iot_dev = iot_service.create_device(db, iot_payload, user_id=owner_id) 
            
            # Link Asset to IoT Device (using DB ID for API compatibility)
            db_asset.iot_device_id = str(iot_dev.id)
            db.add(db_asset)
            db.commit()
            db.refresh(db_asset)
            
        except ValueError:
            # Device already claimed or exists. 
            pass
        except Exception as e:
            print(f"Failed to auto-register IoT Device: {e}")
            pass

    return db_asset

@router.get("/assets/{farm_id}", response_model=List[schemas.FarmAsset])
def get_assets(farm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Authorization: Ensure current user owns this farm
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
         return [] # Don't crash, just show nothing

    # 2. Fetch Assets
    assets = db.query(models.FarmAsset).filter(models.FarmAsset.farm_id == farm_id).all()
    
    # 3. Sync IoT Status
    # Ensure Farm Asset status matches real IoT Device status
    dirty = False
    for asset in assets:
        if asset.is_iot_enabled and asset.iot_device_id:
            try:
                # Try to resolve link
                dev_id = int(asset.iot_device_id)
                iot_dev = db.query(iot_models.IoTDevice).filter(iot_models.IoTDevice.id == dev_id).first()
                if iot_dev and iot_dev.status != asset.status:
                     asset.status = iot_dev.status
                     db.add(asset)
                     dirty = True
            except:
                pass 
    
    if dirty:
        db.commit()
        # No need to refresh all, they are updated in session objects returned

    return assets

# --- Inventory Update/Delete ---
@router.delete("/inventory/{item_id}")
def delete_inventory(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(models.FarmInventory).filter(models.FarmInventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    # Verify ownership of the related farm
    verify_farm_ownership(db, item.farm_id, current_user.id)
    
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}

@router.put("/inventory/{item_id}", response_model=schemas.FarmInventory)
def update_inventory(item_id: int, item_data: schemas.FarmInventoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(models.FarmInventory).filter(models.FarmInventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Verify ownership of the related farm
    verify_farm_ownership(db, item.farm_id, current_user.id)
    
    for key, value in item_data.dict().items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item

# --- Assets Update/Delete ---
@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    asset = db.query(models.FarmAsset).filter(models.FarmAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    # Verify ownership
    verify_farm_ownership(db, asset.farm_id, current_user.id)
        
    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted"}

@router.put("/assets/{asset_id}", response_model=schemas.FarmAsset)
def update_asset(asset_id: int, asset_data: schemas.FarmAssetUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    asset = db.query(models.FarmAsset).filter(models.FarmAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    # Verify ownership
    verify_farm_ownership(db, asset.farm_id, current_user.id)
    
    for key, value in asset_data.dict(exclude_unset=True).items():
        setattr(asset, key, value)
        
    db.commit()
    db.refresh(asset)

    # --- SYNC: Update linked IoT Device ---
    if asset.is_iot_enabled and asset.iot_device_id:
        try:
            # Find the linked IoT Device by Hardware ID (or ID if integer)
            # Try finding by hardware_id/iot_device_id string first
            iot_dev = db.query(iot_models.IoTDevice).filter(iot_models.IoTDevice.hardware_id == asset.iot_device_id).first()
            
            # If not found by hardware string, try by ID if it looks like an int (legacy link)
            if not iot_dev and asset.iot_device_id.isdigit():
                 iot_dev = db.query(iot_models.IoTDevice).filter(iot_models.IoTDevice.id == int(asset.iot_device_id)).first()

            if iot_dev:
                # Sync Status if changed
                if asset_data.status and iot_dev.status != asset_data.status:
                    print(f"SYNC: Updating Linked IoT Device {iot_dev.id} status to {asset_data.status}")
                    iot_dev.status = asset_data.status
                    db.add(iot_dev)
                    db.commit()
        except Exception as e:
            print(f"SYNC Error: Failed to update linked IoT Device: {e}")

    # --- SAFETY LOGIC (Pump Protection) ---
    try:
        # Check only if we touched a potential irrigation asset
        if asset.asset_type in ['Valve', 'Pump', 'Irrigation']:
            # Get all relevant assets in this farm
            farm_assets = db.query(models.FarmAsset).filter(
                models.FarmAsset.farm_id == asset.farm_id,
                models.FarmAsset.asset_type.in_(['Valve', 'Pump'])
            ).all()

            active_pumps = [p for p in farm_assets if p.asset_type == 'Pump' and p.status == 'Active']
            active_valves = [v for v in farm_assets if v.asset_type == 'Valve' and v.status == 'Active']
            
            if active_pumps and not active_valves:
                print(f"SAFETY INTERLOCK: Turning OFF {len(active_pumps)} pumps due to 0 active valves.")
                for pump in active_pumps:
                    pump.status = 'Idle'
                    
                    # Update Alert Message in Settings
                    current_settings = dict(pump.iot_settings or {})
                    current_settings['last_alert'] = {
                        "message": "Critical Safety Stop: No active valves detected.",
                        "type": "pressure_danger",
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    }
                    pump.iot_settings = current_settings
                    db.add(pump)
                
                db.commit()
                # Re-refresh the returned asset if it was the one modified
                if asset.asset_type == 'Pump':
                    db.refresh(asset) 

    except Exception as e:
        print(f"Safety Check Failed: {e}")

    return asset

@router.get("/suggestions/fertilizer")
def get_fertilizer_suggestion(farm_id: int, crop_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
        return {"suggestion": "No access to this farm"} # Graceful fallback
    
    svc = services.FarmManagementService(db)
    return svc.generate_fertilizer_suggestion(farm_id, crop_name)

@router.get("/suggestions/pesticide")
def get_pesticide_suggestion(farm_id: int, crop_name: str, disease: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
         return {"suggestion": "No access to this farm"}

    svc = services.FarmManagementService(db)
    return svc.generate_pesticide_suggestion(farm_id, crop_name, disease)

# --- Activities & Timeline ---
@router.post("/activities", response_model=schemas.FarmActivity)
def log_activity(activity: schemas.FarmActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership
    verify_farm_ownership(db, activity.farm_id, current_user.id)
    
    db_act = models.FarmActivity(**activity.dict())
    db.add(db_act)
    db.commit()
    db.refresh(db_act)
    return db_act

@router.get("/timeline/")
def get_all_timeline(farm_id: int = 1, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
        return [] # Return empty
    
    svc = services.FarmManagementService(db)
    return svc.get_farm_timeline(farm_id)

@router.get("/timeline/{crop_cycle_id}")
def get_timeline(crop_cycle_id: int, db: Session = Depends(get_db)):
    # TODO: Add nested ownership check for crop cycle
    svc = services.FarmManagementService(db)
    return svc.get_crop_timeline(crop_cycle_id)

# --- Financials ---
@router.get("/financials/{farm_id}")
def get_financials(farm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
        # Return empty/zero structure to avoid frontend crash if it expects data
        return {"revenue": 0, "expenses": 0, "profit": 0, "history": []}
    
    try:
        svc = services.FarmManagementService(db)
        return svc.get_financial_summary(farm_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# --- Marketplace (Product Listings) ---
@router.post("/listings/create")
def create_listing(listing_data: schemas.FarmActivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # TODO: Enforce strict ownership when marketplace is fully implemented
    return {"message": "Listing created (mock)"}

# --- Labor ---
@router.post("/labor/jobs", response_model=schemas.LaborJob)
def post_job(job: schemas.LaborJobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership
    verify_farm_ownership(db, job.farm_id, current_user.id)
    
    db_job = models.LaborJob(**job.dict(), status="Open")
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/labor/jobs", response_model=List[schemas.LaborJob])
def get_jobs(farm_id: int = 1, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify ownership
    if not verify_farm_ownership(db, farm_id, current_user.id, raise_error=False):
        return []
    
    return db.query(models.LaborJob).filter(models.LaborJob.farm_id == farm_id).all()

@router.delete("/labor/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(models.LaborJob).filter(models.LaborJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Verify ownership
    verify_farm_ownership(db, job.farm_id, current_user.id)

    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}

@router.post("/labor/applications/{app_id}/accept")
def accept_application(app_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Should check if the job for this app belongs to a farm owned by user
    # Simplified for now as it requires complex joins or modifying service
    svc = services.FarmManagementService(db)
    result = svc.accept_labor_application(app_id)
    if not result:
        raise HTTPException(status_code=400, detail="Cannot accept application (Job full or invalid ID)")
    return {"status": "accepted", "application_id": app_id}
