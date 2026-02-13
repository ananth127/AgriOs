# Voice Search Audio Debugging Guide

## Current Issue Analysis

Based on the logs, the audio data being sent is **not valid audio**. All three loading methods failed:

```
[INFO] soundfile BytesIO failed: Format not recognised
[INFO] soundfile temp file failed: Format not recognised  
[ERROR] pydub failed: Could not detect audio format
```

This means the audio bytes are either:
1. **Mock data** (b"mock_audio_data")
2. **Corrupted** during transmission
3. **Empty** or too small
4. **Wrong format** (not actually audio)

## New Debugging Added

I've added comprehensive logging to help diagnose the issue:

### Router Level (what's received):
```python
[ROUTER] Received audio_data length: X chars
[ROUTER] Decoded audio: Y bytes
```

### Service Level (what's being processed):
```python
[DEBUG] Received audio bytes: Y bytes
[DEBUG] Audio header (first 12 bytes): 52494646...
[DEBUG] Detected format: WAV
```

## What to Check

### 1. Check the Frontend

Look at your browser console or frontend code to see:
- Is audio actually being recorded?
- Is it being converted to base64?
- What's the size of the audio data?

**Example frontend code should look like:**
```javascript
// Record audio
const mediaRecorder = new MediaRecorder(stream);
const chunks = [];

mediaRecorder.ondataavailable = (e) => {
  chunks.push(e.data);
};

mediaRecorder.onstop = async () => {
  const blob = new Blob(chunks, { type: 'audio/wav' });
  const reader = new FileReader();
  
  reader.onloadend = () => {
    const base64 = reader.result.split(',')[1]; // Remove data:audio/wav;base64,
    console.log('Audio base64 length:', base64.length); // Should be > 1000
    
    // Send to backend
    fetch('/api/v1/voice-search/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_data: base64 })
    });
  };
  
  reader.readAsDataURL(blob);
};
```

### 2. Check Backend Logs

After the new changes, you should see:

**If receiving real audio:**
```
[ROUTER] Received audio_data length: 50000 chars
[ROUTER] Decoded audio: 37500 bytes
[DEBUG] Received audio bytes: 37500 bytes
[DEBUG] Audio header (first 12 bytes): 52494646...
[DEBUG] Detected format: WAV
[OK] Audio loaded from memory: 44100Hz
```

**If receiving mock data:**
```
[ROUTER] No valid audio data, using mock
[DEBUG] Received audio bytes: 15 bytes
[INFO] Mock audio data detected, returning mock transcription
```

**If receiving invalid data:**
```
[ROUTER] Received audio_data length: 100 chars
[ROUTER] Decoded audio: 75 bytes
[DEBUG] Received audio bytes: 75 bytes
[ERROR] Audio data too small: 75 bytes
```

## Common Audio Format Headers

| Format | Header (Hex) | Header (ASCII) |
|--------|--------------|----------------|
| WAV    | `52 49 46 46 ... 57 41 56 45` | `RIFF....WAVE` |
| MP3    | `49 44 33` or `FF FB` | `ID3` or `ÿû` |
| OGG    | `4F 67 67 53` | `OggS` |
| FLAC   | `66 4C 61 43` | `fLaC` |
| WebM   | `1A 45 DF A3` | (binary) |

## Testing Steps

### Step 1: Test with Mock Data (Should Work Now)
```bash
curl -X POST http://localhost:8000/api/v1/voice-search/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"audio_data": "mock"}'
```

Expected response:
```json
{
  "transcription": "What is the price of Onion in Nasik?",
  "detected_language": "en",
  "intent": "check_price",
  ...
}
```

### Step 2: Test with Real WAV File
```bash
# Convert audio to base64
base64_audio=$(base64 -w 0 test.wav)

# Send to API
curl -X POST http://localhost:8000/api/v1/voice-search/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"audio_data\": \"$base64_audio\"}"
```

### Step 3: Check What Frontend is Sending

Add this to your browser console:
```javascript
// Intercept fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args);
  if (args[0].includes('voice-search')) {
    const body = JSON.parse(args[1].body);
    console.log('Audio data length:', body.audio_data?.length);
    console.log('Audio data preview:', body.audio_data?.substring(0, 100));
  }
  return originalFetch.apply(this, args);
};
```

## Expected Behavior After Fix

### Scenario 1: Real Audio (WAV)
```
[ROUTER] Received audio_data length: 50000 chars
[ROUTER] Decoded audio: 37500 bytes
[DEBUG] Received audio bytes: 37500 bytes
[DEBUG] Audio header: 52494646...
[DEBUG] Detected format: WAV
[OK] Audio loaded from memory: 44100Hz
[OK] Resampled from 44100Hz to 16000Hz
Transcription: "actual spoken words"
```

### Scenario 2: Mock Data
```
[ROUTER] No valid audio data, using mock
[DEBUG] Received audio bytes: 15 bytes
[INFO] Mock audio data detected, returning mock transcription
Transcription: "What is the price of Onion in Nasik?"
```

### Scenario 3: Invalid/Corrupted Data
```
[ROUTER] Received audio_data length: 200 chars
[ROUTER] Decoded audio: 150 bytes
[DEBUG] Received audio bytes: 150 bytes
[WARNING] Unknown format. Header: 48656c6c6f...
[INFO] soundfile BytesIO failed: Format not recognised
[INFO] soundfile temp file failed: Format not recognised
[ERROR] pydub failed: Could not detect audio format
```

## Troubleshooting

### Issue: "No valid audio data, using mock"
**Cause**: Frontend is not sending audio or sending empty string
**Solution**: Check frontend audio recording code

### Issue: "Audio data too small"
**Cause**: Audio recording is too short or corrupted
**Solution**: 
- Record for at least 1 second
- Check microphone permissions
- Verify MediaRecorder is working

### Issue: "Unknown format" with weird header
**Cause**: Data is not audio (maybe text, JSON, or corrupted)
**Solution**:
- Check base64 encoding is correct
- Verify blob type is audio/*
- Check for data corruption during transmission

### Issue: All 3 methods fail with "Format not recognised"
**Cause**: The data is valid base64 but not valid audio
**Solution**:
- Save the decoded bytes to a file and try to play it
- Check if frontend is sending the right MIME type
- Verify the audio blob is created correctly

## Next Steps

1. **Restart the backend** to load the new debugging code
2. **Test the voice search** from the frontend
3. **Check the console logs** for the new debug output
4. **Share the logs** showing:
   - `[ROUTER]` lines
   - `[DEBUG]` lines
   - Any error messages

This will help us identify exactly what's being sent and why it's not being recognized as audio!
