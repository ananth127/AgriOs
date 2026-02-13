# Core Module

**Module**: `app.core`

## Purpose
Contains foundational services and utilities used across the entire application.

## Key Components

### 1. LLM Service (`llm_service.py`)
- **Role**: Unified interface for interacting with LLM providers (OpenAI, Gemini, Ollama, HuggingFace).
- **Library**: Wraps `litellm` to provide consistent `completion` and `generate_text` methods.
- **Failover**: Handles API key management and provider switching efficiently.

### 2. HuggingFace Service (`huggingface_service.py`)
- **Role**: Specialized interface for HuggingFace Inference API.
- **Features**: Text generation, Image Classification (Vision), and specialized agricultural model usage.
- **Integration**: Uses `llm_service` for some text generation tasks as a fallback.

### 3. Database (`database.py`)
- **Role**: SQLModel/SQLAlchemy database connection management (PostgreSQL).

### 4. Config (`config.py`)
- **Role**: Application-wide settings and environment variable loading.
