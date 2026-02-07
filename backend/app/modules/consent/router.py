from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
from app.core.ownership import require_admin
from app.modules.consent import models, schemas

router = APIRouter()

@router.post("/policies", response_model=schemas.ConsentPolicyOut)
def create_policy(policy: schemas.ConsentPolicyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    require_admin(current_user)
    db_policy = models.ConsentPolicy(
        version=policy.version,
        content_text=policy.content_text,
        is_required=policy.is_required
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy

# Public — users need to see policies before consenting
@router.get("/policies/latest", response_model=schemas.ConsentPolicyOut)
def get_latest_policy(db: Session = Depends(get_db)):
    policy = db.query(models.ConsentPolicy).order_by(models.ConsentPolicy.created_at.desc()).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No policies found")
    return policy

@router.post("/record-consent", response_model=schemas.UserConsentOut)
def record_consent(
    consent: schemas.UserConsentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    policy = db.query(models.ConsentPolicy).filter(models.ConsentPolicy.id == consent.policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    client_ip = request.client.host if request.client else "0.0.0.0"

    db_consent = models.UserConsent(
        user_id=current_user.id,
        policy_id=consent.policy_id,
        is_accepted=consent.is_accepted,
        device_id=consent.device_id,
        ip_address=client_ip
    )
    db.add(db_consent)
    db.commit()
    db.refresh(db_consent)
    return db_consent
