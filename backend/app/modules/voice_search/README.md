# Voice Search Module

**Module**: `app.modules.voice_search`

## Purpose
Handles voice-based interactions for the AgriOS platform, enabling farmers to query information (market prices, weather) using speech.

## Key Services
- **`service.py`** (Primary): Uses `litellm` (Vertex AI/Gemini) for high-quality intent classification and response generation. Supports complex queries.
- **`service_free.py`** (Fallback): Uses free-tier/local alternatives like Whisper (OpenAI) and basic keyword matching for offline or low-cost scenarios.

## Dependencies
- `litellm`: Interface to LLM providers.
- `google-cloud-speech` (Optional): For cloud-based STT.
- `whisper` (Optional): For local STT.

## Configuration
- `LITELLM_AVAILABLE`: Feature flag to enable LLM processing.
- `WHISPER_AVAILABLE`: Feature flag for local speech model.
