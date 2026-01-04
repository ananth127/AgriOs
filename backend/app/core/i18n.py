from fastapi import Header
from typing import Optional
from app.common.enums import LanguageCode
from app.common.constants import DEFAULT_LANGUAGE

def get_language(accept_language: Optional[str] = Header(None)) -> str:
    """
    Parses the Accept-Language header to determine the preferred language.
    Returns the language code (e.g., 'en', 'hi') or default.
    """
    if not accept_language:
        return DEFAULT_LANGUAGE
    
    # Simple extraction logic (first preferred language)
    # In production, use a library to parse q-factors
    lang = accept_language.split(",")[0].strip().split("-")[0]
    
    # Validate against supported enum
    if lang in [l.value for l in LanguageCode]:
        return lang
        
    return DEFAULT_LANGUAGE
