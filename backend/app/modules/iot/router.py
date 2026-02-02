from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from . import schemas, service

router = APIRouter()

# --- Device Management ---

@router.get("/devices", response_model=List[schemas.IoTDeviceResponse])
def get_my_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_user_devices(db, user_id=current_user.id)

@router.post("/devices", response_model=schemas.IoTDeviceResponse)
def register_device(
    device: schemas.IoTDeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return service.create_device(db, device=device, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

@router.get("/devices/{device_id}", response_model=schemas.IoTDeviceResponse)
def get_device_details(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = service.get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized")
    return device

@router.put("/devices/{device_id}", response_model=schemas.IoTDeviceResponse)
def update_device_details(
    device_id: int,
    device_update: schemas.IoTDeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = service.get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    return service.update_device(db, device_id, device_update)


# --- Commands ---

@router.post("/devices/{device_id}/command", response_model=schemas.IoTCommandResponse)
def send_command(
    device_id: int,
    command: schemas.IoTCommandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = service.get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    return service.create_command(db, command, device_id, current_user.id)

@router.get("/devices/{device_id}/commands", response_model=List[schemas.IoTCommandResponse])
def get_command_history(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = service.get_device(db, device_id)
    if not device or device.user_id != current_user.id:
         raise HTTPException(status_code=404, detail="Device not found")
         
    return service.get_device_commands(db, device_id)


# --- Webhooks ---

@router.post("/webhooks/sms")
def sms_webhook(
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Receives SMS from Twilio/Gateway.
    Format: Form Data standard for most gateways.
    """
    response_text = service.process_offline_sms(db, From, Body)
    # Return TwiML or plain text depending on gateway.
    # For now, plain text response.
    return {"message": response_text}
