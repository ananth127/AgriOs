from fastapi import APIRouter, File, UploadFile
from . import service, schemas

router = APIRouter()

@router.post("/query", response_model=schemas.VoiceQueryResponse)
def voice_search(file: UploadFile = File(...)):
    # Read file content
    # In real app, save to temp file or pass bytes to OpenAI
    # content = await file.read()
    return service.process_audio(b"mock_audio_bytes")
