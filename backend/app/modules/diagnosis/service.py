import os
import random
from sqlalchemy.orm import Session
from . import models, schemas
from app.modules.knowledge_graph.service import KnowledgeGraphService
from app.core.huggingface_service import get_huggingface_service
import json

class DiagnosisService:
    def __init__(self, db: Session):
        self.db = db
        self.kg_service = KnowledgeGraphService(db)
        self.hf_service = get_huggingface_service()

    def perform_diagnosis(self, image_url: str, crop: str = "Unknown", user_id: int = None) -> models.DiagnosisLog:
        """
        Perform AI-powered image diagnosis using Hugging Face (FREE)
        Falls back to mock if unavailable.
        """
        
        if self.hf_service.is_available():
            try:
                return self._huggingface_diagnosis(image_url, crop, user_id)
            except Exception as e:
                print(f"⚠️ Hugging Face diagnosis failed: {e}. Using mock.")
                return self._mock_diagnosis(image_url, crop, user_id)
        else:
            print("ℹ️ Hugging Face not configured. Using mock diagnosis.")
            return self._mock_diagnosis(image_url, crop, user_id)

    def _huggingface_diagnosis(self, image_url: str, crop: str, user_id: int = None) -> models.DiagnosisLog:
        """
        Use Hugging Face Vision AI (Hybrid Strategy) for diagnosis
        """
        print(f"🔬 Analyzing image with Hugging Face Hybrid Vision: {image_url}")
        
        # Handle local image paths
        if image_url.startswith('/static/'):
            local_path = os.path.join('static', image_url.replace('/static/', ''))
        else:
            local_path = image_url
            
        try:
            # Initialize result to empty dict to prevent scope errors
            result = {}
            
            # This now returns a JSON string from the Hybrid Vision system
            json_response = self.hf_service.analyze_image(local_path, crop)
            
            # Clean and parse JSON
            clean_response = json_response.replace("```json", "").replace("```", "").strip()
            
            # Check for Crop Validation Error first
            if "NOT_A_CROP_ERROR" in clean_response:
                print(f"⚠️ {clean_response}")
                disease_name = "Not a Crop"
                confidence = 0.0
            else:
                try:
                    # Find first brace
                    start_idx = clean_response.find('{')
                    if start_idx != -1:
                        # raw_decode stops once it parses a valid JSON object
                        json_str = clean_response[start_idx:]
                        result, _ = json.JSONDecoder().raw_decode(json_str)
                    else:
                        # No brace, try raw load
                        result = json.loads(clean_response)
                        
                    disease_name = result.get("disease", "Unknown")
                    confidence = result.get("confidence", 0.0)
                except Exception as parse_error:
                    print(f"⚠️ JSON Parse Error: {parse_error}. Attempting Regex Fallback...")
                    
                    # Regex Fallback Strategy (Robust for LLM errors)
                    import re
                    
                    # Extract Disease
                    disease_match = re.search(r'"disease"\s*:\s*"([^"]+)"', clean_response, re.IGNORECASE)
                    if disease_match:
                        result["disease"] = disease_match.group(1)
                    
                    # Extract Confidence
                    conf_match = re.search(r'"confidence"\s*:\s*([0-9.]+)', clean_response)
                    if conf_match:
                         try: result["confidence"] = float(conf_match.group(1))
                         except: result["confidence"] = 0.85
                    
                    # Extract Other Fields
                    for field in ["symptoms", "cause", "prevention", "treatment_organic", "treatment_chemical", "identified_crop"]:
                        match = re.search(r'"' + field + r'"\s*:\s*"([^"]+)"', clean_response, re.IGNORECASE)
                        if match:
                             result[field] = match.group(1)
                    
                    disease_name = result.get("disease", "Unknown")
                    confidence = result.get("confidence", 0.0)
                    
                    if disease_name == "Unknown": 
                        print("❌ Regex failed too.")
                        # Last resort: Simple keyword check
                        if "healthy" in clean_response.lower():
                             disease_name = "Healthy"
                             confidence = 0.95
                        else:
                             raise parse_error
            
        except Exception as e:
            print(f"❌ Vision diagnosis failed: {e}. Falling back to basic check.")
            disease_name = "Analysis Failed"
            confidence = 0.0
            result = {}
        
        # Get treatment recommendation from KG
        kg_recommendation = ""
        if disease_name.lower() == "healthy":
            kg_recommendation = "No action needed. Crop looks healthy."
        else:
            kg_recommendation = self.kg_service.get_treatment_for_pest(disease_name)
            if "No specific data" in kg_recommendation:
                self.kg_service.seed_initial_data()
                kg_recommendation = self.kg_service.get_treatment_for_pest(disease_name)
        
        # Determine final recommendation (Prefer LLM detailed info if KG is empty)
        final_recommendation = kg_recommendation
        
        # Check for Healthy/Fresh status
        is_healthy = False
        if "healthy" in disease_name.lower() or "fresh" in disease_name.lower():
            is_healthy = True
            disease_name = "Healthy / Fresh"
            final_recommendation = "✅ The crop appears to be fresh and healthy. No diseases detected."
            # Clear detailed fields for healthy crops
            result['cause'] = None
            result['prevention'] = "Maintain current good practices."
            result['treatment_organic'] = None
            result['treatment_chemical'] = None
        
        elif "No specific data" in kg_recommendation and result and "treatment_organic" in result:
             final_recommendation = f"Organic: {result.get('treatment_organic')}\nChemical: {result.get('treatment_chemical')}"

        print(f"✅ Success with Hugging Face! Disease: {disease_name}")
        
        # Create Log Entry
        diagnosis_entry = models.DiagnosisLog(
            user_id=user_id,
            image_url=image_url,
            crop_name=crop,
            disease_detected=disease_name,
            confidence_score=confidence,
            recommendation=final_recommendation,
            cause=result.get("cause"),
            prevention=result.get("prevention"),
            treatment_organic=result.get("treatment_organic"),
            treatment_chemical=result.get("treatment_chemical"),
            identified_crop=result.get("identified_crop")
        )

        # Drift Monitoring Logic
        if confidence < 0.85:
            diagnosis_entry.is_flagged_for_review = True
        
        self.db.add(diagnosis_entry)
        self.db.commit()
        self.db.refresh(diagnosis_entry)
        
        return diagnosis_entry

    def _gemini_api_diagnosis(self, image_url: str, crop: str, api_key: str, genai) -> models.DiagnosisLog:
        """
        Use Gemini API (FREE) for image analysis.
        """
        print(f"🔬 Analyzing image with Gemini API (Free): {image_url}")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Handle local vs remote images
        if image_url.startswith('http://') or image_url.startswith('https://'):
            # Remote image
            import PIL.Image
            import requests
            from io import BytesIO
            response = requests.get(image_url)
            image = PIL.Image.open(BytesIO(response.content))
        else:
            # Local image
            import PIL.Image
            if image_url.startswith('/static/'):
                local_path = os.path.join('static', image_url.replace('/static/', ''))
            else:
                local_path = image_url
            
            if not os.path.exists(local_path):
                raise FileNotFoundError(f"Image file not found: {local_path}")
            
            image = PIL.Image.open(local_path)
        
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
        
        response = model.generate_content([prompt, image])
        result_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        
        try:
            start_idx = result_text.find('{')
            if start_idx != -1:
                result, _ = json.JSONDecoder().raw_decode(result_text[start_idx:])
            else:
                result = json.loads(result_text)
        except Exception:
             # Fallback
             result = json.loads(result_text)
        
        disease_name = result.get("disease", "Unknown")
        confidence = result.get("confidence", 0.0)
        
        # Get treatment recommendation
        if disease_name.lower() == "healthy":
            recommendation = "No action needed. Crop looks healthy."
        else:
            recommendation = self.kg_service.get_treatment_for_pest(disease_name)
            
            if "No specific data" in recommendation:
                self.kg_service.seed_initial_data()
                recommendation = self.kg_service.get_treatment_for_pest(disease_name)
        
        print(f"✅ Success with Gemini API!")
        
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

    def _vertex_ai_diagnosis(self, image_url: str, crop: str) -> models.DiagnosisLog:
        """
        Use Vertex AI Gemini Pro Vision for real image analysis.
        Implements intelligent model fallback on quota exceeded.
        """
        print(f"🔬 Analyzing image with Vertex AI: {image_url}")
        
        # Initialize Vertex AI
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        
        # Handle credentials
        credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_file and os.path.exists(credentials_file):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_file
            print(f"✅ Using credentials file: {credentials_file}")
        else:
            credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
            if credentials_json:
                import tempfile
                # Write JSON to temp file (ensure it's valid JSON)
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                    # If it's a string representation, write as-is
                    # If it's already parsed, dump it
                    if isinstance(credentials_json, str):
                        f.write(credentials_json)
                    else:
                        json.dump(credentials_json, f)
                    temp_path = f.name
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_path
                print(f"✅ Using credentials from env variable")
        
        vertexai.init(project=project_id, location=location)
        
        # Model fallback chain (ordered by quota likelihood)
        models_to_try = [
            "gemini-1.5-flash",       # Primary: Fast and efficient
            "gemini-flash-latest",    # Fallback 1: Latest flash version
            "gemini-2.0-flash-lite",  # Fallback 2: Lite version
        ]
        
        last_error = None
        
        for model_name in models_to_try:
            try:
                print(f"🤖 Trying model: {model_name}")
                model = GenerativeModel(model_name)
                
                # Handle local vs remote images
                if image_url.startswith('http://') or image_url.startswith('https://'):
                    # Remote image - use URI
                    image_part = Part.from_uri(image_url, mime_type="image/jpeg")
                else:
                    # Local image - convert to base64
                    import base64
                    from pathlib import Path
                    
                    # Convert relative path to absolute
                    if image_url.startswith('/static/'):
                        # Remove /static/ prefix and look in backend/static/
                        local_path = os.path.join('static', image_url.replace('/static/', ''))
                    else:
                        local_path = image_url
                    
                    if not os.path.exists(local_path):
                        raise FileNotFoundError(f"Image file not found: {local_path}")
                    
                    # Read and encode image
                    with open(local_path, 'rb') as img_file:
                        image_bytes = img_file.read()
                    
                    # Create Part from bytes
                    image_part = Part.from_data(data=image_bytes, mime_type="image/jpeg")
                
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
                
                try:
                    start_idx = result_text.find('{')
                    if start_idx != -1:
                        result, _ = json.JSONDecoder().raw_decode(result_text[start_idx:])
                    else:
                        result = json.loads(result_text)
                except Exception:
                     result = json.loads(result_text)
                
                disease_name = result.get("disease", "Unknown")
                confidence = result.get("confidence", 0.0)
                
                # Success! Get treatment recommendation
                if disease_name.lower() == "healthy":
                    recommendation = "No action needed. Crop looks healthy."
                else:
                    recommendation = self.kg_service.get_treatment_for_pest(disease_name)
                    
                    if "No specific data" in recommendation:
                        self.kg_service.seed_initial_data()
                        recommendation = self.kg_service.get_treatment_for_pest(disease_name)
                
                print(f"✅ Success with model: {model_name}")
                
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
                
            except Exception as e:
                error_msg = str(e).lower()
                # Check if it's a quota error
                if "quota" in error_msg or "429" in error_msg or "resource_exhausted" in error_msg:
                    print(f"⚠️ Quota exceeded for {model_name}. Trying next model...")
                    last_error = e
                    continue
                else:
                    # Different error - re-raise
                    print(f"❌ Error with {model_name}: {e}")
                    last_error = e
                    continue
        
        # All models failed
        print(f"❌ All Vertex AI models exhausted. Error: {last_error}")
        raise last_error

    def _mock_diagnosis(self, image_url: str, crop: str, user_id: int = None) -> models.DiagnosisLog:
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
            user_id=user_id,
            image_url=image_url,
            crop_name=crop,
            disease_detected=disease_name,
            confidence_score=confidence,
            recommendation=recommendation
        )

        if confidence < 0.85:
            diagnosis_entry.is_flagged_for_review = True

        self.db.add(diagnosis_entry)
        self.db.commit()
        self.db.refresh(diagnosis_entry)

        return diagnosis_entry

    def get_history(self, limit: int = 10, user_id: int = None):
        query = self.db.query(models.DiagnosisLog)
        if user_id:
            query = query.filter(models.DiagnosisLog.user_id == user_id)
        return query.order_by(models.DiagnosisLog.created_at.desc()).limit(limit).all()
