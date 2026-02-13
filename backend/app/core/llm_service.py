# DOCUMENTATION_SOURCE: README.md
import os
import litellm

from typing import Optional, Dict, Any, List, Union
from .config import settings

# Configure litellm
# litellm.set_verbose = True # Uncomment for debugging

# Hugging Face Transformers for local LLM
try:
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
    import torch
    HF_AVAILABLE = True
    print("[OK] Hugging Face Transformers available")
except ImportError:
    HF_AVAILABLE = False
    print("[WARNING] Hugging Face Transformers not available. Install with: pip install transformers torch accelerate")

# Lazy-load HF model
_hf_pipeline = None

def get_hf_pipeline():
    """
    Load Hugging Face model for text generation (Flan-T5 Small - lightweight and effective)
    """
    global _hf_pipeline
    if _hf_pipeline is None and HF_AVAILABLE:
        try:
            print("[INFO] Loading Hugging Face model (google/flan-t5-small)... This may take a moment.")
            device = "cuda:0" if torch.cuda.is_available() else "cpu"
            
            # Using Flan-T5 Small - good balance of size and capability
            model_name = "google/flan-t5-small"
            
            # Flan-T5 is a seq2seq model, load it directly instead of using pipeline
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            model.to(device)
            
            # Store both tokenizer and model
            _hf_pipeline = {
                "tokenizer": tokenizer,
                "model": model,
                "device": device
            }
            print(f"[OK] Flan-T5 loaded on {device}")
        except Exception as e:
            print(f"[ERROR] Failed to load HF model: {e}")
            return None
    return _hf_pipeline

class LLMService:
    """
    Unified LLM Service using LiteLLM with Hugging Face fallback.
    Supports OpenAI, Azure, Anthropic, Gemini, HuggingFace, Ollama, etc.
    Falls back to local Hugging Face models when API calls fail.
    """
    
    def __init__(self):
        # Set API keys from settings/env
        if settings.OPENAI_API_KEY:
            os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
        
        if settings.GEMINI_API_KEY:
            os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
            
        if settings.VERTEX_API_KEY:
            os.environ["VERTEX_API_KEY"] = settings.VERTEX_API_KEY
            # Also set as GOOGLE_API_KEY as fallback for some libs
            if not os.environ.get("GOOGLE_API_KEY"):
                os.environ["GOOGLE_API_KEY"] = settings.VERTEX_API_KEY
            
        # Add other keys as needed
        
    def completion(
        self, 
        model: str, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7, 
        max_tokens: int = 1000,
        **kwargs
    ) -> Any:
        try:
            response = litellm.completion(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            return response
        except Exception as e:
            print(f"Error calling LLM ({model}): {str(e)}")
            
            # Try Hugging Face local model first (no API needed)
            if HF_AVAILABLE:
                try:
                    print(f"Attempting fallback to local Hugging Face model")
                    return self._hf_completion(messages, temperature, max_tokens)
                except Exception as hf_error:
                    print(f"Hugging Face fallback failed: {hf_error}")
            
            # Fallback to local Ollama
            fallback_model = "ollama/gemma3:1b"
            if model != fallback_model:
                try:
                    print(f"Attempting fallback to local Ollama: {fallback_model}")
                    response = litellm.completion(
                        model=fallback_model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        **kwargs
                    )
                    return response
                except Exception as fallback_error:
                    print(f"Fallback to {fallback_model} also failed: {fallback_error}")
                    # Raise the original error to show what went wrong initially
                    raise e
            else:
                raise e

    def _hf_completion(self, messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> Any:
        """
        Use Hugging Face model for completion (local inference)
        """
        hf_model = get_hf_pipeline()
        if not hf_model:
            raise Exception("HF pipeline not available")
        
        # Convert messages to single prompt
        prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
        
        # Tokenize and generate
        tokenizer = hf_model["tokenizer"]
        model = hf_model["model"]
        device = hf_model["device"]
        
        inputs = tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True).to(device)
        
        # Generate response
        outputs = model.generate(
            **inputs,
            max_length=max_tokens,
            temperature=temperature,
            do_sample=True,
            top_p=0.95,
            num_return_sequences=1
        )
        
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Mock LiteLLM response structure
        class MockChoice:
            def __init__(self, text):
                self.message = type('obj', (object,), {'content': text})()
        
        class MockResponse:
            def __init__(self, text):
                self.choices = [MockChoice(text)]
        
        return MockResponse(response_text)

    def generate_text(self, prompt: str, model: str = "gpt-3.5-turbo", **kwargs) -> str:
        """
        Simple text generation helper with Hugging Face fallback.
        """
        # Try API models first
        try:
            messages = [{"role": "user", "content": prompt}]
            response = self.completion(model=model, messages=messages, **kwargs)
            return response.choices[0].message.content
        except Exception as e:
            print(f"API generation failed: {e}")
            
            # Fallback to local HF model
            if HF_AVAILABLE:
                try:
                    print("Using local Hugging Face model for text generation")
                    hf_model = get_hf_pipeline()
                    if hf_model:
                        tokenizer = hf_model["tokenizer"]
                        model_obj = hf_model["model"]
                        device = hf_model["device"]
                        
                        inputs = tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True).to(device)
                        outputs = model_obj.generate(
                            **inputs,
                            max_length=kwargs.get('max_tokens', 512),
                            do_sample=True,
                            temperature=0.7,
                            top_p=0.95
                        )
                        return tokenizer.decode(outputs[0], skip_special_tokens=True)
                except Exception as hf_error:
                    print(f"HF generation failed: {hf_error}")
            
            # If all fails, raise original error
            raise e

    def embedding(self, model: str, input: Union[str, List[str]], **kwargs) -> Any:
        """
        Generate embeddings.
        """
        try:
            response = litellm.embedding(
                model=model,
                input=input,
                **kwargs
            )
            return response
        except Exception as e:
             print(f"Error generating embedding ({model}): {str(e)}")
             raise e

# specific providers for easier access
# You can customize defaults here

def get_llm_service() -> LLMService:
    return LLMService()
