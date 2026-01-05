// Use environment variable or fallback to localhost
// For Android access, set NEXT_PUBLIC_API_URL to your computer's IP
// Example: http://192.168.1.100:8000/api/v1
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
