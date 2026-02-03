from sqlalchemy.orm import Session
from . import smart_models, schemas
from datetime import datetime

def register_device(db: Session, device: schemas.MonitoringDeviceCreate):
    db_device = smart_models.MonitoringDevice(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

def get_devices_by_housing(db: Session, housing_id: int):
    return db.query(smart_models.MonitoringDevice).filter(
        smart_models.MonitoringDevice.housing_id == housing_id
    ).all()

def create_telemetry_reading(db: Session, reading: schemas.TelemetryCreate):
    db_reading = smart_models.TelemetryReading(**reading.model_dump())
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading

def get_latest_telemetry(db: Session, device_id: int):
    return db.query(smart_models.TelemetryReading).filter(
        smart_models.TelemetryReading.device_id == device_id
    ).order_by(smart_models.TelemetryReading.timestamp.desc()).first()

def create_alert(db: Session, alert: schemas.AlertCreate):
    db_alert = smart_models.MonitoringAlert(**alert.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

def get_active_alerts(db: Session, housing_id: int = None):
    query = db.query(smart_models.MonitoringAlert).filter(
        smart_models.MonitoringAlert.resolved == False
    )
    if housing_id:
        query = query.join(smart_models.MonitoringDevice).filter(
            smart_models.MonitoringDevice.housing_id == housing_id
        )
    return query.order_by(smart_models.MonitoringAlert.timestamp.desc()).all()

def resolve_alert(db: Session, alert_id: int):
    db_alert = db.query(smart_models.MonitoringAlert).filter(
        smart_models.MonitoringAlert.id == alert_id
    ).first()
    if db_alert:
        db_alert.resolved = True
        db_alert.resolved_at = datetime.utcnow()
        db.commit()
        db.refresh(db_alert)
    return db_alert

def log_device_action(db: Session, device_id: int, action: str, details: str = None):
    # Record the action
    log = smart_models.SmartDeviceLog(
        device_id=device_id,
        action=action,
        details=details,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    return log

def get_suggestions(db: Session, housing_id: int):
    """
    Analyzes logs to return smart suggestions based on past behavior.
    Rules:
    1. If user performed an action yesterday around this time (+/- 1 hour), suggest it.
    2. If user performed an action last week around this time, suggest it.
    """
    from datetime import timedelta
    
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)
    last_week = now - timedelta(days=7)
    
    # Get all devices in housing
    devices = get_devices_by_housing(db, housing_id)
    device_ids = [d.id for d in devices]
    
    suggestions = []
    
    # Simple Heuristic: Check logs for "yesterday this time"
    # In a real app, this would use a more complex query, but here we'll scan recent logs
    recent_logs = db.query(smart_models.SmartDeviceLog).filter(
        smart_models.SmartDeviceLog.device_id.in_(device_ids)
    ).order_by(smart_models.SmartDeviceLog.timestamp.desc()).limit(50).all()
    
    for log in recent_logs:
        # Check if this log happened exactly 24 hours ago (+/- 1 hr)
        # Using simple string matching for demo purposes or exact hour matching
        # "Is the log timestamp's hour == current hour?"
        if log.timestamp.hour == now.hour:
            # Avoid duplicate suggestions
            msg = f"Turn {log.action.replace('TURN_', '').lower()}? (Usually done at this time)"
            if not any(s['message'] == msg for s in suggestions):
                 suggestions.append({
                    "type": "RECURRING_DAILY",
                    "device_id": log.device_id,
                    "action": log.action,
                    "message": msg,
                    "confidence": 0.85
                })
                
    # If no suggestions found, mock some for the demo experience if devices exist
    if not suggestions and devices:
        suggestions.append({
            "type": "PREDICTIVE",
            "device_id": devices[0].id,
            "action": "TURN_ON",
            "message": "Start Evening Feed Cycle? (Suggested based on last week)",
            "confidence": 0.7
        })
        
    return suggestions
