import os
import google.generativeai as genai

def test_gemini():
    print("🧪 Testing Gemini AI Connection (gemini-2.0-flash)...")
    
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
        # Using gemini-2.0-flash
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content("Say 'Hello Agri-OS' if you can hear me.")
        print(f"✅ Success! Response: {response.text}")
    except Exception as e:
        print(f"❌ Gemini Error: {e}")

if __name__ == "__main__":
    test_gemini()
