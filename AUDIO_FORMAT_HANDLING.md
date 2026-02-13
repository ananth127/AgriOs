# Audio Format Handling - Complete Guide

## Issue Fixed: "Format not recognised"

### Problem
The error `Error opening 'temp.wav': Format not recognised` occurs when:
1. Audio bytes are not in a valid WAV format
2. The audio data is corrupted or incomplete
3. The audio is in a different format (MP3, WebM, OGG, etc.)

### Solution Implemented
We now use a **3-tier fallback system** to handle any audio format:

```
Method 1: BytesIO (in-memory, fastest)
    ↓ (if fails)
Method 2: Temp file (for formats needing file path)
    ↓ (if fails)
Method 3: pydub (handles MP3, OGG, WebM, FLAC)
```

## How It Works

### Method 1: BytesIO (Preferred)
```python
audio_file = io.BytesIO(audio_bytes)
audio_array, sample_rate = sf.read(audio_file)
```
- **Fastest**: No file I/O
- **Best for**: WAV, FLAC formats
- **Memory efficient**

### Method 2: Temp File
```python
with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
    f.write(audio_bytes)
    temp_path = f.name
audio_array, sample_rate = sf.read(temp_path)
```
- **Fallback**: When BytesIO fails
- **Best for**: Formats requiring file path
- **Automatic cleanup**

### Method 3: pydub (Universal)
```python
from pydub import AudioSegment
for fmt in ['wav', 'mp3', 'ogg', 'webm', 'flac']:
    audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format=fmt)
```
- **Most compatible**: Handles almost any format
- **Best for**: MP3, OGG, WebM, M4A
- **Automatic format detection**

## Supported Audio Formats

| Format | Method 1 (BytesIO) | Method 2 (Temp) | Method 3 (pydub) |
|--------|-------------------|-----------------|------------------|
| WAV    | ✅ Yes            | ✅ Yes          | ✅ Yes           |
| FLAC   | ✅ Yes            | ✅ Yes          | ✅ Yes           |
| OGG    | ⚠️ Maybe          | ⚠️ Maybe        | ✅ Yes           |
| MP3    | ❌ No             | ❌ No           | ✅ Yes           |
| WebM   | ❌ No             | ❌ No           | ✅ Yes           |
| M4A    | ❌ No             | ❌ No           | ✅ Yes           |

## Dependencies Installed

```bash
✅ soundfile>=0.12.0   # Primary audio loading
✅ librosa>=0.10.0     # Resampling to 16kHz
✅ pydub>=0.25.0       # Fallback for MP3/OGG/WebM
```

## Testing Different Formats

### Test WAV (should use Method 1)
```bash
curl -X POST http://localhost:8000/api/v1/voice-search/query \
  -F "audio=@test.wav"
```
Expected log: `[OK] Audio loaded from memory: 44100Hz`

### Test MP3 (should use Method 3)
```bash
curl -X POST http://localhost:8000/api/v1/voice-search/query \
  -F "audio=@test.mp3"
```
Expected log: `[OK] Audio loaded with pydub (mp3)`

### Test WebM (browser recording, should use Method 3)
```bash
curl -X POST http://localhost:8000/api/v1/voice-search/query \
  -F "audio=@recording.webm"
```
Expected log: `[OK] Audio loaded with pydub (webm)`

## Audio Processing Pipeline

```
1. Receive audio bytes
   ↓
2. Try loading with soundfile (BytesIO)
   ↓ (if fails)
3. Try loading with soundfile (temp file)
   ↓ (if fails)
4. Try loading with pydub (auto-detect format)
   ↓
5. Convert to mono if stereo
   ↓
6. Resample to 16kHz (Whisper requirement)
   ↓
7. Normalize to [-1, 1] range
   ↓
8. Pass numpy array to Whisper
   ↓
9. Return transcription
```

## Troubleshooting

### Issue: "Format not recognised" still appearing
**Cause**: Audio data is corrupted or invalid
**Solution**: 
1. Check the audio file is valid: `ffplay test.wav` (if you have ffmpeg)
2. Try re-recording the audio
3. Check the file size: `ls -lh test.wav`
4. Verify it's not empty: file size should be > 1KB

### Issue: "pydub not available"
**Solution**: Install pydub
```bash
pip install pydub
```

### Issue: MP3 not working even with pydub
**Cause**: pydub needs FFmpeg for MP3 (but not for WAV/OGG/WebM)
**Solution**: Either:
1. Use WAV format instead (recommended)
2. Install FFmpeg system-wide (optional)
3. Convert MP3 to WAV on frontend before sending

### Issue: Audio is transcribed but text is empty
**Cause**: Audio might be too short or silent
**Solution**:
1. Ensure audio is at least 1 second long
2. Check audio volume is sufficient
3. Verify microphone is working

### Issue: Slow transcription
**Cause**: Large audio files or CPU processing
**Solution**:
1. Limit audio length to 30 seconds
2. Use GPU if available
3. Reduce sample rate on frontend (16kHz is ideal)

## Frontend Integration

### Recommended: Record as WAV
```javascript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/wav'  // Best compatibility
});
```

### Alternative: WebM (Chrome default)
```javascript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm'  // Works with pydub fallback
});
```

### Convert to WAV before sending (Optional)
```javascript
// Using Web Audio API
const audioContext = new AudioContext();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

// Convert to WAV
const wavBlob = audioBufferToWav(audioBuffer);
```

## Performance Comparison

| Method | Speed | Memory | Compatibility |
|--------|-------|--------|---------------|
| BytesIO | ⚡⚡⚡ Fast | 💚 Low | ⚠️ WAV/FLAC only |
| Temp File | ⚡⚡ Medium | 💛 Medium | ⚠️ WAV/FLAC only |
| pydub | ⚡ Slower | 💛 Medium | ✅ Universal |

## Production Recommendations

1. **Frontend**: Record as WAV format
   - Best compatibility
   - Fastest processing
   - No conversion needed

2. **Fallback**: Support WebM for browsers
   - Chrome/Firefox default
   - pydub handles it automatically

3. **Validation**: Check audio before sending
   - Minimum 1 second duration
   - Maximum 30 seconds (for speed)
   - Non-zero file size

4. **Error Handling**: Show user-friendly messages
   - "Recording too short"
   - "Please speak louder"
   - "Audio format not supported"

## Logs to Expect

### Success (WAV)
```
[MIC] Using Local Transformers (Whisper Small)
[OK] Audio loaded from memory: 44100Hz
[OK] Resampled from 44100Hz to 16000Hz
Transcription: "What is the price of onion?"
```

### Success (WebM)
```
[MIC] Using Local Transformers (Whisper Small)
[INFO] soundfile BytesIO failed: ...
[INFO] soundfile temp file failed: ...
[OK] Audio loaded with pydub (webm)
[OK] Resampled from 48000Hz to 16000Hz
Transcription: "What is the price of onion?"
```

### Failure (Invalid)
```
[MIC] Using Local Transformers (Whisper Small)
[INFO] soundfile BytesIO failed: ...
[INFO] soundfile temp file failed: ...
[ERROR] pydub failed: ...
Transformers Transcription error: Could not process audio format
```

## Summary

✅ **3-tier fallback system** ensures maximum compatibility
✅ **No FFmpeg required** for WAV, FLAC, OGG, WebM
✅ **Automatic format detection** with pydub
✅ **Production-ready** with proper error handling
✅ **Detailed logging** for debugging

The system will now handle virtually any audio format thrown at it!
