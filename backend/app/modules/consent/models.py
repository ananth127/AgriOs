from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ConsentPolicy(Base):
    __tablename__ = "consent_policies"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, unique=True, index=True)  # e.g., "1.0", "2024-JAN"
    content_text = Column(Text, nullable=False) # The actual legal text
    is_required = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserConsent(Base):
    __tablename__ = "user_consents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    policy_id = Column(Integer, ForeignKey("consent_policies.id"))
    is_accepted = Column(Boolean, default=False)
    ip_address = Column(String, nullable=True) # For audit trail
    device_id = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    # user = relationship("User", back_populates="consents") # Assuming User model exists and back_populates is set
    policy = relationship("ConsentPolicy")
