from pydantic import BaseModel
from typing import Optional, Dict

class VoiceQueryResponse(BaseModel):
    transcription: str
    detected_language: str
    intent: str # e.g., "check_price", "weather", "unknown"
    parameters: Dict[str, str] # e.g. {"crop": "onion", "location": "nasik"}
    response_text: str # Text to be spoken back
