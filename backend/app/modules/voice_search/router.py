from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User
import base64
from . import service, schemas

router = APIRouter()


class VoiceQueryRequest(BaseModel):
    audio_data: str  # Base64 encoded audio or placeholder


@router.post("/query", response_model=schemas.VoiceQueryResponse)
async def voice_search(request: VoiceQueryRequest, current_user: User = Depends(get_current_user)):
    """
    Voice search endpoint - accepts audio data and returns transcription + response
    Uses FREE AI: Whisper (speech-to-text) + Gemini (NLU + response generation)
    """
    try:
        if request.audio_data and len(request.audio_data) > 100:
            audio_bytes = base64.b64decode(request.audio_data)
        else:
            audio_bytes = b"mock_audio_data"
    except Exception:
        audio_bytes = b"mock_audio_data"

    return service.process_audio(audio_bytes)
