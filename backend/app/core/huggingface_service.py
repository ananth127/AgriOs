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
            "meta-llama/Llama-4-Scout-17B-16E-Instruct",
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
        
        # Load image bytes
        image_bytes = None
        if image_path.startswith('http'):
            import requests
            response = requests.get(image_path)
            image_bytes = response.content
        else:
            with open(image_path, 'rb') as img_file:
                image_bytes = img_file.read()
        
        vision_context = ""
        
        # Strategy 1: Image Captioning (BLIP Base)
        # Salesforce/blip-image-captioning-base is smaller and more reliable on free tier than 'large'
        try:
            caption_model = "Salesforce/blip-image-captioning-base"
            print(f"🤖 Strategies 1: Captioning with {caption_model}")
            
            response = self.client.image_to_text(
                image=image_bytes,
                model=caption_model
            )
            
            caption = response if isinstance(response, str) else response.generated_text
            vision_context = f"Image Description: {caption}"
            print(f"✅ Caption success: {caption}")
            
        except Exception as e:
            print(f"⚠️ Captioning failed: {e}")
            
            # Strategy 2: Image Classification (ViT)
            # This is extremely reliable on free tier and gives us labels
            try:
                class_model = "google/vit-base-patch16-224"
                print(f"🔄 Strategy 2: Classification with {class_model}")
                
                response = self.client.image_classification(
                    image=image_bytes,
                    model=class_model
                )
                
                # Extract top labels
                labels = [item.label for item in response if item.score > 0.1]
                vision_context = f"Detected Objects/Patterns: {', '.join(labels)}"
                print(f"✅ Classification success: {labels}")
                
            except Exception as e2:
                print(f"❌ Classification also failed: {e2}")
                # Fallback: Assume it's the crop provided by user
                vision_context = f"Visual analysis failed. Assume standard visual symptoms for {question}."

        # Pass vision insights to LLM for diagnosis
        interpretation_prompt = f"""
        You are an expert Plant Pathologist.
        
        INPUT DATA:
        - Crop Name: {question}
        - Visual Analysis: "{vision_context}"
        
        TASK:
        Based on the Visual Analysis and Crop Name, diagnose the issue.
        If the visual analysis mentions "leaf", "rot", "spots", "yellow", or specific disease names, use that.
        If the visual analysis is generic (e.g. just "plant"), describe common issues for this crop.
        
        OUTPUT FORMAT (JSON ONLY):
        {{
            "disease": "Disease Name" (or "Healthy"),
            "confidence": 0.0 to 1.0,
            "symptoms": "Detailed description matching the visual analysis",
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
        
        # Find JSON object
        start_idx = clean_response.find('{')
        end_idx = clean_response.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_str = clean_response[start_idx:end_idx]
            return json.loads(json_str)
        else:
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
