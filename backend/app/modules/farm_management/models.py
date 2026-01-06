from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# 1. Land & Loan Management
class FarmLoan(Base):
    __tablename__ = "farm_loans"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), index=True)
    purpose = Column(String) # Irrigation, Borewell, Machinery, Crop
    
    amount = Column(Float)
    interest_rate = Column(Float) # Percentage
    duration_months = Column(Integer)
    start_date = Column(Date)
    
    outstanding_balance = Column(Float)
    repayment_schedule = Column(JSON) # List of due dates and amounts
    
    # Analyze costs per crop if linked
    linked_crop_cycle_id = Column(Integer, ForeignKey("crop_cycles.id"), nullable=True)

# 2. Fertilizer & Pesticide Management (Inventory)
class FarmInventory(Base):
    __tablename__ = "farm_inventory"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), index=True)
    
    item_type = Column(String) # Fertilizer, Pesticide, Seed, Fuel
    name = Column(String)
    quantity = Column(Float)
    unit = Column(String) # kg, L, bags
    
    purchase_date = Column(Date)
    expiry_date = Column(Date, nullable=True)
    cost_per_unit = Column(Float)

# 3. Tractor & Machinery (Assets)
class FarmAsset(Base):
    __tablename__ = "farm_assets"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), index=True)
    
    name = Column(String)
    asset_type = Column(String) # Tractor, Pump, DripSystem, Sprayer
    purchase_date = Column(Date)
    cost = Column(Float)
    
    status = Column(String, default="Active") # Active, Repair, Sold
    
    # For IoT devices
    is_iot_enabled = Column(Boolean, default=False)
    iot_device_id = Column(String, nullable=True)
    iot_settings = Column(JSON, nullable=True) # Pump capacity, borewell depth etc.

# 4. Activities & Usage (Timeline)
class FarmActivity(Base):
    __tablename__ = "farm_activities"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), index=True)
    crop_cycle_id = Column(Integer, ForeignKey("crop_cycles.id"), nullable=True, index=True)
    
    activity_type = Column(String) # Irrigation, Fertilization, Pesticide, Sowing, Harvesting, MachineryUsage
    activity_date = Column(DateTime(timezone=True), server_default=func.now())
    
    description = Column(String, nullable=True)
    
    # Resource Usage
    item_used_id = Column(Integer, ForeignKey("farm_inventory.id"), nullable=True) # If inventory was used
    quantity_used = Column(Float, nullable=True)
    
    # Machinery Usage
    asset_used_id = Column(Integer, ForeignKey("farm_assets.id"), nullable=True)
    duration_hours = Column(Float, nullable=True)
    acres_covered = Column(Float, nullable=True)
    
    # Financials
    cost = Column(Float, default=0.0) # Calculated cost for this activity (Labor + Material + Fuel)

# 5. Harvest & Stock
class HarvestLog(Base):
    __tablename__ = "harvest_logs"

    id = Column(Integer, primary_key=True, index=True)
    crop_cycle_id = Column(Integer, ForeignKey("crop_cycles.id"))
    
    harvest_date = Column(Date)
    quantity_harvested = Column(Float)
    unit = Column(String) # tons, bags, kg
    
    storage_location = Column(String)
    remaining_stock = Column(Float) # Decreases as sold
    quality_grade = Column(String, nullable=True)

# 6. Labor Management
class LaborJob(Base):
    __tablename__ = "labor_jobs"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    
    title = Column(String) # Weeding, Harvesting
    description = Column(String)
    required_count = Column(Integer)
    filled_count = Column(Integer, default=0)
    
    start_date = Column(Date)
    duration_days = Column(Integer)
    
    wage_per_day = Column(Float)
    provides_food = Column(Boolean, default=False)
    provides_travel = Column(Boolean, default=False)
    
    status = Column(String, default="Open") # Open, Filled, Completed

class LaborApplication(Base):
    __tablename__ = "labor_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("labor_jobs.id"))
    
    worker_user_id = Column(Integer, nullable=True) # If worker is a system user
    worker_name = Column(String)
    worker_phone = Column(String)
    
    status = Column(String, default="Applied") # Applied, Accepted, Rejected

# 7. Financial Snapshot (Aggregated)
class FarmFinancial(Base):
    __tablename__ = "farm_financials"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"))
    year = Column(Integer)
    season = Column(String, nullable=True)
    
    total_investment = Column(Float, default=0.0)
    total_revenue = Column(Float, default=0.0)
    net_profit = Column(Float, default=0.0)
