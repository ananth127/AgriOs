# Diagnosis Module

**Module**: `app.modules.diagnosis`

## Purpose
Provides plant disease diagnosis capabilities using Computer Vision and AI. It analyzes images of crops to identify diseases, assess severity, and recommend treatments.

## Key Services
- **`service.py`**:
  - `perform_diagnosis(image_path)`: Orchestrates the diagnosis pipeline.
  - **Vision Pipeline**:
    1.  **HuggingFace Hybrid**: Primary vision model.
    2.  **LiteLLM (Gemini Vision)**: Fallback robust general purposed vision model.
    3.  **Mock**: Developer fallback for testing without API keys.

## Integration
- Uses `KnowledgeGraphService` to fetch treatment recommendations based on detected disease names.

## Configuration
- `LITELLM_AVAILABLE`: Controls availability of Gemini/GPT-4 fallback.
- `HUGGINGFACE_API_KEY`: Required for primary vision service.
