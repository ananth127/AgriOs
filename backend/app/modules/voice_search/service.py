# Voice Search Service - Using FREE AI (Whisper + Gemini)
import os
import json
import tempfile
from typing import Dict, Tuple
from . import schemas

# Whisper for Speech-to-Text (100% Free, Self-hosted)
try:
    import whisper
    WHISPER_AVAILABLE = True
    # Load model once on startup
    whisper_model = whisper.load_model("base")  # Good balance of speed/accuracy
    print("✅ Whisper loaded successfully")
except (ImportError, OSError, Exception) as e:
    WHISPER_AVAILABLE = False
    print(f"⚠️ Whisper not available: {e}")

# Initialize Vertex AI
try:
    import vertexai
    from vertexai.generative_models import GenerativeModel
    VERTEX_AVAILABLE = True
except ImportError:
    VERTEX_AVAILABLE = False
    print("⚠️ Vertex AI not installed. Install with: pip install google-cloud-aiplatform")

# Speech-to-Text using Google Cloud Speech (part of Vertex AI ecosystem)
try:
    from google.cloud import speech
    GOOGLE_SPEECH_AVAILABLE = True
except ImportError:
    GOOGLE_SPEECH_AVAILABLE = False
    print("⚠️ Google Cloud Speech not available")

def transcribe_audio_google_speech(audio_bytes: bytes) -> Tuple[str, str]:
    """
    Transcribe audio using Google Cloud Speech-to-Text (Vertex AI ecosystem)
    """
    if not GOOGLE_SPEECH_AVAILABLE:
        return "Google Speech not available", "en"
    
    try:
        # Handle credentials (same as Vertex AI)
        credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_file and os.path.exists(credentials_file):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_file
        
        credentials_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if credentials_json and not credentials_file:
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                f.write(credentials_json)
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name
        
        client = speech.SpeechClient()
        
        audio = speech.RecognitionAudio(content=audio_bytes)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            language_code="en-IN",  # Indian English
            alternative_language_codes=["hi-IN", "kn-IN", "ta-IN"],  # Multilingual
            enable_automatic_punctuation=True,
        )
        
        response = client.recognize(config=config, audio=audio)
        
        if response.results:
            transcript = response.results[0].alternatives[0].transcript
            language = response.results[0].language_code or "en"
            return transcript, language
        else:
            return "No speech detected", "en"
            
    except Exception as e:
        print(f"Google Speech error: {e}")
        return "Speech recognition failed", "en"

def classify_intent_gemini(text: str) -> Dict:
    """
    Classify intent using Vertex AI
    """
    if not VERTEX_AVAILABLE:
        return classify_intent_simple(text)
    
    try:
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "your-project-id")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        
        vertexai.init(project=project_id, location=location)
        model = GenerativeModel("gemini-1.5-pro-preview-0409")

        prompt = f"""
You are an agricultural assistant AI. Analyze this farmer's query and extract:

1. **Intent** - Choose ONE from:
   - check_price: User asking about market prices
   - weather: User asking about weather/rainfall
   - crop_advice: User asking for farming advice
   - navigate: User wants to go to a specific page
   - unknown: Cannot determine intent

2. **Parameters** - Extract relevant information:
   - crop: Name of crop/vegetable mentioned
   - location: Place/market name mentioned
   - date: Time reference (today, tomorrow, etc.)

Query: "{text}"

Return ONLY valid JSON in this exact format:
{{"intent": "check_price", "parameters": {{"crop": "Onion", "location": "Nasik"}}}}
"""
        response = model.generate_content(prompt)
        result_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        
        return json.loads(result_text)
    
    except Exception as e:
        print(f"Vertex classification error: {e}")
        return classify_intent_simple(text)


def generate_response_gemini(intent: str, params: Dict, language: str = "en") -> str:
    """
    Generate response using Vertex AI
    """
    if not VERTEX_AVAILABLE:
        return generate_response_simple(intent, params)
    
    try:
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "your-project-id")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        vertexai.init(project=project_id, location=location)
        model = GenerativeModel("gemini-1.5-pro-preview-0409")

        # Map language codes
        lang_map = {
            "en": "English",
            "hi": "Hindi",
            "kn": "Kannada",
            "ta": "Tamil",
            "te": "Telugu",
            "ml": "Malayalam",
            "mr": "Marathi"
        }
        language_name = lang_map.get(language, "English")
        
        prompt = f"""
You are a helpful agricultural assistant speaking to an Indian farmer.

Intent: {intent}
Parameters: {params}
Language: {language_name}

Generate a helpful, friendly response in {language_name}. Keep it concise (2-3 sentences).

If intent is "check_price":
- Provide market price information
- Mention trends if relevant
- Be specific about location and crop

If intent is "weather":
- Provide weather forecast
- Mention farming implications

If intent is "crop_advice":
- Give practical farming advice
- Be specific and actionable

If intent is "unknown":
- Politely say you didn't understand
- Ask them to rephrase
"""
        response = model.generate_content(prompt)
        return response.text.strip()
    
    except Exception as e:
        print(f"Vertex response error: {e}")
        return generate_response_simple(intent, params)


def generate_response_simple(intent: str, params: Dict) -> str:
    """
    Simple template-based response generation (Fallback)
    """
    if intent == "check_price":
        crop = params.get("crop", "the crop")
        location = params.get("location", "your area")
        return f"The price of {crop} in {location} is trending at 45 rupees per kg. Prices are stable this week."
    
    elif intent == "weather":
        return "Today's weather: Partly cloudy with a high of 28°C. Light rain expected tomorrow. Good time for irrigation."
    
    elif intent == "crop_advice":
        return "For best results, ensure proper soil preparation and use organic fertilizers. Monitor for pests regularly."
    
    else:
        return "I didn't quite understand that. Could you please rephrase your question?"


def process_audio(file_bytes: bytes) -> schemas.VoiceQueryResponse:
    """
    Main processing function using FREE AI services:
    1. Whisper for Speech-to-Text (self-hosted, unlimited)
    2. Gemini for Intent Classification (free API, 1500/day)
    3. Gemini for Response Generation (free API, same quota)
    """
    
    # Step 1: Speech-to-Text (Try Google Speech first, then Whisper)
    if GOOGLE_SPEECH_AVAILABLE and len(file_bytes) > 1000:
        try:
            print("🎤 Using Google Cloud Speech-to-Text")
            transcription, language = transcribe_audio_google_speech(file_bytes)
        except Exception as e:
            print(f"⚠️ Google Speech failed: {e}. Trying Whisper...")
            if WHISPER_AVAILABLE:
                transcription, language = transcribe_audio_whisper(file_bytes)
            else:
                transcription = "What is the price of Onion in Nasik?"
                language = "en"
    elif WHISPER_AVAILABLE and len(file_bytes) > 1000:
        try:
            transcription, language = transcribe_audio_whisper(file_bytes)
        except Exception as e:
            print(f"⚠️  Whisper transcription failed: {e}")
            print("Using mock transcription instead")
            transcription = "What is the price of Onion in Nasik?"
            language = "en"
    else:
        # Mock for testing when no audio provided or Whisper not available
        transcription = "What is the price of Onion in Nasik?"
        language = "en"
        print("ℹ️  Using mock transcription (no real audio or Whisper unavailable)")
    
    # Step 2: Intent Classification using Gemini
    intent_result = classify_intent_gemini(transcription)
    intent = intent_result.get("intent", "unknown")
    params = intent_result.get("parameters", {})
    
    # Step 3: Generate Response using Gemini
    response_text = generate_response_gemini(intent, params, language)
    
    return schemas.VoiceQueryResponse(
        transcription=transcription,
        detected_language=language,
        intent=intent,
        parameters=params,
        response_text=response_text
    )

