from fastapi import APIRouter
from app.modules.machinery import models as mach_models
from app.modules.labor import models as labor_models
from app.modules.inventory import models as inv_models

router = APIRouter()

@router.get("/status")
def system_status():
    return {"status": "Operational", "modules": ["Machinery", "Labor", "Inventory"]}

# Note: In a real app, I would create separate routers for each folder.
# For simplicity in this accelerated prompt, I'm just initializing the models via main.py imports
# and confirming their existence.
