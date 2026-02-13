# Agri-OS: Hugging Face Integration Summary

## Changes Made

### 1. **Requirements Updated** (`backend/requirements.txt`)
Added Hugging Face transformers stack:
```
transformers>=4.30.0
torch>=2.0.0
accelerate>=0.20.0
```

### 2. **LLM Service Enhanced** (`backend/app/core/llm_service.py`)
- Added Hugging Face Transformers support as primary fallback
- Uses `google/flan-t5-small` for text generation
- Automatic fallback chain: Gemini API → Hugging Face → Ollama → Error
- No API key required when using local models

### 3. **Voice Search Service Updated** (`backend/app/modules/voice_search/service.py`)
- Already configured to use `openai/whisper-small` for speech-to-text
- Updated to use new LLM fallback system
- Better error handling and logging
- Comments updated to reflect Hugging Face usage

### 4. **Start Script Updated** (`start.bat`)
- Now creates and activates Python virtual environment automatically
- Checks for venv existence, creates if missing
- Installs dependencies within venv
- Runs backend server with venv activated

## How to Use

### First Time Setup
1. Run `start.bat` - it will automatically:
   - Create virtual environment (`backend/venv`)
   - Install all dependencies including transformers
   - Start both backend and frontend servers

### Subsequent Runs
1. Simply run `start.bat`
2. It will activate the existing venv and start servers

### Manual Setup (Alternative)
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Model Downloads (First Run Only)

When you first use the voice search feature, the following models will be downloaded automatically:

1. **Whisper Small** (~500MB)
   - Location: `~/.cache/huggingface/hub/`
   - Purpose: Speech-to-text transcription

2. **Flan-T5 Small** (~300MB)
   - Location: `~/.cache/huggingface/hub/`
   - Purpose: Intent classification & response generation

**Note**: These are one-time downloads. Models are cached locally.

## API Key Configuration (Optional)

### If you have a valid Gemini API key:
1. Edit `backend/.env`
2. Add: `GEMINI_API_KEY=your_valid_key_here`
3. The system will try Gemini first, then fallback to Hugging Face

### If you don't have API keys:
- No problem! The system will automatically use local Hugging Face models
- No external API calls, completely offline capable

## Testing the Integration

### Test Voice Search Endpoint
```bash
# Start the server
start.bat

# In a new terminal, test the endpoint
curl -X POST http://localhost:8000/api/v1/voice-search/query \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@test_audio.wav"
```

### Expected Response
```json
{
  "transcription": "What is the price of Onion in Nasik?",
  "detected_language": "en",
  "intent": "check_price",
  "parameters": {
    "crop": "Onion",
    "location": "Nasik"
  },
  "response_text": "The price of Onion in Nasik is trending at 45 rupees per kg..."
}
```

## Troubleshooting

### Issue: "API key not valid" errors still appearing
**Cause**: Gemini API key is invalid or missing
**Solution**: The system will automatically fallback to Hugging Face. You can:
1. Remove/comment out `GEMINI_API_KEY` in `.env` to skip Gemini entirely
2. Or just ignore the error - fallback will work automatically

### Issue: Models downloading slowly
**Cause**: Large model files being downloaded
**Solution**: 
- Be patient on first run (500MB + 300MB)
- Ensure stable internet connection
- Models are cached after first download

### Issue: Out of memory
**Cause**: Not enough RAM for models
**Solution**: 
- Close other applications
- Use smaller models (edit `llm_service.py` to use `flan-t5-tiny`)
- Ensure at least 2GB free RAM

### Issue: Slow inference
**Cause**: Running on CPU instead of GPU
**Solution**:
- Check GPU availability: `python -c "import torch; print(torch.cuda.is_available())"`
- Install CUDA-enabled PyTorch if you have NVIDIA GPU
- CPU inference is slower but still functional

## Performance Expectations

### With GPU (NVIDIA):
- Whisper transcription: ~1-2 seconds
- Intent classification: ~0.5 seconds
- Response generation: ~0.5 seconds
- **Total**: ~2-3 seconds per request

### With CPU:
- Whisper transcription: ~3-5 seconds
- Intent classification: ~1-2 seconds
- Response generation: ~1-2 seconds
- **Total**: ~5-9 seconds per request

## Benefits of This Approach

✅ **No API Costs**: Completely free, no usage limits
✅ **Offline Capable**: Works without internet (after initial model download)
✅ **Privacy**: All processing happens locally
✅ **Reliability**: No dependency on external API availability
✅ **Fallback Chain**: Multiple fallback options ensure service continuity

## Next Steps

1. **Test the voice search feature** to ensure everything works
2. **Monitor performance** and adjust model sizes if needed
3. **Consider GPU setup** for better performance
4. **Fine-tune models** on agricultural domain data (future enhancement)

## Documentation

- **Detailed Guide**: `backend/app/modules/voice_search/README_HUGGINGFACE.md`
- **LLM Service**: `backend/app/core/llm_service.py`
- **Voice Service**: `backend/app/modules/voice_search/service.py`

## Support

If you encounter any issues:
1. Check the console logs for detailed error messages
2. Verify venv is activated: `which python` should show `backend/venv/Scripts/python`
3. Ensure all dependencies are installed: `pip list | grep transformers`
4. Check model cache: `ls ~/.cache/huggingface/hub/`
