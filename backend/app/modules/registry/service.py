import os
import json
from sqlalchemy.orm import Session
from . import models, schemas

# Initialize Providers
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel
    VERTEX_AVAILABLE = True
except ImportError:
    VERTEX_AVAILABLE = False
    print("⚠️ Vertex AI not installed. Install with: pip install google-cloud-aiplatform")

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️ Gemini AI not installed. Install with: pip install google-generativeai")

def create_registry_item(db: Session, item: schemas.RegistryCreate):
    db_item = models.RegistryTable(
        name=item.name,
        category=item.category,
        definition=item.definition
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_registry_item(db: Session, name: str):
    return db.query(models.RegistryTable).filter(models.RegistryTable.name == name).first()

def search_or_create_crop(db: Session, crop_name: str):
    """
    Search for a crop in Registry. If not found, use AI to generate it.
    """
    # 1. Search DB (Case-insensitive)
    existing = db.query(models.RegistryTable).filter(models.RegistryTable.name.ilike(crop_name)).first()
    if existing:
        return existing
    
    # 2. Attempt Generation
    # Strategy A: Gemini API (API Key)
    api_key = os.getenv("GEMINI_API_KEY")
    
    if GEMINI_AVAILABLE and api_key:
        try:
            print(f"🤖 Generating crop profile for: {crop_name} (Via Gemini API)")
            genai.configure(api_key=api_key)
            
            # Use available model from list
            model = genai.GenerativeModel('gemini-flash-latest')
            
            prompt = _get_crop_prompt(crop_name)
            response = model.generate_content(prompt)
            data = _parse_json_response(response.text)
            
            if data:
                 return _save_to_db(db, data, crop_name)
                 
        except Exception as e:
            print(f"⚠️ Gemini API failed: {e}. Falling back to Vertex AI...")

    # Strategy B: Vertex AI (Gcloud Auth or Service Account)
    if VERTEX_AVAILABLE:
        print(f"🤖 Generating crop profile for: {crop_name} (Via Vertex AI)")
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT") 
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        
        # Support for local dev: File path from .env
        credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_file and os.path.exists(credentials_file):
            print(f"✅ Using credentials from file: {credentials_file}")
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_file
        
        # Support for Render.com: JSON content from env variable
        credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if credentials_json and not credentials_file:
            import tempfile
            import json as json_lib
            # Write JSON to temp file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                f.write(credentials_json)
                temp_cred_path = f.name
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_cred_path
            print(f"✅ Using credentials from env variable")
        
        vertexai.init(project=project_id, location=location)
        
        # Model fallback chain for text generation
        models_to_try = [
            "gemini-1.5-flash",           # Primary: Best balance
            "gemini-flash-latest",        # Fallback 1: Latest version
            "gemini-2.0-flash-lite",      # Fallback 2: Lite version
        ]
        
        for model_name in models_to_try:
            try:
                print(f"🤖 Trying model: {model_name}")
                model = GenerativeModel(model_name)
                
                prompt = _get_crop_prompt(crop_name)
                response = model.generate_content(prompt)
                data = _parse_json_response(response.text)
                
                if data:
                    print(f"✅ Success with model: {model_name}")
                    return _save_to_db(db, data, crop_name)
                     
            except Exception as e:
                error_msg = str(e).lower()
                if "quota" in error_msg or "429" in error_msg or "resource_exhausted" in error_msg:
                    print(f"⚠️ Quota exceeded for {model_name}. Trying next model...")
                    continue
                else:
                    print(f"❌ Error with {model_name}: {e}")
                    continue
        
        # All models failed
        print(f"❌ All Vertex AI models exhausted for crop generation")
            
    return None

def _get_crop_prompt(crop_name):
    return f"""
        You are an agricultural expert. Generate a JSON object for the crop '{crop_name}'.
        Return ONLY valid JSON.
        Structure:
        {{
            "name": "{crop_name}",
            "scientific_name": "String",
            "category": "Cereal/Vegetable/Fruit/Pulse/etc",
            "difficulty": "Easy/Medium/Hard",
            "lifetime_days": 120,
            "season": ["Season Name"],
            "growing_requirements": {{
                "water_needs": "Low/Medium/High",
                "sun_exposure": "string",
                "soil_type": "string",
                "ph_level": "string",
                "temperature_range": {{ "min": 10, "max": 30 }}
            }},
            "process_stages": [
                {{
                    "stage_name": "string",
                    "days_start": 0,
                    "days_end": 10,
                    "description": "string"
                }}
            ],
            "uses": ["string"]
        }}
    """

def _parse_json_response(text):
    try:
        clean = text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except:
        return None

def _save_to_db(db, data, crop_name):
    new_item = models.RegistryTable(
        name=data.get('name', crop_name),
        category=data.get('category', 'Unknown'),
        definition=data
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

def list_registry_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.RegistryTable).offset(skip).limit(limit).all()

