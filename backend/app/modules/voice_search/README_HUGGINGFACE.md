# Voice Search with Hugging Face Models

## Overview
This module has been updated to use **Hugging Face Transformers** for both speech-to-text (Whisper) and text generation (Flan-T5), eliminating the dependency on external APIs like Gemini that require authentication.

## Architecture

### 1. Speech-to-Text (Whisper)
- **Primary**: Hugging Face Transformers with `openai/whisper-small`
- **Fallback**: OpenAI Whisper (if installed separately)
- **Mock**: Test data when no audio is provided

### 2. Intent Classification & Response Generation
- **Primary**: Gemini API (if API key is valid)
- **Fallback 1**: Hugging Face Flan-T5 Small (local, no API needed)
- **Fallback 2**: Ollama local models (if running)
- **Fallback 3**: Simple template-based responses

## Installation

### 1. Install Dependencies

```bash
# Activate your virtual environment
venv\Scripts\activate

# Install the required packages
pip install transformers>=4.30.0 torch>=2.0.0 accelerate>=0.20.0
```

### 2. First Run - Model Download
The first time you run the service, it will automatically download:
- **Whisper Small** (~500MB) - for speech-to-text
- **Flan-T5 Small** (~300MB) - for text generation

These models are cached locally and won't be downloaded again.

## How It Works

### Flow Diagram
```
Audio Input
    ↓
[Hugging Face Whisper] → Transcription
    ↓
[Hugging Face Flan-T5 / Gemini] → Intent Classification
    ↓
[Hugging Face Flan-T5 / Gemini] → Response Generation
    ↓
JSON Response
```

### Fallback Chain

#### For LLM Operations (Intent & Response):
1. **Try Gemini API** (if GEMINI_API_KEY is set and valid)
2. **Fallback to Hugging Face Flan-T5** (local, always available)
3. **Fallback to Ollama** (if running locally)
4. **Fallback to Templates** (simple rule-based responses)

#### For Speech-to-Text:
1. **Try Hugging Face Whisper** (primary)
2. **Fallback to OpenAI Whisper** (if installed)
3. **Use Mock Data** (for testing)

## Configuration

### Environment Variables (.env)
```env
# Optional - if you have a valid Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - if you want to use OpenAI
OPENAI_API_KEY=your_openai_key_here
```

**Note**: If no API keys are provided, the system will automatically use local Hugging Face models.

## Models Used

### Whisper Small
- **Model**: `openai/whisper-small`
- **Size**: ~500MB
- **Purpose**: Speech-to-text transcription
- **Languages**: Multilingual (90+ languages)
- **Accuracy**: Good balance of speed and accuracy

### Flan-T5 Small
- **Model**: `google/flan-t5-small`
- **Size**: ~300MB
- **Purpose**: Text generation (intent classification & responses)
- **Languages**: Primarily English, but can handle some multilingual tasks
- **Accuracy**: Good for structured tasks like intent classification

## API Response Format

```json
{
  "transcription": "What is the price of Onion in Nasik?",
  "detected_language": "en",
  "intent": "check_price",
  "parameters": {
    "crop": "Onion",
    "location": "Nasik"
  },
  "response_text": "The price of Onion in Nasik is trending at 45 rupees per kg. Prices are stable this week."
}
```

## Performance Considerations

### CPU vs GPU
- **GPU**: Models will run significantly faster (5-10x)
- **CPU**: Models will work but may be slower (2-5 seconds per request)

### Memory Requirements
- **Minimum**: 2GB RAM
- **Recommended**: 4GB+ RAM
- **With GPU**: 2GB+ VRAM

### Optimization Tips
1. **Keep models loaded**: Models are lazy-loaded and cached in memory
2. **Use GPU if available**: Set `CUDA_VISIBLE_DEVICES=0` to use GPU
3. **Reduce model size**: Switch to `whisper-tiny` or `flan-t5-base` if needed

## Troubleshooting

### Issue: "Transformers not available"
**Solution**: Install transformers
```bash
pip install transformers torch accelerate
```

### Issue: "Model loading failed"
**Solution**: Check internet connection (for first download) or disk space
```bash
# Check cache location
python -c "from transformers import TRANSFORMERS_CACHE; print(TRANSFORMERS_CACHE)"

# Clear cache if needed
rm -rf ~/.cache/huggingface/
```

### Issue: "Out of memory"
**Solution**: Use smaller models
```python
# In llm_service.py, change:
model_name = "google/flan-t5-base"  # to
model_name = "google/flan-t5-small"  # or even
model_name = "google/flan-t5-tiny"
```

### Issue: Slow inference
**Solution**: 
1. Check if GPU is being used: `torch.cuda.is_available()`
2. Reduce max_tokens in prompts
3. Use quantized models (future enhancement)

## Testing

### Test with Mock Audio
```bash
# Start the server
uvicorn app.main:app --reload

# Send a request (will use mock transcription)
curl -X POST http://localhost:8000/api/v1/voice-search/query \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@test_audio.wav"
```

### Test with Real Audio
Record a `.wav` file and send it to the endpoint.

## Future Enhancements

1. **Model Quantization**: Reduce model size by 4x using INT8 quantization
2. **Streaming**: Support real-time streaming transcription
3. **Fine-tuning**: Fine-tune models on agricultural domain data
4. **Multilingual**: Better support for Indian languages
5. **Caching**: Cache common queries to reduce inference time

## License
- **Whisper**: MIT License (OpenAI)
- **Flan-T5**: Apache 2.0 License (Google)
- **Transformers**: Apache 2.0 License (Hugging Face)
