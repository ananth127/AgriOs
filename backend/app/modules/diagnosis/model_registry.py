"""
Model Registry Service for Edge AI Deployment
Manages ML model versions, distribution, and OTA updates for edge devices.
"""
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import Base
import os
import hashlib


# ============ Database Models ============

class EdgeModel(Base):
    """Tracks ML models available for edge deployment"""
    __tablename__ = "edge_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "disease_detector_v3"
    model_type = Column(String, nullable=False)  # "tflite", "onnx", "tfjs"
    version = Column(String, nullable=False)  # Semantic versioning
    file_url = Column(String, nullable=False)  # Download URL
    file_hash = Column(String, nullable=False)  # SHA256 for integrity
    file_size_bytes = Column(Integer, nullable=False)
    
    # Model metadata
    input_shape = Column(JSON, default={})  # e.g., {"width": 224, "height": 224, "channels": 3}
    output_classes = Column(JSON, default=[])  # List of class labels
    accuracy = Column(Float, default=0.0)  # Validation accuracy
    
    # Deployment info
    is_active = Column(Boolean, default=True)
    min_app_version = Column(String, nullable=True)
    target_crops = Column(JSON, default=[])  # Crops this model is trained for
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ModelDownloadLog(Base):
    """Tracks model downloads for analytics"""
    __tablename__ = "model_download_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=True)
    device_type = Column(String, nullable=True)  # "android", "ios", "web"
    app_version = Column(String, nullable=True)
    downloaded_at = Column(DateTime, default=datetime.utcnow)


# ============ Pydantic Schemas ============

class ModelInfo(BaseModel):
    id: int
    name: str
    model_type: str
    version: str
    file_url: str
    file_hash: str
    file_size_bytes: int
    input_shape: dict
    output_classes: list
    accuracy: float
    is_active: bool
    target_crops: list
    
    class Config:
        from_attributes = True


class ModelUpdateCheck(BaseModel):
    current_version: Optional[str] = None
    model_name: str = "disease_detector"
    device_type: str = "web"


class ModelUpdateResponse(BaseModel):
    update_available: bool
    latest_version: Optional[str] = None
    download_url: Optional[str] = None
    file_hash: Optional[str] = None
    file_size_bytes: Optional[int] = None
    release_notes: Optional[str] = None


# ============ Disease Treatment Mapping ============

DISEASE_TREATMENTS = {
    "Late Blight": {
        "cause": "Phytophthora infestans fungus, spreads in cool, wet conditions",
        "symptoms": "Dark water-soaked lesions on leaves, white fuzzy growth underneath",
        "prevention": "Use resistant varieties, ensure good air circulation, avoid overhead watering",
        "treatment_organic": "Copper-based fungicides, remove infected plants immediately",
        "treatment_chemical": "Mancozeb, Chlorothalonil, Metalaxyl"
    },
    "Early Blight": {
        "cause": "Alternaria solani fungus, favored by warm humid weather",
        "symptoms": "Brown spots with concentric rings (target spots) on lower leaves",
        "prevention": "Crop rotation, mulching, adequate spacing between plants",
        "treatment_organic": "Neem oil, Bacillus subtilis-based products",
        "treatment_chemical": "Azoxystrobin, Difenoconazole"
    },
    "Powdery Mildew": {
        "cause": "Various fungal species, spreads in dry conditions with high humidity",
        "symptoms": "White powdery coating on leaves and stems",
        "prevention": "Good air circulation, avoid crowding plants",
        "treatment_organic": "Baking soda spray, milk spray, sulfur",
        "treatment_chemical": "Myclobutanil, Triadimefon"
    },
    "Leaf Curl": {
        "cause": "Viral infection spread by whiteflies",
        "symptoms": "Upward curling and distortion of leaves, stunted growth",
        "prevention": "Control whitefly population, use resistant varieties",
        "treatment_organic": "Yellow sticky traps, neem oil for whiteflies",
        "treatment_chemical": "Imidacloprid (for vector control)"
    },
    "Bacterial Wilt": {
        "cause": "Ralstonia solanacearum bacteria in soil",
        "symptoms": "Sudden wilting, brown discoloration of vascular tissue",
        "prevention": "Crop rotation, use pathogen-free seeds, soil solarization",
        "treatment_organic": "Bio-fumigation with mustard, Trichoderma application",
        "treatment_chemical": "No effective chemical treatment - prevention is key"
    },
    "Anthracnose": {
        "cause": "Colletotrichum species fungus",
        "symptoms": "Sunken dark spots on fruits, stems, and leaves",
        "prevention": "Use disease-free seeds, proper spacing, avoid overhead irrigation",
        "treatment_organic": "Copper hydroxide, Bordeaux mixture",
        "treatment_chemical": "Mancozeb, Carbendazim"
    },
    "Fall Armyworm": {
        "cause": "Spodoptera frugiperda larvae infestation",
        "symptoms": "Ragged holes in leaves, sawdust-like frass in leaf whorls",
        "prevention": "Early planting, pheromone traps, intercropping",
        "treatment_organic": "Bacillus thuringiensis (Bt), neem-based products",
        "treatment_chemical": "Emamectin benzoate, Spinosad, Chlorantraniliprole"
    },
    "Healthy": {
        "cause": None,
        "symptoms": "No disease symptoms detected",
        "prevention": "Continue current management practices",
        "treatment_organic": None,
        "treatment_chemical": None
    }
}


# ============ Service Class ============

class ModelRegistryService:
    """Service for managing edge AI models and their deployment"""
    
    def __init__(self, db: Session):
        self.db = db
        self.models_dir = os.getenv("EDGE_MODELS_DIR", "static/models")
    
    def get_latest_model(self, model_name: str = "disease_detector", 
                         model_type: str = "tfjs") -> Optional[EdgeModel]:
        """Get the latest active version of a model"""
        return self.db.query(EdgeModel).filter(
            EdgeModel.name == model_name,
            EdgeModel.model_type == model_type,
            EdgeModel.is_active == True
        ).order_by(EdgeModel.version.desc()).first()
    
    def check_for_update(self, request: ModelUpdateCheck) -> ModelUpdateResponse:
        """Check if a newer model version is available"""
        latest = self.get_latest_model(
            model_name=request.model_name,
            model_type="tfjs" if request.device_type == "web" else "tflite"
        )
        
        if not latest:
            return ModelUpdateResponse(update_available=False)
        
        # Compare versions
        if request.current_version is None or latest.version > request.current_version:
            return ModelUpdateResponse(
                update_available=True,
                latest_version=latest.version,
                download_url=latest.file_url,
                file_hash=latest.file_hash,
                file_size_bytes=latest.file_size_bytes,
                release_notes=f"Updated {latest.name} with improved accuracy ({latest.accuracy:.1%})"
            )
        
        return ModelUpdateResponse(update_available=False)
    
    def get_all_models(self, active_only: bool = True) -> List[EdgeModel]:
        """Get all registered models"""
        query = self.db.query(EdgeModel)
        if active_only:
            query = query.filter(EdgeModel.is_active == True)
        return query.all()
    
    def register_model(self, name: str, version: str, model_type: str,
                       file_path: str, output_classes: list,
                       input_shape: dict = None, accuracy: float = 0.0,
                       target_crops: list = None) -> EdgeModel:
        """Register a new model version"""
        
        # Calculate file hash
        with open(file_path, 'rb') as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
        
        file_size = os.path.getsize(file_path)
        
        model = EdgeModel(
            name=name,
            version=version,
            model_type=model_type,
            file_url=f"/static/models/{os.path.basename(file_path)}",
            file_hash=file_hash,
            file_size_bytes=file_size,
            input_shape=input_shape or {"width": 224, "height": 224, "channels": 3},
            output_classes=output_classes,
            accuracy=accuracy,
            target_crops=target_crops or []
        )
        
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return model
    
    def log_download(self, model_id: int, user_id: int = None,
                     device_type: str = None, app_version: str = None):
        """Log a model download for analytics"""
        log = ModelDownloadLog(
            model_id=model_id,
            user_id=user_id,
            device_type=device_type,
            app_version=app_version
        )
        self.db.add(log)
        self.db.commit()
    
    def get_treatment_for_disease(self, disease_name: str) -> dict:
        """Get treatment recommendations for a detected disease"""
        # Normalize disease name
        normalized = disease_name.strip().title()
        
        # Direct match
        if normalized in DISEASE_TREATMENTS:
            return DISEASE_TREATMENTS[normalized]
        
        # Fuzzy match
        for key in DISEASE_TREATMENTS:
            if key.lower() in normalized.lower() or normalized.lower() in key.lower():
                return DISEASE_TREATMENTS[key]
        
        # Default response
        return {
            "cause": "Unknown - consult local agricultural extension",
            "symptoms": disease_name,
            "prevention": "Maintain good crop hygiene and monitor regularly",
            "treatment_organic": "Consult local expert for organic treatments",
            "treatment_chemical": "Consult licensed agronomist for chemical options"
        }
    
    def seed_default_model(self):
        """Seed database with default model info (for demo purposes)"""
        existing = self.get_latest_model("disease_detector", "tfjs")
        if existing:
            return existing
        
        model = EdgeModel(
            name="disease_detector",
            version="1.0.0",
            model_type="tfjs",
            file_url="/static/models/disease_detector_v1/model.json",
            file_hash="demo_hash_placeholder",
            file_size_bytes=5_000_000,
            input_shape={"width": 224, "height": 224, "channels": 3},
            output_classes=[
                "Healthy", "Late Blight", "Early Blight", "Powdery Mildew",
                "Leaf Curl", "Bacterial Wilt", "Anthracnose", "Fall Armyworm"
            ],
            accuracy=0.92,
            target_crops=["Tomato", "Potato", "Pepper", "Maize"]
        )
        
        self.db.add(model)
        self.db.commit()
        self.db.refresh(model)
        return model
