from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from datetime import datetime
from app.core.database import Base

class DiagnosisLog(Base):
    __tablename__ = "diagnosis_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    image_url = Column(String)
    crop_name = Column(String, index=True)
    
    # AI Results
    disease_detected = Column(String, index=True)      # e.g., "Late Blight"
    confidence_score = Column(Float)                   # e.g., 0.95
    recommendation = Column(Text)                      # e.g., "Apply Fungicide X..."
    
    # Detailed Info (Added for v2)
    cause = Column(Text, nullable=True)
    prevention = Column(Text, nullable=True)
    treatment_organic = Column(Text, nullable=True)
    treatment_chemical = Column(Text, nullable=True)
    identified_crop = Column(String, nullable=True)
    
    # Metadata
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Drift Monitoring / Active Learning
    verified_label = Column(String, nullable=True)     # Human corrected label
    is_flagged_for_review = Column(Boolean, default=False) # Low confidence trigger
    human_reviewer_id = Column(Integer, nullable=True) # Who verified it
