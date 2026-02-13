from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from app.core.database import engine

# --- Import Models ---
from app.modules.auth.models import User
from app.modules.farms.models import FarmTable, ZoneTable
from app.modules.crops.models import CropCycle
from app.modules.inventory.models import InventoryItem
from app.modules.machinery.models import Machine
from app.modules.farm_management.models import LaborJob
from app.modules.labor.models import FieldWorker
from app.modules.iot.models import IoTDevice
from app.modules.livestock.models import Animal, LivestockHealthLog
from app.modules.marketplace.models import ProductListing, Order
from app.modules.diagnosis.models import DiagnosisLog

class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")

        # Hardcoded for now as requested
        if username == "admin" and password == "anth123":
            request.session.update({"token": "admin_token"})
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        if not token:
            return False
        return True

authentication_backend = AdminAuth(secret_key="secret_key_for_session")

# --- Model Views ---
class UserAdmin(ModelView, model=User):
    column_list = [User.user_unique_id, User.email, User.full_name, User.role, User.is_active]
    column_searchable_list = [User.email, User.full_name]

class FarmAdmin(ModelView, model=FarmTable):
    column_list = [FarmTable.farm_unique_id, FarmTable.user_unique_id, FarmTable.name]

class ZoneAdmin(ModelView, model=ZoneTable):
    column_list = [ZoneTable.zone_unique_id, ZoneTable.name, ZoneTable.farm_id]

class CropCycleAdmin(ModelView, model=CropCycle):
    column_list = [CropCycle.crop_unique_id, CropCycle.current_stage]

class InventoryAdmin(ModelView, model=InventoryItem):
    column_list = [InventoryItem.item_unique_id, InventoryItem.name, InventoryItem.total_quantity, InventoryItem.unit]

class MachineAdmin(ModelView, model=Machine):
    column_list = [Machine.machine_unique_id, Machine.name, Machine.type]

class LaborJobAdmin(ModelView, model=LaborJob):
    column_list = [LaborJob.job_unique_id, LaborJob.title, LaborJob.status]

class FieldWorkerAdmin(ModelView, model=FieldWorker):
    column_list = [FieldWorker.worker_unique_id, FieldWorker.name, FieldWorker.phone]

class IoTDeviceAdmin(ModelView, model=IoTDevice):
    column_list = [IoTDevice.device_unique_id, IoTDevice.name, IoTDevice.hardware_id, IoTDevice.status]

class AnimalAdmin(ModelView, model=Animal):
    column_list = [Animal.animal_unique_id, Animal.tag_id, Animal.name, Animal.health_status]
    
class DiagnosisLogAdmin(ModelView, model=DiagnosisLog):
    column_list = [DiagnosisLog.id, DiagnosisLog.disease_detected, DiagnosisLog.confidence_score]

class ProductListingAdmin(ModelView, model=ProductListing):
    column_list = [ProductListing.id, ProductListing.product_name, ProductListing.price, ProductListing.listing_type]

def setup_admin(app):
    admin = Admin(app, engine, authentication_backend=authentication_backend)
    
    admin.add_view(UserAdmin)
    admin.add_view(FarmAdmin)
    admin.add_view(ZoneAdmin)
    admin.add_view(CropCycleAdmin)
    admin.add_view(InventoryAdmin)
    admin.add_view(MachineAdmin)
    admin.add_view(LaborJobAdmin)
    admin.add_view(FieldWorkerAdmin)
    admin.add_view(IoTDeviceAdmin)
    admin.add_view(AnimalAdmin)
    admin.add_view(DiagnosisLogAdmin)
    admin.add_view(ProductListingAdmin)
    
    print("Admin interface enabled at /admin")
    return admin
