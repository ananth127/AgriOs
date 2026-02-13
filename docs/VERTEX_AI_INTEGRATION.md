# Vertex AI Integration Guide

## Overview

Agri-OS now uses **Vertex AI** for all AI-powered features:

1. ✅ **Crop Encyclopedia** - AI-generated crop profiles
2. ✅ **Disease Diagnosis** - Image analysis for plant diseases  
3. ✅ **Voice Recognition** - Multilingual speech-to-text
4. ✅ **Voice Assistant** - Intent classification and responses

---

## Setup for Local Development

### 1. Install Dependencies

```bash
pip install google-cloud-aiplatform google-cloud-speech
```

### 2. Configure `.env` File

Add these variables to `backend/.env`:

```env
# Vertex AI Configuration
GOOGLE_CLOUD_PROJECT=agri-os
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=vertex-key.json
```

### 3. Create Service Account Key

Run from your project root:

```bash
# Already done if you followed previous steps
# File: vertex-key.json should exist in project root
```

### 4. Test

```bash
python backend/main.py
```

Then try:
- **Crop Search**: Search for "Dragon Fruit" in Library
- **Diagnosis**: Upload a plant image
- **Voice**: Use the microphone icon

---

## Features Using Vertex AI

### 🌾 Crop Encyclopedia (`registry/service.py`)
- **Model**: `gemini-1.5-flash` (text generation)
- **Fallback**: Gemini API (if configured)
- **Input**: Crop name (text)
- **Output**: JSON with growing requirements, stages, etc.

### 🔬 Disease Diagnosis (`diagnosis/service.py`)
- **Model**: `gemini-1.5-flash` (vision)
- **Fallback**: Mock diagnosis
- **Input**: Image URL
- **Output**: Disease name, confidence, treatment

### 🎤 Voice Recognition (`voice_search/service.py`)
- **Model**: Google Cloud Speech-to-Text
- **Fallback**: Whisper (local)
- **Input**: Audio bytes
- **Output**: Transcribed text + language

### 💬 Voice Intent & Response (`voice_search/service.py`)
- **Model**: `gemini-1.5-pro-preview-0409`
- **Input**: Transcribed text
- **Output**: Intent classification + natural language response

---

## Deployment to Render.com

### Environment Variables

Set these in Render.com dashboard:

```
GOOGLE_CLOUD_PROJECT=agri-os
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS_JSON=<paste entire vertex-key.json content>
DATABASE_URL=<your postgres url>
```

### How It Works

The code automatically detects:
- **Local**: Uses `GOOGLE_APPLICATION_CREDENTIALS` (file path)
- **Render.com**: Uses `GOOGLE_APPLICATION_CREDENTIALS_JSON` (raw JSON)

---

## Fallback Strategy

Each AI feature has a graceful fallback:

```
Vertex AI Gemini Vision → Mock Diagnosis
Vertex AI Speech → Whisper (local) → Mock Transcription
Vertex AI Text → Gemini API → Simple Rules
```

This ensures the app works even if:
- Vertex AI credentials are missing
- Quota is exceeded
- Network issues occur

---

## Cost Optimization

### Free Tier Limits (as of 2026)
- **Gemini Pro**: 60 requests/minute
- **Speech-to-Text**: 60 minutes/month free
- **Vision**: Included in Gemini requests

### Best Practices
1. Use **Gemini API** for development (easier setup)
2. Switch to **Vertex AI** for production (better quota)
3. Enable **fallbacks** to prevent service downtime

---

## Troubleshooting

### "Unable to find your project"
- Ensure `GOOGLE_CLOUD_PROJECT` is set correctly
- Run `gcloud config get-value project` to verify

### "Permission denied"
- Verify service account has `roles/aiplatform.user`
- Check: https://console.cloud.google.com/iam-admin/iam

### "Model not found"
- Some models are region-specific
-Try changing `GOOGLE_CLOUD_LOCATION` to `us-central1`

---

## Security

- ✅ `vertex-key.json` is in `.gitignore`
- ✅ Never commit credentials to Git
- ✅ Use Render.com's environment variable encryption
