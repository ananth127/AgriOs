from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from . import schemas, service

router = APIRouter()

@router.get("/realtime", response_model=schemas.RealtimeDashboardResponse)
def get_realtime_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_realtime_status(db, current_user.id)
