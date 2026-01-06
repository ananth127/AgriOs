from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.modules.farm_management import models, schemas
from app.modules.crops.models import CropCycle
from app.modules.farms.models import FarmTable
from app.modules.marketplace import models as market_models

class FarmManagementService:
    def __init__(self, db: Session):
        self.db = db

    def get_financial_summary(self, farm_id: int):
        loans = self.db.query(func.sum(models.FarmLoan.amount)).filter(models.FarmLoan.farm_id == farm_id).scalar() or 0.0
        expenses = self.db.query(func.sum(models.FarmActivity.cost)).filter(models.FarmActivity.farm_id == farm_id).scalar() or 0.0
        revenue = self.db.query(func.sum(market_models.ProductListing.price * market_models.ProductListing.quantity)).filter(
            market_models.ProductListing.seller_id == 1, # Placeholder for user_id logic
            market_models.ProductListing.is_active == False # Assuming sold items are inactive or have a "status"
        ).scalar() or 0.0
        
        return {
            "total_investment": loans + expenses,
            "total_expenses": expenses,
            "total_loans": loans,
            "estimated_revenue": revenue,
            "net_profit": revenue - (expenses + loans)
        }

    def generate_fertilizer_suggestion(self, farm_id: int, crop_name: str):
        # Enhanced logic suggestion
        # In a real app, this would use the `prophet` module or historical yield data.
        return {
            "crop": crop_name,
            "suggested_item": "Urea + DAP",
            "quantity_per_acre_kg": 120.0,
            "reason": f"Based on '{crop_name}' nutrient uptake and standard soil profiles for this region."
        }
    
    def generate_pesticide_suggestion(self, farm_id: int, crop_name: str, disease_detected: str):
        # "Pesticides used to control..." logic
        return {
            "crop": crop_name,
            "disease": disease_detected,
            "suggested_pesticide": "Imidacloprid 17.8 SL",
            "dosage_per_acre": "100ml",
            "reason": f"Highly effective against {disease_detected} in {crop_name}."
        }

    def get_crop_timeline(self, crop_cycle_id: int):
        cycle = self.db.query(CropCycle).filter(CropCycle.id == crop_cycle_id).first()
        activities = self.db.query(models.FarmActivity).filter(models.FarmActivity.crop_cycle_id == crop_cycle_id).all()
        
        timeline = []
        if cycle:
            timeline.append({"date": cycle.sowing_date, "type": "Milestone", "title": "Sowing Date"})
            if cycle.harvest_date_estimated:
                timeline.append({"date": cycle.harvest_date_estimated, "type": "Milestone", "title": "Expected Harvest"})
                
        for act in activities:
            timeline.append({
                "date": act.activity_date,
                "type": "Activity",
                "title": act.activity_type,
                "details": act.description or f"{act.activity_type} performed using {act.quantity_used or ''}"
            })
            
        timeline.sort(key=lambda x: str(x['date']))
        return timeline

    def get_farm_timeline(self, farm_id: int):
        activities = self.db.query(models.FarmActivity).filter(models.FarmActivity.farm_id == farm_id).all()
        
        timeline = []
        for act in activities:
            timeline.append({
                "date": act.activity_date,
                "type": "Activity",
                "title": act.activity_type,
                "details": act.description or f"{act.activity_type} performed using {act.quantity_used or ''}",
                "crop_cycle_id": act.crop_cycle_id
            })
            
        timeline.sort(key=lambda x: str(x['date']), reverse=True)
        return timeline

    def accept_labor_application(self, application_id: int):
        # Worker application logic
        application = self.db.query(models.LaborApplication).filter(models.LaborApplication.id == application_id).first()
        if not application:
            return None
            
        job = self.db.query(models.LaborJob).filter(models.LaborJob.id == application.job_id).first()
        if job and job.filled_count < job.required_count:
            application.status = "Accepted"
            job.filled_count += 1
            if job.filled_count >= job.required_count:
                job.status = "Filled"
            
            self.db.commit()
            return application
        return None
