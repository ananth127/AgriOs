from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class LandRecord(BaseModel):
    id: str
    survey_number: str
    area_acres: float
    owner_name: str
    district: str
    state: str

class FarmerIdentity(BaseModel):
    name: str
    father_name: str
    mobile: str
    linked_land_records: List[LandRecord]
    verification_status: str

@router.get("/verify-farmer/{identifier}", response_model=FarmerIdentity)
async def verify_farmer_identity(identifier: str):
    """
    Mock endpoint to simulate integration with India AgriStack/UFSI (Unified Farmer Service Interface).
    Identifier can be Aadhar (mocked) or Phone.
    
    In a real scenario, this would authenticate with the UFSI Gateway.
    """
    
    # Mock Validation
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier required")
    
    # Simulate valid farmer response
    mock_records = [
        LandRecord(
            id="LR-2024-001", 
            survey_number="120/2B", 
            area_acres=2.5, 
            owner_name="Ramesh Kumar", 
            district="Nasik", 
            state="Maharashtra"
        )
    ]
    
    return FarmerIdentity(
        name="Ramesh Kumar",
        father_name="Suresh Kumar",
        mobile="9876543210",
        linked_land_records=mock_records,
        verification_status="VERIFIED_AGRISTACK"
    )
