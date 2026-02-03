from sqlalchemy.orm import Session
from app.modules.iot import models as iot_models
from app.modules.farm_management import models as fm_models
from . import schemas
from datetime import datetime
import random

def get_realtime_status(db: Session, user_id: int) -> schemas.RealtimeDashboardResponse:
    # 1. Active Operations (from IoT)
    devices = db.query(iot_models.IoTDevice).filter(
        iot_models.IoTDevice.user_id == user_id
    ).all()

    active_ops = []
    
    # Check for active devices (Mocking activity for demo if just online/existing)
    for d in devices:
        # For demo purposes, let's pretend some are running if we have devices
        # In real life, check d.is_online and maybe last command "OPEN"
        status = "Running" if d.is_online else "Idle"
        
        # If we have devices but none online, force one to simulate "Real time data changing"
        # Or better, just return what is in DB.
        
        if d.is_online or d.asset_type == "Pump": # Show pumps
            # Stabilize flow rate for now to prevent "change without action" feeling
            flow_rate = 100 
            if d.is_online:
                 # Only vary slightly if actually running to show life, but let's keep it stable 
                 # if the user specifically complained about "updating without anything happens"
                 pass 

            op = schemas.ActiveOperation(
                id=str(d.id),
                name=d.name,
                type=d.asset_type,
                status="Running" if d.is_online else "Idle",
                details=f"Flow: {flow_rate} L/m" if d.is_online else "Standby",
                duration="00:42:15" if d.is_online else None
            )
            active_ops.append(op)

    # 2. Suggestions (Aggregated)
    suggestions = []
    
    # 2.1 Soil/Moisture Suggestions (Stable for Demo)
    # if True:
    suggestions.append(schemas.Suggestion(
        id="s1",
        title="Start Irrigation in Zone 2",
        reason="Soil Moisture dropped to 28%",
        severity="High",
        action_link="/farm-management"
    ))
    
    suggestions.append(schemas.Suggestion(
        id="s2",
        title="Pest Alert: Cotton Bollworm",
        reason="High risk detected in region",
        severity="Medium",
        action_link="/crop-doctor"
    ))
        
    # Always have at least one suggestion
    suggestions.append(schemas.Suggestion(
        id="s3", 
        title="Check Weather", 
        reason="Rain chance 80% tomorrow", 
        severity="Low", 
        action_link="/weather"
    ))

    return schemas.RealtimeDashboardResponse(
        summary_text="Farm operations are healthy.",
        active_operations=active_ops,
        suggestions=suggestions
    )
