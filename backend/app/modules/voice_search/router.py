from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel
import base64
from . import service, schemas

router = APIRouter()


class VoiceQueryRequest(BaseModel):
    audio_data: str  # Base64 encoded audio or placeholder


@router.post("/query", response_model=schemas.VoiceQueryResponse)
async def voice_search(request: VoiceQueryRequest):
    """
    Voice search endpoint - accepts audio data and returns transcription + response
    Uses FREE AI: Whisper (speech-to-text) + Gemini (NLU + response generation)
    
    Request body:
        {
            "audio_data": "base64_encoded_audio_string"
        }
    """
    # For now, accept base64 or placeholder string
    # In production, decode base64 to bytes
    try:
        # Try to decode base64
        if request.audio_data and len(request.audio_data) > 100:
            audio_bytes = base64.b64decode(request.audio_data)
        else:
            # Mock data for testing
            audio_bytes = b"mock_audio_data"
    except Exception:
        # If decoding fails, use mock data
        audio_bytes = b"mock_audio_data"
    
    # Process with free AI services
    return service.process_audio(audio_bytes)
