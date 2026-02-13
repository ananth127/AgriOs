# DOCUMENTATION_SOURCE: README.md
import os
import json
from sqlalchemy.orm import Session
from . import models, schemas
from app.core.huggingface_service import get_huggingface_service

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
    Search for a crop in Registry. If not found, use Hugging Face AI to generate it.
    """
    # 1. Search DB (Case-insensitive)
    existing = db.query(models.RegistryTable).filter(models.RegistryTable.name.ilike(crop_name)).first()
    if existing:
        return existing
    
    # 2. Generate with Hugging Face AI (FREE)
    hf_service = get_huggingface_service()
    
    if not hf_service.is_available():
        print("❌ Hugging Face not configured. Cannot generate crop profile.")
        return None
    
    try:
        print(f"🤖 Generating crop profile for: {crop_name} (via Hugging Face)")
        
        # Generate crop profile using Hugging Face
        data = hf_service.generate_crop_profile(crop_name)
        
        if data:
            print(f"✅ Successfully generated crop profile for {crop_name}")
            return _save_to_db(db, data, crop_name)
        else:
            print(f"❌ Failed to generate crop profile")
            return None
            
    except Exception as e:
        print(f"❌ Hugging Face crop generation failed: {e}")
        return None

    # Strategy B: Vertex AI (Gcloud Auth or Service Account)
    # Strategy B: LiteLLM (Unified)
    # Using LiteLLM instead of raw Vertex AI SDK
    try:
        from app.core.llm_service import get_llm_service
        llm_service = get_llm_service()
        
        print(f"🤖 Generating crop profile for: {crop_name} (Via LiteLLM)")
        prompt = _get_crop_prompt(crop_name)
        
        # Try primary efficient model
        try:
             response_text = llm_service.generate_text(prompt, model="gemini/gemini-1.5-flash")
             data = _parse_json_response(response_text)
             if data:
                 print(f"✅ Success with LiteLLM")
                 return _save_to_db(db, data, crop_name)
        except Exception as e:
             print(f"⚠️ LiteLLM generation failed: {e}")
             
    except ImportError:
        print("LiteLLM service not available")
            
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

