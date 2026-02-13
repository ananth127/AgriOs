# DOCUMENTATION_SOURCE: README.md
# Free AI Implementation - Voice Search Service
# Using: Whisper (Speech-to-Text) + Gemini (NLU) + Google TTS

import os
import json
import tempfile
from typing import Dict, Tuple
from . import schemas

# Option 1: Using Whisper (100% Free, Self-hosted)
try:
    import whisper
    WHISPER_AVAILABLE = True
    # Load model once on startup (choose size based on your server)
    # Options: tiny, base, small, medium, large
    whisper_model = whisper.load_model("base")  # Good balance of speed/accuracy
except ImportError:
    WHISPER_AVAILABLE = False
    print("Whisper not installed. Install with: pip install openai-whisper")

# Option 2: Using LiteLLM (Unified AI)
try:
    from app.core.llm_service import get_llm_service
    LITELLM_AVAILABLE = True
    llm_service = get_llm_service()
except ImportError:
    LITELLM_AVAILABLE = False
    print("LiteLLM service not found")

# Option 3: Google Cloud TTS (Free tier: 1M chars/month)
try:
    from google.cloud import texttospeech
    TTS_AVAILABLE = True
    # tts_client = texttospeech.TextToSpeechClient()
    # TTS_AVAILABLE = False # Temporarily disabled until credentials are properly loaded
except ImportError:
    TTS_AVAILABLE = False
    print("Google TTS not installed. Install with: pip install google-cloud-texttospeech")


def transcribe_audio_whisper(audio_bytes: bytes) -> Tuple[str, str]:
    """
    Transcribe audio using Whisper (FREE, self-hosted)
    
    Args:
        audio_bytes: Audio file bytes
        
    Returns:
        (transcription_text, detected_language)
    """
    if not WHISPER_AVAILABLE:
        return "Whisper not available", "en"
    
    # Save bytes to temporary file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
        temp_audio.write(audio_bytes)
        temp_path = temp_audio.name
    
    try:
        # Transcribe with Whisper
        result = whisper_model.transcribe(
            temp_path,
            language=None,  # Auto-detect language
            task="transcribe"
        )
        
        return result["text"], result.get("language", "en")
    
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


def classify_intent_gemini(text: str) -> Dict:
    """
    Classify intent and extract parameters using Gemini API (FREE)
    
    Args:
        text: Transcribed text from user
        
    Returns:
        {"intent": "...", "parameters": {...}}
    """
    if not LITELLM_AVAILABLE:
        # Fallback to simple keyword matching
        return classify_intent_simple(text)
    
    try:
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
   - date: Time reference (today, tomorrow, etc.)
   - action: What user wants to do
   - page: If intent is navigate, target page (e.g., 'marketplace', 'weather', 'profile', 'crops', 'home', 'settings')

5. **Navigation Mapping**:
   If user says "Go to market" -> intent: navigate, parameters: { page: "marketplace" }
   If user says "Check weather" -> intent: navigate, parameters: { page: "weather" } (or weather intent)
   If user says "My crops" -> intent: navigate, parameters: { page: "crops" }
   If user says "Dashboard" or "Home" -> intent: navigate, parameters: { page: "home" }

Query: "{text}"

Return ONLY valid JSON in this exact format:
{{"intent": "check_price", "parameters": {{"crop": "Onion", "location": "Nasik"}}}}
OR
{{"intent": "navigate", "parameters": {{"page": "marketplace"}}}}
"""
        
        # Use LiteLLM (defaulting to Gemini via configuration or explicit model)
        # Using gemini/gemini-1.5-flash as default efficient model
        result_text = llm_service.generate_text(prompt, model="gemini/gemini-1.5-flash")
        result_text = result_text.strip()
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
        
        # Parse JSON
        result = json.loads(result_text)
        return result
    
    except Exception as e:
        print(f"Intent classification error: {e}")
        # Fallback to simple matching
        return classify_intent_simple(text)


def classify_intent_simple(text: str) -> Dict:
    """
    Simple keyword-based intent classification (Fallback)
    """
    lower_text = text.lower()
    intent = "unknown"
    params = {}
    
    # Check for price queries
    if any(word in lower_text for word in ["price", "rate", "cost", "भाव", "ಬೆಲೆ", "விலை", "ధర", "വില", "दर"]):
        intent = "check_price"
        
        # Extract crop name (simple matching)
        crops = ["onion", "tomato", "potato", "rice", "wheat", "cotton", "sugarcane"]
        for crop in crops:
            if crop in lower_text:
                params["crop"] = crop.capitalize()
                break
        
        # Extract location
        locations = ["nasik", "pune", "mumbai", "bangalore", "delhi", "kolkata"]
        for loc in locations:
            if loc in lower_text:
                params["location"] = loc.capitalize()
                break
    
    # Check for weather queries
    elif any(word in lower_text for word in ["weather", "rain", "temperature", "मौसम", "ಹವಾಮಾನ"]):
        intent = "weather"
    
    # Check for crop advice
    elif any(word in lower_text for word in ["plant", "grow", "fertilizer", "pest", "disease", "सलाह"]):
        intent = "crop_advice"
    
    return {"intent": intent, "parameters": params}


def generate_response_gemini(intent: str, params: Dict, language: str = "en") -> str:
    """
    Generate natural language response using Gemini (FREE)
    
    Args:
        intent: Classified intent
        params: Extracted parameters
        language: Language code for response
        
    Returns:
        Response text
    """
    if not LITELLM_AVAILABLE:
        return generate_response_simple(intent, params)
    
    try:
        # Map language codes to full names
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

If intent is "navigate":
- Confirm you are taking them there
- Keep it very short: "Opening Marketplace..." or "Taking you to Weather..."

If intent is "unknown":
- Politely say you didn't understand
- Ask them to rephrase
"""
        
        response_text = llm_service.generate_text(prompt, model="gemini/gemini-1.5-flash")
        return response_text.strip()
    
    except Exception as e:
        print(f"Response generation error: {e}")
        return generate_response_simple(intent, params)


def generate_response_simple(intent: str, params: Dict) -> str:
    """
    Simple template-based response generation (Fallback)
    """
    if intent == "check_price":
        crop = params.get("crop", "the crop")
        location = params.get("location", "your area")
        # In production, query actual database
        return f"The price of {crop} in {location} is trending at 45 rupees per kg. Prices are stable this week."
    
    elif intent == "weather":
        return "Today's weather: Partly cloudy with a high of 28°C. Light rain expected tomorrow. Good time for irrigation."
    
    elif intent == "crop_advice":
        return "For best results, ensure proper soil preparation and use organic fertilizers. Monitor for pests regularly."
    
    elif intent == "navigate":
        return "Sure, I'll take you there."
    else:
        return "I didn't quite understand that. Could you please rephrase your question?"


def get_tts_client():
    """Lazy-load Google TTS client to avoid import-time crashes."""
    if not TTS_AVAILABLE:
        return None
    try:
        return texttospeech.TextToSpeechClient()
    except Exception as e:
        print(f"Failed to create Google TTS client: {e}")
        return None

def text_to_speech_google(text: str, language_code: str = "en-IN") -> bytes:
    """
    Convert text to speech using Google Cloud TTS (FREE tier)
    
    Args:
        text: Text to convert
        language_code: Language code (en-IN, hi-IN, etc.)
        
    Returns:
        Audio bytes (MP3)
    """
    if not TTS_AVAILABLE:
        return b""  # Return empty bytes if TTS not available
    
    try:
        client = get_tts_client()
        if not client:
            return b""

        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Select voice
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=f"{language_code}-Wavenet-A",  # High quality voice
        )
        
        # Configure audio
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,
            pitch=0.0
        )
        
        # Generate speech
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        return response.audio_content
    
    except Exception as e:
        print(f"TTS error: {e}")
        return b""


def process_audio(file_bytes: bytes) -> schemas.VoiceQueryResponse:
    """
    Main processing function - orchestrates all steps
    
    Uses FREE alternatives:
    1. Whisper for Speech-to-Text (self-hosted)
    2. Gemini for Intent Classification (free API)
    3. Gemini for Response Generation (free API)
    
    Args:
        file_bytes: Audio file bytes
        
    Returns:
        VoiceQueryResponse with all extracted information
    """
    
    # Step 1: Speech-to-Text using Whisper
    if WHISPER_AVAILABLE and len(file_bytes) > 0:
        transcription, language = transcribe_audio_whisper(file_bytes)
    else:
        # Mock for testing
        transcription = "What is the price of Onion in Nasik?"
        language = "en"
    
    # Step 2: Intent Classification using Gemini
    intent_result = classify_intent_gemini(transcription)
    intent = intent_result.get("intent", "unknown")
    params = intent_result.get("parameters", {})
    
    # Step 3: Generate Response using Gemini
    response_text = generate_response_gemini(intent, params, language)
    
    # Step 4: (Optional) Generate audio response
    # audio_response = text_to_speech_google(response_text, f"{language}-IN")
    
    return schemas.VoiceQueryResponse(
        transcription=transcription,
        detected_language=language,
        intent=intent,
        parameters=params,
        response_text=response_text
    )
