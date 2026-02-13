import os
import google.generativeai as genai

def list_models():
    print("📋 Listing Available Models...")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        try:
            with open("backend/.env", "r") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        api_key = line.strip().split("=")[1]
                        break
        except:
            pass

    if not api_key:
        print("❌ Could not find API Key")
        return

    try:
        genai.configure(api_key=api_key)
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"✅ Found Model: {m.name}")
    except Exception as e:
        print(f"❌ Error listing models: {e}")

if __name__ == "__main__":
    list_models()
