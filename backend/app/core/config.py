from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Agri-OS"
    API_V1_STR: str = "/api/v1"
    
    # Database URL (PostgreSQL)
    # Must be set via environment variable or .env.enc
    # e.g., postgresql://user:pass@host:5432/db
    DATABASE_URL: str
    
    # Development mode flag
    # DEV=true  → Development (encrypted .env.enc)
    # DEV=false → Production (plain .env)
    DEV: bool = False
    
    # Voice Search - Gemini API
    GEMINI_API_KEY: Optional[str] = None
    
    # Optional: OpenAI API (if using paid services)
    OPENAI_API_KEY: Optional[str] = None
    
    # Google Cloud TTS (optional)
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    
    # Environment password for .env decryption
    ENV_PASSWORD: Optional[str] = None

    # JWT Authentication
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7" # Change in production!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    class Config:
        case_sensitive = True
        # No env_file needed - loaded directly into os.environ by load_env.py
        extra = "allow"  # Allow extra environment variables

settings = Settings()
