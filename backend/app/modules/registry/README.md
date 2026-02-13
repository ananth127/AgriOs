# Registry Module

**Module**: `app.modules.registry`

## Purpose
Manages the central catalog of agricultural entities, primarily focused on **Crop Profiles**. It handles the retrieval, creation, and AI-assisted generation of detailed crop information.

## Key Services
- **`service.py`**:
  - `search_or_create_crop(crop_name)`: Strategies to get crop data.
    1.  **DB Check**: Look in local database.
    2.  **HuggingFace**: Use `huggingface_service` for specialized crop data generation.
    3.  **LiteLLM (Gemini/OpenAI)**: Fallback to general-purpose LLM to generate JSON crop profile.

- **`models.py`**: Defines the `CropRegistry` schema.

## Dependencies
- `app.core.llm_service`: For AI-generated crop profiles.
- `app.core.huggingface_service`: For specialized data.
