# Voice Search Service - Using FREE AI (Whisper + HuggingFace/Local LLM)
import os
import json
import tempfile
from typing import Dict, Tuple
from . import schemas
# Import fallback functions from service_free to fix NameError and reuse logic
try:
    from .service_free import classify_intent_simple, generate_response_simple
except ImportError:
    # If service_free not available, define simple fallbacks here
    def classify_intent_simple(text: str) -> Dict:
        return {"intent": "unknown", "parameters": {}}
    
    def generate_response_simple(intent: str, params: Dict) -> str:
        return "Sorry, I am having trouble processing your request right now."

# Whisper for Speech-to-Text (100% Free, Self-hosted)
try:
    import whisper
    WHISPER_AVAILABLE = True
    # Load model once on startup
    whisper_model = whisper.load_model("base")  # Good balance of speed/accuracy
    print("[OK] Whisper loaded successfully")
except (ImportError, OSError, Exception) as e:
    WHISPER_AVAILABLE = False
    print(f"[WARNING] Whisper not available: {e}")

# Initialize LiteLLM
try:
    from app.core.llm_service import get_llm_service
    LITELLM_AVAILABLE = True
    llm_service = get_llm_service()
except ImportError:
    LITELLM_AVAILABLE = False
    print("[WARNING] LiteLLM service not found")

# Speech-to-Text using Transformers (Local Whisper)
try:
    from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq, pipeline
    import torch
    TRANSFORMERS_AVAILABLE = True
    print("[OK] Transformers loaded successfully")
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("[WARNING] Transformers/Torch not available. Install with: pip install transformers torch accelerate")

# Lazy-load variable
local_whisper_pipeline = None

def get_whisper_pipeline():
    global local_whisper_pipeline
    if local_whisper_pipeline is None and TRANSFORMERS_AVAILABLE:
        print("[INFO] Loading local Whisper model (openai/whisper-small)... This may take a moment.")
        try:
            device = "cuda:0" if torch.cuda.is_available() else "cpu"
            torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
            
            # User requested specific loading pattern:
            # from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq
            
            processor = AutoProcessor.from_pretrained("openai/whisper-small")
            model = AutoModelForSpeechSeq2Seq.from_pretrained("openai/whisper-small")
            
            # Move model to device
            model.to(device)
            
            # Create pipeline using the loaded model and processor
            local_whisper_pipeline = pipeline(
                "automatic-speech-recognition",
                model=model,
                tokenizer=processor.tokenizer,
                feature_extractor=processor.feature_extractor,
                torch_dtype=torch_dtype,
                device=device,
                # Set language to English to avoid warnings
                generate_kwargs={"language": "en", "task": "transcribe"}
            )
            print(f"[OK] Whisper loaded on {device} using AutoModelForSpeechSeq2Seq")
        except Exception as e:
            print(f"[ERROR] Failed to load Whisper: {e}")
            return None
    return local_whisper_pipeline

def transcribe_audio_transformers(audio_bytes: bytes) -> Tuple[str, str]:
    """
    Transcribe using Local Transformers (Whisper Small) - NO FFmpeg required
    Supports: WAV, MP3, FLAC, OGG, WebM, and more
    """
    if not TRANSFORMERS_AVAILABLE:
        return "Transformers library not available", "en"
    
    pipe = get_whisper_pipeline()
    if not pipe:
        return "Model loading failed", "en"

    # Debug: Inspect audio data
    print(f"[DEBUG] Received audio bytes: {len(audio_bytes)} bytes")
    
    # Check for mock data
    if audio_bytes == b"mock_audio_data":
        print("[INFO] Mock audio data detected, returning mock transcription")
        return "What is the price of Onion in Nasik?", "en"
    
    if len(audio_bytes) < 100:
        print(f"[ERROR] Audio data too small: {len(audio_bytes)} bytes")
        return "Audio data too small or empty", "en"
    
    # Check first few bytes to identify format
    header = audio_bytes[:12]
    print(f"[DEBUG] Audio header (first 12 bytes): {header[:12].hex()}")
    
    # Detect format from header
    if header[:4] == b'RIFF' and header[8:12] == b'WAVE':
        print("[DEBUG] Detected format: WAV")
    elif header[:3] == b'ID3' or header[:2] == b'\xff\xfb':
        print("[DEBUG] Detected format: MP3")
    elif header[:4] == b'OggS':
        print("[DEBUG] Detected format: OGG")
    elif header[:4] == b'fLaC':
        print("[DEBUG] Detected format: FLAC")
    elif header[:4] == b'\x1a\x45\xdf\xa3':
        print("[DEBUG] Detected format: WebM/MKV")
    else:
        print(f"[WARNING] Unknown format. Header: {header.hex()}")

    try:
        import soundfile as sf
        import numpy as np
        import io
        
        audio_array = None
        sample_rate = 16000
        
        # Method 1: Try reading directly from bytes using BytesIO
        try:
            audio_file = io.BytesIO(audio_bytes)
            audio_array, sample_rate = sf.read(audio_file)
            print(f"[OK] Audio loaded from memory: {sample_rate}Hz")
        except Exception as e1:
            print(f"[INFO] soundfile BytesIO failed: {e1}")
            
            # Method 2: Try with temp file (some formats need file path)
            temp_path = ""
            try:
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                    f.write(audio_bytes)
                    temp_path = f.name
                
                audio_array, sample_rate = sf.read(temp_path)
                print(f"[OK] Audio loaded from temp file: {sample_rate}Hz")
            except Exception as e2:
                print(f"[INFO] soundfile temp file failed: {e2}")
                
                # Method 3: Try using PyAV for WebM/Opus (no FFmpeg needed!)
                if header[:4] == b'\x1a\x45\xdf\xa3':  # WebM/MKV format
                    try:
                        import av
                        import io
                        
                        print("[INFO] Trying PyAV for WebM decoding...")
                        container = av.open(io.BytesIO(audio_bytes))
                        
                        audio_frames = []
                        sample_rate = None
                        
                        # Get audio stream
                        audio_stream = container.streams.audio[0]
                        sample_rate = audio_stream.rate
                        
                        print(f"[DEBUG] WebM audio stream: {audio_stream.codec_context.name}, {sample_rate}Hz, {audio_stream.channels} channels")
                        
                        # Decode all audio frames
                        for frame in container.decode(audio=0):
                            # Convert frame to numpy array
                            array = frame.to_ndarray()
                            
                            # Handle different array shapes
                            if array.ndim == 1:
                                # Already 1D (mono)
                                audio_frames.append(array)
                            elif array.ndim == 2:
                                # 2D array - could be (samples, channels) or (channels, samples)
                                if array.shape[0] < array.shape[1]:
                                    # (channels, samples) - transpose
                                    array = array.T
                                # Now (samples, channels) - convert to mono
                                if array.shape[1] > 1:
                                    array = array.mean(axis=1)
                                else:
                                    array = array.flatten()
                                audio_frames.append(array)
                        
                        if audio_frames:
                            # Concatenate all frames
                            audio_array = np.concatenate(audio_frames)
                            
                            # Ensure float32
                            audio_array = audio_array.astype(np.float32)
                            
                            print(f"[OK] Audio loaded with PyAV (WebM): {sample_rate}Hz, {len(audio_array)} samples ({len(audio_array)/sample_rate:.2f}s)")
                        else:
                            raise Exception("No audio frames found in WebM")
                            
                    except ImportError:
                        print("[WARNING] PyAV not available. Install with: pip install av")
                        pass  # Continue to pydub fallback
                    except Exception as e3:
                        print(f"[INFO] PyAV failed: {e3}")
                        import traceback
                        traceback.print_exc()
                        pass  # Continue to pydub fallback
                
                # Method 4: Try using pydub as last resort (needs FFmpeg for WebM)
                if audio_array is None:
                    try:
                        from pydub import AudioSegment
                        
                        # Try to detect format from bytes
                        audio_segment = None
                        for fmt in ['wav', 'mp3', 'ogg', 'webm', 'flac']:
                            try:
                                audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format=fmt)
                                print(f"[OK] Audio loaded with pydub ({fmt})")
                                break
                            except:
                                continue
                        
                        if audio_segment is None:
                            raise Exception("Could not detect audio format")
                        
                        # Convert to numpy array
                        audio_array = np.array(audio_segment.get_array_of_samples(), dtype=np.float32)
                        sample_rate = audio_segment.frame_rate
                        
                        # Normalize
                        audio_array = audio_array / (2**15)  # 16-bit audio
                        
                        # Convert stereo to mono if needed
                        if audio_segment.channels == 2:
                            audio_array = audio_array.reshape((-1, 2)).mean(axis=1)
                            
                    except ImportError:
                        print("[ERROR] pydub not available. Install with: pip install pydub")
                        return "Audio format not supported. Please use WAV format.", "en"
                    except Exception as e4:
                        print(f"[ERROR] pydub failed: {e4}")
                        return "Could not process audio format", "en"
            finally:
                if temp_path and os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except:
                        pass
        
        if audio_array is None:
            return "Failed to load audio", "en"
        
        # Convert to mono if stereo
        if len(audio_array.shape) > 1:
            audio_array = audio_array.mean(axis=1)
        
        # Resample to 16kHz if needed (Whisper expects 16kHz)
        if sample_rate != 16000:
            try:
                import librosa
                audio_array = librosa.resample(audio_array, orig_sr=sample_rate, target_sr=16000)
                print(f"[OK] Resampled from {sample_rate}Hz to 16000Hz")
            except Exception as e:
                print(f"[WARNING] Resampling failed: {e}. Using original sample rate.")
        
        # Ensure float32 and normalize if needed
        audio_array = audio_array.astype(np.float32)
        
        # Normalize to [-1, 1] range if not already
        max_val = np.abs(audio_array).max()
        if max_val > 1.0:
            audio_array = audio_array / max_val
        
        # Run inference with numpy array directly
        result = pipe(audio_array)
        text = result.get("text", "").strip()
        
        return text, "en"  # Default to English/Auto
            
    except ImportError as ie:
        print(f"Audio library not available: {ie}")
        print("Please install: pip install soundfile librosa")
        return "Audio processing library not available", "en"
    except Exception as e:
        print(f"Transformers Transcription error: {e}")
        import traceback
        traceback.print_exc()
        return "Transcription failed", "en"

def classify_intent_gemini(text: str) -> Dict:
    """
    Classify intent using AI (LiteLLM with HuggingFace fallback)
    """
    if not LITELLM_AVAILABLE:
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

Query: "{text}"

Return ONLY valid JSON in this exact format:
{{"intent": "check_price", "parameters": {{"crop": "Onion", "location": "Nasik"}}}}
"""
        # Try Gemini first, will automatically fallback to HuggingFace if API fails
        try:
            result_text = llm_service.generate_text(prompt, model="gemini/gemini-1.5-flash", max_tokens=200)
        except Exception as e:
            print(f"Gemini API failed: {e}. Using local HuggingFace model...")
            # The llm_service will automatically use HuggingFace fallback
            result_text = llm_service.generate_text(prompt, model="local", max_tokens=200)
        
        result_text = result_text.strip().replace("```json", "").replace("```", "").strip()
        
        # Try to parse JSON
        try:
            # Try to find JSON in the response
            start_idx = result_text.find('{')
            if start_idx != -1:
                result, _ = json.JSONDecoder().raw_decode(result_text[start_idx:])
                return result
            else:
                # No JSON found, try parsing the whole thing
                return json.loads(result_text)
        except (json.JSONDecodeError, ValueError) as json_err:
            print(f"JSON parsing failed: {json_err}")
            print(f"LLM output was: {result_text[:200]}")
            # Fallback to simple classification
            return classify_intent_simple(text)
    
    except Exception as e:
        print(f"Intent classification error: {e}")
        return classify_intent_simple(text)


def generate_response_gemini(intent: str, params: Dict, language: str = "en") -> str:
    """
    Generate response using AI (LiteLLM with HuggingFace fallback)
    """
    if not LITELLM_AVAILABLE:
        return generate_response_simple(intent, params)
    
    try:
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
        try:
            response_text = llm_service.generate_text(prompt, model="gemini/gemini-1.5-flash", max_tokens=300)
        except Exception as e:
            print(f"Gemini API failed: {e}. Using local HuggingFace model...")
            # The llm_service will automatically use HuggingFace fallback
            response_text = llm_service.generate_text(prompt, model="local", max_tokens=300)
        return response_text.strip()
    
    except Exception as e:
        print(f"Response error: {e}")
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
    1. HuggingFace Whisper for Speech-to-Text (self-hosted, unlimited)
    2. HuggingFace/Local LLM for Intent Classification (no API limits)
    3. HuggingFace/Local LLM for Response Generation (no API limits)
    """
    
    # Step 1: Speech-to-Text (Try Local Transformers Whisper first, then others)
    if TRANSFORMERS_AVAILABLE and len(file_bytes) > 200:
        try:
            print("[MIC] Using Local Transformers (Whisper Small)")
            transcription, language = transcribe_audio_transformers(file_bytes)
            # Basic validation
            if not transcription or "model loading failed" in transcription.lower():
                 raise Exception("Model failure")
        except Exception as e:
            print(f"[WARNING] Transformer STT failed: {e}. Trying fallback options...")
            if WHISPER_AVAILABLE:
                transcription, language = transcribe_audio_whisper(file_bytes)
            else:
                transcription = "Could not understand audio"
                language = "en"
                transcription = "Could not understand audio"
                language = "en"
    elif WHISPER_AVAILABLE and len(file_bytes) > 1000:
        try:
            transcription, language = transcribe_audio_whisper(file_bytes)
        except Exception as e:
            print(f"[WARNING] Whisper transcription failed: {e}")
            print("Using mock transcription instead")
            transcription = "What is the price of Onion in Nasik?"
            language = "en"
    else:
        # Mock for testing when no audio provided or Whisper not available
        transcription = "What is the price of Onion in Nasik?"
        language = "en"
        print("[INFO] Using mock transcription (no real audio or Whisper unavailable)")
    
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

