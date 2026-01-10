# How to Activate Gemini AI in Agri-OS

You mentioned you have a **Gemini 3 Pro Subscription**. It is important to know that **consumer subscriptions (Gemini Advanced)** are different from **Developer API Access**.

## 1. The Difference
*   **Gemini Advanced (Your Subscription):** This is for you to chat with Gemini on the website (`gemini.google.com`). It does **not** give you an API key for coding.
*   **Gemini API (For Developers):** This is what Agri-OS needs to "talk" to Google's servers. You need a specific **API Key** from Google AI Studio.

Agri-OS acts like a robot that sends messages to Google. It needs its own "Passport" (API Key), independent of your personal Google account.

## 2. How to Get a Working Key (Free)
Since your previous key was blocked ("leaked"), you need a new one.

1.  Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2.  Click **"Create API Key"**.
3.  Select a Google Cloud project (or create a new one).
4.  Copy the key (it starts with `AIza...`).

## 3. How to Connect it to Agri-OS
The app doesn't use "Sign in with Google" to access the AI. It uses the key stored in the backend configuration.

1.  Open the file `backend/.env`.
2.  Find the line:
    ```env
    GEMINI_API_KEY=AIzaSy...
    ```
3.  **Replace** the old key with your **NEW** key.
4.  Save the file.

## 4. Using "Gemini 3 Pro"
Access to specific models like `gemini-3-pro-preview` depends on Google's rollout to developers.
*   We have already configured the code to request `gemini-3-pro-preview`.
*   **If you have access via your API Key**, it will work immediately after you update the `.env` file.
*   If not, we can switch back to `gemini-2.0-flash` (which is extremely fast and free).

**Action Required:**
Please update `backend/.env` with a new API Key.
