from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class Retailer(Base):
    __tablename__ = "retailers"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String, index=True)
    owner_name = Column(String)
    license_number = Column(String, unique=True)
    
    credit_ledger = relationship("CreditLedger", back_populates="retailer")
    bulk_orders = relationship("BulkOrder", back_populates="retailer")

class CreditLedger(Base):
    """
    Digital Khata: Tracks checks/receivables from farmers.
    """
    __tablename__ = "credit_ledgers"

    id = Column(Integer, primary_key=True, index=True)
    retailer_id = Column(Integer, ForeignKey("retailers.id"))
    farmer_id = Column(Integer, index=True) # Linked to User/Farmer
    amount = Column(Float)
    transaction_type = Column(String) # "CREDIT" (Given), "PAYMENT" (Received)
    description = Column(String)
    due_date = Column(DateTime)
    is_settled = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    retailer = relationship("Retailer", back_populates="credit_ledger")

class BulkOrder(Base):
    """
    Demand Aggregation: Retailer aggregates multiple farmer needs into one order.
    """
    __tablename__ = "bulk_orders"

    id = Column(Integer, primary_key=True, index=True)
    retailer_id = Column(Integer, ForeignKey("retailers.id"))
    status = Column(String, default="DRAFT") # DRAFT, PLACED, SHIPPED
    total_amount = Column(Float)
    
    items = relationship("BulkOrderItem", back_populates="order")
    retailer = relationship("Retailer", back_populates="bulk_orders")

class BulkOrderItem(Base):
    __tablename__ = "bulk_order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("bulk_orders.id"))
    product_name = Column(String)
    quantity = Column(Float)
    
    order = relationship("BulkOrder", back_populates="items")
