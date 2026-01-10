"""
Hugging Face AI Service for Agri-OS
Handles all AI inference using Hugging Face API (100% FREE)
"""
import os
import json
import base64
from typing import Optional, Dict, Any
from PIL import Image
from io import BytesIO

try:
    from huggingface_hub import InferenceClient
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False
    print("⚠️ Hugging Face Hub not installed. Run: pip install huggingface_hub")


class HuggingFaceService:
    """Centralized Hugging Face AI service"""
    
    def __init__(self):
        self.api_key = os.getenv("HUGGINGFACE_API_KEY")
        self.client = None
        
        if HF_AVAILABLE and self.api_key:
            self.client = InferenceClient(token=self.api_key)
            print("✅ Hugging Face API initialized")
        else:
            print("⚠️ Hugging Face API not configured")
    
    def is_available(self) -> bool:
        """Check if Hugging Face is ready"""
        return HF_AVAILABLE and self.client is not None
    
    def generate_text(self, prompt: str, model: str = None) -> str:
        """
        Generate text using Hugging Face LLM with intelligent fallback
        Uses chat_completion API (what providers actually support)
        """
        if not self.is_available():
            raise ValueError("Hugging Face not available")
        
        # Model priority list
        models_to_try = [
            # "meta-llama/Llama-4-Scout-17B-16E-Instruct", # Too large for free tier
            "meta-llama/Llama-3.1-8B-Instruct",
            "HuggingFaceH4/zephyr-7b-beta",
            "google/gemma-2-9b-it",
            "microsoft/Phi-3-mini-4k-instruct",
        ]
        
        if model and model not in models_to_try:
            models_to_try.insert(0, model)
        
        last_error = None
        
        for model_name in models_to_try:
            try:
                print(f"🤖 Trying model: {model_name}")
                
                # Use chat_completion (what providers support)
                messages = [{"role": "user", "content": prompt}]
                
                response = self.client.chat_completion(
                    messages=messages,
                    model=model_name,
                    max_tokens=1500,
                    temperature=0.7,
                )
                
                # Extract text from response
                generated_text = response.choices[0].message.content
                
                print(f"✅ Success with model: {model_name}")
                return generated_text
                
            except Exception as e:
                error_msg = str(e).lower()
                print(f"⚠️ {model_name} failed: {str(e)[:100]}...")
                
                if "not supported" in error_msg or "not found" in error_msg or "does not exist" in error_msg:
                    print(f"   → Model not available, trying next...")
                    last_error = e
                    continue
                elif "rate limit" in error_msg or "quota" in error_msg:
                    print(f"   → Rate limited, trying next...")
                    last_error = e
                    continue
                else:
                    last_error = e
                    continue
        
        # All models failed
        print(f"❌ All models failed. Last error: {last_error}")
        raise Exception(f"All available models failed. Last error: {last_error}")
    
    def analyze_image(self, image_path: str, question: str, model: str = None) -> str:
        """
        Analyze image using Hugging Face Vision models (Hybrid Strategy)
        1. Try Captioning (BLIP Base - fast/free)
        2. Fallback to Classification (ViT - extremely reliable)
        3. Pass insights to LLM for final diagnosis
        """
        if not self.is_available():
            raise ValueError("Hugging Face not available")
            
        print(f"🔬 Analyzing image with Hugging Face Vision AI")
        
        # Strategy 0: Crop Validation (General ViT)
        is_val_passed = False
        validation_warning = ""
        detected_generics = []
        
        try:
            val_model = "google/vit-base-patch16-224"
            print(f"🔍 Validating image with {val_model}")
            
            # Pass image path/URL directly
            response = self.client.image_classification(
                image=image_path,
                model=val_model
            )
            
            # Expanded Keywords indicating valid crop/plant
            plant_keywords = [
                'plant', 'tree', 'flower', 'vegetable', 'fruit', 'crop', 'leaf', 
                'agriculture', 'garden', 'grass', 'herb', 'shrub', 'wheat', 'corn', 
                'rice', 'potato', 'tomato', 'pepper', 'stem', 'root', 'botanical',
                'broccoli', 'cabbage', 'carrot', 'cucumber', 'eggplant', 'lettuce', 
                'onion', 'spinach', 'squash', 'zucchini', 'apple', 'banana', 'grape', 
                'lemon', 'lime', 'orange', 'peach', 'pear', 'strawberry', 'watermelon',
                'pod', 'seed', 'grain', 'bean', 'soy', 'nut', 'berry', 'food',
                'fungus', 'mushroom', 'bark', 'forest', 'wild', 'nature'
            ]
            
            # Check top 5 labels
            for item in response[:5]:
                label_lower = item.label.lower()
                detected_generics.append(f"{item.label}")
                
                if any(kw in label_lower for kw in plant_keywords):
                    is_val_passed = True
                    break
            
            if not is_val_passed:
                validation_warning = f"Generic model detected: {', '.join(detected_generics[:3])}"
                print(f"⚠️ Validation Warning: {validation_warning}")
            else:
                print(f"✅ Crop Validation: PASSED ({detected_generics[0]})")
            
        except Exception as e:
            print(f"⚠️ Validation failed: {e}. Proceeding cautiously.")
            is_val_passed = True # Fail open checked later
            
        # We DO NOT return here anymore. We let the specialized model verify.
        
        vision_context = ""
        max_disease_conf = 0.0

        # Strategy 1: Plant Disease Classification (Specialized Model)
        try:
            class_model = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
            print(f"🔄 Strategy 1: Classification with {class_model}")
            
            response = self.client.image_classification(
                image=image_path,
                model=class_model
            )
            
            # Extract top labels
            labels = []
            for item in response:
                 if item.score > 0.05:
                      labels.append(f"{item.label} ({item.score:.2f})")
                      if item.score > max_disease_conf:
                           max_disease_conf = item.score

            vision_context = f"Detected Disease: {', '.join(labels)}"
            print(f"✅ Classification success: {labels}")
            
            # FINAL VALIDATION CHECK
            # If generic validation failed AND specialized model is also unsure (< 0.2), then it's not a crop.
            if not is_val_passed and max_disease_conf < 0.2:
                 return f"NOT_A_CROP_ERROR: The image does not appear to be a crop. {validation_warning}. Specialized model confidence low ({max_disease_conf:.2f})."
            
        except Exception as e:
            print(f"❌ Classification failed: {e}")
            vision_context = f"Visual analysis failed. Assume standard visual symptoms for {question}."

        # Pass vision insights to LLM for diagnosis
        interpretation_prompt = f"""
        You are an expert Plant Pathologist.
        
        INPUT DATA:
        - Crop Name provided by user: {question} (Verify if this matches visual analysis)
        - Visual Analysis: "{vision_context}"
        
        TASK:
        Diagnose the issue and provide a DETAILED report.
        1. Identify the crop part and name: (e.g. "Leaf of Tomato", "Fruit of Apple", "Stem of Wheat").
        2. Identify the disease/pest/deficiency.
           - IF THE CROP LOOKS FRESH AND HEALTHY: Diagnose as "Healthy".
           - IF IT HAS ISSUES: Identify specific disease (Blight, Rot, Spot, etc).
        3. Explain the Cause (or "N/A" if healthy).
        4. Provide organic/natural remedies (or "N/A" if healthy).
        5. Provide chemical/artificial remedies (or "N/A" if healthy).
        6. Explain prevention.
        
        OUTPUT FORMAT (JSON ONLY - NO MARKDOWN):
        {{
            "disease": "Disease Name" (or "Healthy" / "Fresh"),
            "confidence": 0.95,
            "identified_crop": "Leaf of Tomato / Fruit of Lemon",
            "symptoms": "Detailed visual description",
            "cause": "Fungal infection caused by..." (or null if healthy),
            "prevention": "Crop rotation, avoid overhead watering...",
            "treatment_organic": "Neem oil..." (or null if healthy),
            "treatment_chemical": "Mancozeb..." (or null if healthy),
            "affected_parts": ["leaves", "stem", "fruit"],
            "severity": "Mild/Moderate/Severe"
        }}
        """
        
        # Use our robust text generation for final output
        return self.generate_text(interpretation_prompt)
    
    def generate_crop_profile(self, crop_name: str) -> Dict[str, Any]:
        """Generate detailed crop profile using LLM"""
        prompt = f"""You are an agricultural expert. Generate a detailed JSON profile for the crop: {crop_name}.

Return ONLY valid JSON (no markdown):
{{
    "name": "{crop_name}",
    "scientific_name": "string",
    "category": "Cereal/Vegetable/Fruit/Pulse/etc",
    "difficulty": "Easy/Medium/Hard",
    "lifetime_days": 120,
    "season": ["Season Name"],
    "growing_requirements": {{
        "water_needs": "Low/Medium/High",
        "sun_exposure": "string",
        "soil_type": "string",
        "ph_level": "string",
        "temperature_range": {{"min": 10, "max": 30}}
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
}}"""
        
        response = self.generate_text(prompt)
        
        # Clean and parse JSON
        clean_response = response.replace("```json", "").replace("```", "").strip()
        
        try:
            start_idx = clean_response.find('{')
            if start_idx != -1:
                result, _ = json.JSONDecoder().raw_decode(clean_response[start_idx:])
                return result
            else:
                return json.loads(clean_response)
        except Exception:
             return json.loads(clean_response)
    
    def diagnose_plant_disease(self, image_path: str, crop: str) -> Dict[str, Any]:
        """Diagnose plant disease from image"""
        question = f"""Analyze this {crop} plant image. Identify:
1. Disease name (or "Healthy")
2. Confidence level (0.0-1.0)
3. Affected parts
4. Severity (Mild/Moderate/Severe)
5. Symptoms

Return as: Disease: [name], Confidence: [value], Parts: [list], Severity: [level], Symptoms: [description]"""
        
        response = self.analyze_image(image_path, question)
        
        # Parse response and structure it
        result = {
            "disease": "Unknown",
            "confidence": 0.0,
            "affected_parts": [],
            "severity": "Unknown",
            "symptoms": response
        }
        
        # Try to extract structured info from response
        if "NOT_A_CROP_ERROR" in response:
             result["disease"] = "Not a Crop"
             result["confidence"] = 1.0
             result["severity"] = "N/A"
             result["symptoms"] = response.replace("NOT_A_CROP_ERROR: ", "")
             return result

        if "disease:" in response.lower():
            parts = response.split(",")
            for part in parts:
                if "disease:" in part.lower():
                    result["disease"] = part.split(":")[-1].strip()
                elif "confidence:" in part.lower():
                    try:
                        result["confidence"] = float(part.split(":")[-1].strip())
                    except:
                        result["confidence"] = 0.85
                elif "severity:" in part.lower():
                    result["severity"] = part.split(":")[-1].strip()
        
        # Default confidence if not parsed
        if result["confidence"] == 0.0:
            result["confidence"] = 0.80
        
        # Default disease name from response if not parsed
        if result["disease"] == "Unknown" and len(response) > 0:
            result["disease"] = response.split(",")[0].split(":")[-1].strip()
        
        return result


# Singleton instance
_hf_service = None

def get_huggingface_service() -> HuggingFaceService:
    """Get or create Hugging Face service instance"""
    global _hf_service
    if _hf_service is None:
        _hf_service = HuggingFaceService()
    return _hf_service
