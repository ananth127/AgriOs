# WebM Audio Extraction Fix

## Issue Found

PyAV was only extracting **18 samples** from the WebM file (< 0.001 seconds), when it should have extracted several seconds of audio.

### Root Cause
The `frame.to_ndarray()` method returns arrays in different shapes depending on the codec:
- Some codecs: `(channels, samples)` 
- Other codecs: `(samples, channels)`
- Mono codecs: `(samples,)`

The original code wasn't handling these different formats correctly.

## Fix Applied

### Before:
```python
for frame in container.decode(audio=0):
    audio_frames.append(frame.to_ndarray())  # ❌ Wrong shape handling

audio_array = np.concatenate(audio_frames)
audio_array = audio_array.flatten()  # ❌ Loses data
```

### After:
```python
for frame in container.decode(audio=0):
    array = frame.to_ndarray()
    
    if array.ndim == 1:
        # Mono - use as is
        audio_frames.append(array)
    elif array.ndim == 2:
        # Stereo - handle both (channels, samples) and (samples, channels)
        if array.shape[0] < array.shape[1]:
            array = array.T  # Transpose if needed
        # Convert to mono
        if array.shape[1] > 1:
            array = array.mean(axis=1)
        else:
            array = array.flatten()
        audio_frames.append(array)

audio_array = np.concatenate(audio_frames)
```

## Expected Logs After Fix

### Before (Wrong):
```
[OK] Audio loaded with PyAV (WebM): 48000Hz, 18 samples
```

### After (Correct):
```
[DEBUG] WebM audio stream: opus, 48000Hz, 1 channels
[OK] Audio loaded with PyAV (WebM): 48000Hz, 240000 samples (5.00s)
```

## What to Look For

After restarting the backend, you should see:

1. **Codec information**:
   ```
   [DEBUG] WebM audio stream: opus, 48000Hz, 1 channels
   ```

2. **Correct sample count** (should be `sample_rate * duration`):
   ```
   For 5 seconds at 48kHz: ~240,000 samples
   For 3 seconds at 48kHz: ~144,000 samples
   ```

3. **Duration in seconds**:
   ```
   [OK] Audio loaded with PyAV (WebM): 48000Hz, 240000 samples (5.00s)
   ```

4. **Successful transcription**:
   ```
   Transcription: "your actual spoken words"
   ```

## Testing

### Quick Test
1. Restart backend
2. Record 3-5 seconds of audio from frontend
3. Check logs for sample count

**Expected**: ~144,000 - 240,000 samples (not 18!)

### Verify Audio Duration
```python
# In the logs, check:
samples / sample_rate = duration

# Example:
240000 / 48000 = 5.0 seconds ✅
18 / 48000 = 0.000375 seconds ❌
```

## Troubleshooting

### If still getting low sample count:
1. Check the debug log for codec and channels
2. Share the full traceback if PyAV fails
3. Try recording longer audio (5+ seconds)

### If PyAV fails completely:
The logs will now show a full traceback:
```
[INFO] PyAV failed: <error>
Traceback (most recent call last):
  ...
```

Share this traceback for further debugging.

## Next Steps

1. **Restart the backend** to load the fix
2. **Test voice search** with 3-5 seconds of audio
3. **Check the logs** for:
   - Sample count (should be > 100,000 for 3+ seconds)
   - Duration in seconds
   - Successful transcription

The fix ensures all audio frames are properly extracted and concatenated! 🎉
