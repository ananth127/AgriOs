# Agri-OS User Manual

Welcome to **Agri-OS**, the comprehensive Operating System for modern agriculture. This manual guides you through the features deployed in your environment.

## 1. System Overview
Agri-OS is designed for three key personas:
- **Farmers**: Manage crops, diagnose diseases, and track finances.
- **Workers**: Log attendance and harvest data.
- **Retailers/Partners**: Manage supply chains and loans.

---

## 2. Getting Started
### Launch the Application
1. **Windows**: Double-click `start_dev.bat` in the project root.
   - This opens two windows: one for the Backend (`localhost:8000`) and one for the Frontend (`localhost:3000`).
2. **Access Dashboard**: Open `http://localhost:3000` in your browser.
3. **Login**: Use the demo credentials (or Sign Up):
   - **Email**: `farmer@agrios.com`
   - **Password**: `demo123`

---

## 3. Key Features Guide

### 🌱 3.1. Crop Doctor (AI Diagnosis)
*   **Purpose**: Identify crop diseases instantly using AI.
*   **How to use**:
    1.  Navigate to **Crop Doctor** from the Dashboard.
    2.  Click **Upload Image** or **Take Photo**.
    3.  Select an image of the affected plant.
    4.  Select the **Crop Name** (e.g., Potato, Tomato).
    5.  Click **Analyze**.
*   **Results**:
    - You will see the detected **Disease Name** and **Confidence Score**.
    - **Drift Monitoring**: If confidence is low (<85%), an orange warning will appear, flagging it for expert review.
    - **Recommendations**: View organic and chemical treatment options instantly.
*   **Offline Mode**: If you lose internet, the app switches to "Offline Edge AI" simulation, providing an estimate and queuing the data for sync.

### 🚜 3.2. Farm Operations (ERP)
*   **Machinery**:
    - Go to **Farm Management > Machinery**.
    - View your tractor fleet, engine hours, and fuel levels (simulated ISOBUS data).
*   **Labor**:
    - Go to **Farm Management > Labor**.
    - Track worker attendance and "Piece-Rate" harvest logs (kg picked per worker).
*   **Inventory**:
    - Go to **Farm Management > Inventory**.
    - Monitor stock levels of seeds, fertilizers, and fuel (FIFO batch tracking).

### 🌦️ 3.3. Weather & Advisory
*   **Forecast**: Real-time 5-day weather forecast on the Dashboard.
*   **Disease Alerts**: The system automatically flags risks (e.g., "High likelihood of Late Blight due to 3 days of high humidity").

### 💼 3.4. Finances & Loans
*   **Wallet**: View your closed-loop wallet balance for purchasing inputs.
*   **Credit Score**: Check your alternative credit score based on satellite data (NDVI) and behavior.

---

## 4. Technical Architecture (For Developers)
*   **Frontend**: Next.js 14 (App Router), TailwindCSS, WatermelonDB (Offline Sync).
*   **Backend**: FastAPI (Python), PostgreSQL, SQLAlchemy.
*   **AI/ML**: Hybrid approach (Hugging Face / Gemini + TFLite fallback).
*   **Sync**: Custom "Pull/Push" replication protocol for offline-first support.

## 5. Troubleshooting
*   **"Table already defined" error**: This was resolved by separating `WorkerHarvestLog` (Labor) and `CropHarvestLog` (Farm Mgmt).
*   **Sync Failed**: Check if the backend is running at generic `localhost:8000`. Ensure `start_dev.bat` didn't report port conflicts.

---

**Need Help?** Contact the Agri-OS Support Team or open an issue on the repository.
