from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
import enum

class LoanStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISBURSED = "DISBURSED"
    CLOSED = "CLOSED"

class CreditScoreCard(Base):
    __tablename__ = "credit_scorecards"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, index=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    total_score = Column(Float) # 0-1000
    
    # Factors
    ndvi_yield_consistency = Column(Float) # Satellite
    repayment_history = Column(Float)
    land_verified = Column(Boolean)
    advisory_adherence = Column(Float) # Behavioral
    
class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, index=True)
    amount_requested = Column(Float)
    purpose = Column(String)
    status = Column(Enum(LoanStatus), default=LoanStatus.APPLIED)
    scorecard_id = Column(Integer, ForeignKey("credit_scorecards.id"), nullable=True)
    
    # Closed-Loop Wallet
    wallet_balance = Column(Float, default=0.0) # Only spendable at partners
    
    transactions = relationship("WalletTransaction", back_populates="loan")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loan_applications.id"))
    retailer_id = Column(Integer) # Where money was spent
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    loan = relationship("LoanApplication", back_populates="transactions")
