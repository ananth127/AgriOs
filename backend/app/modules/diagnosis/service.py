import os
import random
from sqlalchemy.orm import Session
from . import models, schemas
from app.modules.knowledge_graph.service import KnowledgeGraphService
import json

# Vertex AI for Vision
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel, Part
    VERTEX_AVAILABLE = True
except ImportError:
    VERTEX_AVAILABLE = False
    print("⚠️ Vertex AI not available for image diagnosis")

class DiagnosisService:
    def __init__(self, db: Session):
        self.db = db
        self.kg_service = KnowledgeGraphService(db)

    def perform_diagnosis(self, image_url: str, crop: str = "Unknown") -> models.DiagnosisLog:
        """
        Perform AI-powered image diagnosis using Vertex AI Gemini Pro Vision.
        Falls back to mock if Vertex AI is unavailable.
        """
        
        if VERTEX_AVAILABLE:
            try:
                return self._vertex_ai_diagnosis(image_url, crop)
            except Exception as e:
                print(f"⚠️ Vertex AI diagnosis failed: {e}. Using mock.")
                return self._mock_diagnosis(image_url, crop)
        else:
            return self._mock_diagnosis(image_url, crop)

    def _vertex_ai_diagnosis(self, image_url: str, crop: str) -> models.DiagnosisLog:
        """
        Use Vertex AI Gemini Pro Vision for real image analysis.
        """
        print(f"🔬 Analyzing image with Vertex AI: {image_url}")
        
        # Initialize Vertex AI
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        
        # Handle credentials
        credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_file and os.path.exists(credentials_file):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_file
        
        credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if credentials_json and not credentials_file:
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                f.write(credentials_json)
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name
        
        vertexai.init(project=project_id, location=location)
        
        # Use Gemini Pro Vision
        model = GenerativeModel("gemini-1.5-flash")
        
        # Load image
        image_part = Part.from_uri(image_url, mime_type="image/jpeg")
        
        prompt = f"""
        You are an expert plant pathologist. Analyze this {crop} plant image.
        
        Identify:
        1. Disease name (if any, otherwise "Healthy")
        2. Confidence level (0.0 to 1.0)
        3. Affected parts (leaves, stem, fruit, etc.)
        4. Severity (Mild, Moderate, Severe)
        
        Return ONLY valid JSON:
        {{
            "disease": "Disease Name or Healthy",
            "confidence": 0.95,
            "affected_parts": ["leaves"],
            "severity": "Moderate",
            "symptoms": "Brief description"
        }}
        """
        
        response = model.generate_content([prompt, image_part])
        result_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        
        result = json.loads(result_text)
        
        disease_name = result.get("disease", "Unknown")
        confidence = result.get("confidence", 0.0)
        
        # Get treatment recommendation from Knowledge Graph
        if disease_name.lower() == "healthy":
            recommendation = "No action needed. Crop looks healthy."
        else:
            recommendation = self.kg_service.get_treatment_for_pest(disease_name)
            
            if "No specific data" in recommendation:
                self.kg_service.seed_initial_data()
                recommendation = self.kg_service.get_treatment_for_pest(disease_name)
        
        # Create Log Entry
        diagnosis_entry = models.DiagnosisLog(
            image_url=image_url,
            crop_name=crop,
            disease_detected=disease_name,
            confidence_score=confidence,
            recommendation=recommendation
        )
        
        self.db.add(diagnosis_entry)
        self.db.commit()
        self.db.refresh(diagnosis_entry)
        
        return diagnosis_entry

    def _mock_diagnosis(self, image_url: str, crop: str) -> models.DiagnosisLog:
        """
        Fallback mock diagnosis (original logic).
        """
        possible_diseases = ["Late Blight", "Early Blight", "Healthy"]
        disease_name = random.choice(possible_diseases)
        confidence = random.uniform(0.75, 0.99)
        
        if disease_name == "Healthy":
            recommendation = "No action needed. Crop looks healthy."
        else:
            recommendation = self.kg_service.get_treatment_for_pest(disease_name)
            
            if "No specific data" in recommendation:
                self.kg_service.seed_initial_data()
                recommendation = self.kg_service.get_treatment_for_pest(disease_name)
        
        diagnosis_entry = models.DiagnosisLog(
            image_url=image_url,
            crop_name=crop,
            disease_detected=disease_name,
            confidence_score=confidence,
            recommendation=recommendation
        )
        
        self.db.add(diagnosis_entry)
        self.db.commit()
        self.db.refresh(diagnosis_entry)
        
        return diagnosis_entry

    def get_history(self, limit: int = 10):
        return self.db.query(models.DiagnosisLog).order_by(models.DiagnosisLog.created_at.desc()).limit(limit).all()
