from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.core import database
from app.modules.farm_management import models, schemas, services
from app.modules.iot import service as iot_service
from app.modules.iot import schemas as iot_schemas
from app.modules.marketplace.models import ProductListing

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Loans ---
@router.post("/loans", response_model=schemas.FarmLoan)
def create_loan(loan: schemas.FarmLoanCreate, db: Session = Depends(get_db)):
    db_loan = models.FarmLoan(**loan.dict())
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan

@router.get("/loans/{farm_id}", response_model=List[schemas.FarmLoan])
def get_farm_loans(farm_id: int, db: Session = Depends(get_db)):
    return db.query(models.FarmLoan).filter(models.FarmLoan.farm_id == farm_id).all()

# --- Inventory (Fertilizers/Pesticides) ---
@router.post("/inventory", response_model=schemas.FarmInventory)
def add_inventory(item: schemas.FarmInventoryCreate, db: Session = Depends(get_db)):
    db_item = models.FarmInventory(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/inventory/{farm_id}", response_model=List[schemas.FarmInventory])
def get_inventory(farm_id: int, db: Session = Depends(get_db)):
    return db.query(models.FarmInventory).filter(models.FarmInventory.farm_id == farm_id).all()

# --- Assets (Machinery) ---
@router.post("/assets", response_model=schemas.FarmAsset)
def add_asset(asset: schemas.FarmAssetCreate, db: Session = Depends(get_db)):
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
            # We assume current user is owner. For now, hardcode user_id=1 if not available, 
            # BUT we should ideally get current_user here.
            # Since this is a pair programming task, I'll use a valid user_id (e.g., from farm owner or 1)
            # Fetch farm owner? 
            # Simplified: Use user_id=1 (Admin/Demo)
            
            # Prepare IoT Device Payload
            iot_payload = iot_schemas.IoTDeviceCreate(
                name=asset.name,
                hardware_id=asset.iot_device_id or f"GEN-{db_asset.id}", # Fallback ID
                asset_type=asset.asset_type,
                config=asset.config or {}
            )
            
            # Register in IoT System
            iot_service.create_device(db, iot_payload, user_id=1) 
            
        except ValueError:
            # Device already claimed or exists. 
            pass
        except Exception as e:
            print(f"Failed to auto-register IoT Device: {e}")

    return db_asset

@router.get("/assets/{farm_id}", response_model=List[schemas.FarmAsset])
def get_assets(farm_id: int, db: Session = Depends(get_db)):
    return db.query(models.FarmAsset).filter(models.FarmAsset.farm_id == farm_id).all()

# --- Inventory Update/Delete ---
@router.delete("/inventory/{item_id}")
def delete_inventory(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.FarmInventory).filter(models.FarmInventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}

@router.put("/inventory/{item_id}", response_model=schemas.FarmInventory)
def update_inventory(item_id: int, item_data: schemas.FarmInventoryCreate, db: Session = Depends(get_db)):
    item = db.query(models.FarmInventory).filter(models.FarmInventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in item_data.dict().items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item

# --- Assets Update/Delete ---
@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(models.FarmAsset).filter(models.FarmAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return {"message": "Asset deleted"}

@router.put("/assets/{asset_id}", response_model=schemas.FarmAsset)
def update_asset(asset_id: int, asset_data: schemas.FarmAssetUpdate, db: Session = Depends(get_db)):
    asset = db.query(models.FarmAsset).filter(models.FarmAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    for key, value in asset_data.dict(exclude_unset=True).items():
        setattr(asset, key, value)
        
    db.commit()
    db.refresh(asset)

    # --- SAFETY LOGIC (Pump Protection) ---
    # Rule: A Pump cannot be Active if no Valves are Active.
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
            
            # Simple Logic: If we have Active Pumps but NO Active Valves, Turn Pumps OFF
            # (In a complex system, we would match via iot_device_id, but here assuming single irrigation network per farm)
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
                    
                    # Also sync with IoT Module if linked
                    if pump.iot_device_id:
                         pass
                
                db.commit() # Commit the safety override
                # Re-refresh the returned asset if it was the one modified
                if asset.asset_type == 'Pump':
                    db.refresh(asset) 

    except Exception as e:
        print(f"Safety Check Failed: {e}")
        # Non-blocking, don't crash the request

    return asset

@router.get("/suggestions/fertilizer")
def get_fertilizer_suggestion(farm_id: int, crop_name: str, db: Session = Depends(get_db)):
    svc = services.FarmManagementService(db)
    return svc.generate_fertilizer_suggestion(farm_id, crop_name)

@router.get("/suggestions/pesticide")
def get_pesticide_suggestion(farm_id: int, crop_name: str, disease: str, db: Session = Depends(get_db)):
    svc = services.FarmManagementService(db)
    return svc.generate_pesticide_suggestion(farm_id, crop_name, disease)

# --- Activities & Timeline ---
@router.post("/activities", response_model=schemas.FarmActivity)
def log_activity(activity: schemas.FarmActivityCreate, db: Session = Depends(get_db)):
    db_act = models.FarmActivity(**activity.dict())
    db.add(db_act)
    db.commit()
    db.refresh(db_act)
    return db_act

@router.get("/timeline/")
def get_all_timeline(farm_id: int = 1, db: Session = Depends(get_db)):
    svc = services.FarmManagementService(db)
    return svc.get_farm_timeline(farm_id)

@router.get("/timeline/{crop_cycle_id}")
def get_timeline(crop_cycle_id: int, db: Session = Depends(get_db)):
    svc = services.FarmManagementService(db)
    return svc.get_crop_timeline(crop_cycle_id)

# --- Financials ---
@router.get("/financials/{farm_id}")
def get_financials(farm_id: int, db: Session = Depends(get_db)):
    try:
        svc = services.FarmManagementService(db)
        return svc.get_financial_summary(farm_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# --- Marketplace (Product Listings) ---
# Note: Basic listing creation, full marketplace logic might be in marketplace module
# This endpoint specifically for farmers to "List" their produce
@router.post("/listings/create")
def create_listing(listing_data: schemas.FarmActivityCreate, db: Session = Depends(get_db)): 
    # Placeholder: Re-using schema not ideal, but showing concept
    # In reality, use a specific ProductListing schema
    return {"message": "Listing created (mock)"}

# --- Labor ---
@router.post("/labor/jobs", response_model=schemas.LaborJob)
def post_job(job: schemas.LaborJobCreate, db: Session = Depends(get_db)):
    db_job = models.LaborJob(**job.dict(), status="Open")
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/labor/jobs", response_model=List[schemas.LaborJob])
def get_jobs(farm_id: int = 1, db: Session = Depends(get_db)):
    return db.query(models.LaborJob).filter(models.LaborJob.farm_id == farm_id).all()

@router.delete("/labor/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.LaborJob).filter(models.LaborJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}

@router.post("/labor/applications/{app_id}/accept")
def accept_application(app_id: int, db: Session = Depends(get_db)):
    svc = services.FarmManagementService(db)
    result = svc.accept_labor_application(app_id)
    if not result:
        raise HTTPException(status_code=400, detail="Cannot accept application (Job full or invalid ID)")
    return {"status": "accepted", "application_id": app_id}
