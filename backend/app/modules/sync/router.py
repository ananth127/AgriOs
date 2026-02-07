from fastapi import APIRouter, Request, Depends
from typing import Optional
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
import time

router = APIRouter()

@router.get("/pull")
def pull_changes(last_pulled_at: Optional[str] = None, schema_version: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """
    Mock implementation of WatermelonDB Sync Pull.
    Real implementation would query DB for records modified > last_pulled_at.
    """
    current_timestamp = int(time.time() * 1000)

    return {
        "changes": {
            "farmers": {
                "created": [],
                "updated": [],
                "deleted": []
            },
            "logs": {
                "created": [],
                "updated": [],
                "deleted": []
            }
        },
        "timestamp": current_timestamp
    }

@router.post("/push")
async def push_changes(request: Request, current_user: User = Depends(get_current_user)):
    """
    Mock implementation of WatermelonDB Sync Push.
    """
    body = await request.json()
    changes = body.get("changes", {})

    print(f"Received Push Sync from user {current_user.id}: {len(changes)} tables affected.")

    return {"status": "success"}
