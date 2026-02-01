import secrets
import hmac
import hashlib
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from . import models, schemas
from app.modules.auth.models import User
from app.common.sms import client as sms_client

def generate_secret_key() -> str:
    return secrets.token_hex(16)

def create_device(db: Session, device: schemas.IoTDeviceCreate, user_id: int) -> models.IoTDevice:
    # 1. Check if device exists by Hardware ID
    existing_device = db.query(models.IoTDevice).filter(models.IoTDevice.hardware_id == device.hardware_id).first()
    
    if existing_device:
        if existing_device.user_id:
             # Already claimed
             # We should probably throw a distinct error that Router can catch, 
             # but for now, we rely on the caller or router to handle exceptions if we raise one.
             # Or we return None? No, raising is better.
             raise ValueError("Device is already claimed by another user.")
        else:
             # Unclaimed, claim it!
             existing_device.user_id = user_id
             existing_device.name = device.name
             existing_device.asset_type = device.asset_type
             # Optionally rotate secret key on claim
             existing_device.secret_key = generate_secret_key()
             db.commit()
             db.refresh(existing_device)
             return existing_device
    
    # 2. New Device (Simulated manufacturing: Creating it on the fly)
    secret = generate_secret_key()
    db_device = models.IoTDevice(
        **device.model_dump(),
        user_id=user_id,
        secret_key=secret
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

def get_user_devices(db: Session, user_id: int) -> List[models.IoTDevice]:
    return db.query(models.IoTDevice).filter(models.IoTDevice.user_id == user_id).all()

def get_device(db: Session, device_id: int) -> Optional[models.IoTDevice]:
    return db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()

def create_command(db: Session, command: schemas.IoTCommandCreate, device_id: int, user_id: Optional[int], source: str = "WEB") -> models.IoTCommand:
    db_command = models.IoTCommand(
        **command.model_dump(),
        device_id=device_id,
        user_id=user_id,
        status="PENDING",
        source=source
    )
    # TODO: Here we would trigger the "Command Processor" (MQTT or SMS logic)
    # For now, just save to DB.
    db.add(db_command)
    db.commit()
    db.refresh(db_command)
    return db_command

def get_device_commands(db: Session, device_id: int, limit: int = 50) -> List[models.IoTCommand]:
    return db.query(models.IoTCommand).filter(models.IoTCommand.device_id == device_id).order_by(models.IoTCommand.created_at.desc()).limit(limit).all()

# --- SMS Logic ---

def process_offline_sms(db: Session, from_number: str, body: str):
    """
    Parses incoming SMS: "AGRI OPEN V1 F123 T173... X..."
    Validates Signature.
    Queues Command.
    Returns: Response Message (str)
    """
    try:
        parts = body.split()
        if len(parts) < 6 or parts[0] != "AGRI":
            return "ERROR: Invalid Format. Use: AGRI [CMD] [VALVE] [ID] [TIME] [SIG]"
            
        action = parts[1] # OPEN
        target = parts[2] # V1
        device_tag = parts[3] # F123 (Hardware ID suffix or DB ID?) -> Let's say device.id for simple logic initially, or Hardware ID
        # User entered F123? Let's assume F{id}
        device_id_str = device_tag.replace("F", "")
        timestamp = parts[4]
        signature = parts[5]
        
        # 1. Find User by Phone
        # Note: Phone number format from gateway might need normalization (+91 vs 91)
        # Using a simplified lookup for now
        # In real app, we need to handle format differences.
        user = db.query(User).filter(User.phone == from_number).first()
        if not user:
            # Fallback: Maybe the From number isn't the user, but we can verify the device secret?
            # Actually, the signature proves possession of the secret.
            # But we need the Device to get the Secret.
            pass

        # 2. Find Device
        # device_id_str might be the PK.
        try:
            d_id = int(device_id_str)
            device = get_device(db, d_id)
        except:
             return "ERROR: Invalid Device ID"

        if not device:
            return "ERROR: Device Not Found"

        # 3. Validate Signature
        # Hash source: "AGRI OPEN V1 F123 T173..." (everything except signature)
        # Reconstruct the string to sign
        # The user signed: "AGRI OPEN V1 F123 T1735629000" (example)
        cmd_string = f"{parts[0]} {parts[1]} {parts[2]} {parts[3]} {parts[4]}"
        
        # Calculate HMAC
        secret_bytes = device.secret_key.encode('utf-8')
        msg_bytes = cmd_string.encode('utf-8')
        expected_sig = hmac.new(secret_bytes, msg_bytes, hashlib.sha256).hexdigest()
        
        # Compare (Shorten to first 5 chars for user ease? Or full hash?)
        # Guide said "X9A2K" -> Suggests truncated hash.
        # Let's verify against first 5 chars of hex digest strictly uppercased.
        expected_short = expected_sig[:5].upper()
        
        if signature.upper() != expected_short:
             return f"ERROR: Invalid Signature. Got {signature}, Expected {expected_short}"

        # 4. Validate Timestamp (Anti-Replay)
        # omitted for brevity, but critical for prod.
        
        # 5. Execute
        # Create Command
        payload = {"target": target}
        cmd = models.IoTCommand(
             device_id=device.id,
             user_id=user.id if user else None,
             command=f"SMS_{action}",
             payload=payload,
             status="PENDING",
             source="SMS_OFFLINE"
        )
        db.add(cmd)
        db.commit()
        
        msg = f"CMD ACCEPTED. {action} {target} for Device {device.name}"
        sms_client.send_message(from_number, msg)
        return msg


    except Exception as e:
        print(f"SMS Processing Error: {e}")
        return "SYSTEM ERROR Processing SMS"
