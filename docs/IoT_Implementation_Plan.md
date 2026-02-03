# Agri-OS IoT Implementation Plan (Offline-First)

## 1. Project Overview
**Goal**: Build a proprietary IoT controller system for farm automation (valves, motors) that functions reliably in offline environments using a "User -> SMS -> Server -> IoT" architecture.
**Core Philosophy**: The Server is the "Brain". Users sends requests (Online or SMS) to the Server. The Server commands the IoT device.

---

## 2. Hardware Strategy (Proprietary "Agri-Controller")
To replace Mobitech/Third-party controllers with our own technology.

### **Bill of Materials (Estimate per Unit)**
| Component | Function | Approx Cost |
|-----------|----------|-------------|
| **ESP32 WROOM** | Core Microcontroller (WiFi + BT) | $4.00 |
| **SIM800L / A7670C** | GSM/GPRS Module (4G Preferred) | $12.00 |
| **Relay Module (4-Ch)** | Controls Solenoid Valves (12V/24V) | $5.00 |
| **Buck Converter** | Steps down 12V Battery/Solar to 5V | $2.00 |
| **IP65 Enclosure** | Waterproof casing for field use | $10.00 |
| **PCB & Connectors** | Custom board + terminal blocks | $8.00 |
| **Total BOM** | **~$41.00 USD** |

### **Firmware Logic (C++/Arduino)**
1.  **Heartbeat**: Sends status every 5 mins via MQTT (Online) or SMS (Offline fallback).
2.  **Command Mode**: Listens for MQTT logs `agri/device/{id}/cmd`.
3.  **SMS Fallback**: If checking HTTP/MQTT fails, read SMS buffer for signed commands *from the Server only*.

---

## 3. Backend Architecture (The "Brain")

### **3.1 Database Schema (PostgreSQL)**

**Table: `iot_devices`**
- `id` (UUID): Primary Key
- `user_id`: Owner
- `name`: "North Field Valve"
- `hardware_id`: "ESP32_MAC_ADDR"
- `phone_number`: SIM number of the device
- `secret_key`: Shared secret for HMAC signing
- `is_online`: Boolean
- `last_heartbeat`: Timestamp

**Table: `iot_commands`**
- `id` (UUID)
- `device_id`: FK
- `user_id`: FK
- `command`: "VALVE_OPEN", "VALVE_CLOSE"
- `payload`: `{"valve_index": 1, "duration": 60}`
- `status`: "PENDING", "SENT_MQTT", "SENT_SMS", "EXECUTED", "FAILED"
- `source`: "WEB", "MOBILE_APP", "SMS_GATEWAY"
- `executed_at`: Timestamp

### **3.2 API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/devices` | List user devices + status |
| `POST` | `/api/v1/devices` | Register new device |
| `POST` | `/api/v1/devices/{id}/command` | Send command (Online) |
| `POST` | `/api/v1/webhooks/sms` | **CRITICAL**: Receive User SMS via Gateway |

### **3.3 The "Offline Engine" (Logic)**
This is the middleware that handles the `User -> SMS -> Server` flow.

1.  **Ingest**: Webhook receives `{ from: "+91...", body: "AGRI OPEN V1..." }`.
2.  **Authenticate**:
    *   Find User by `from` phone number.
    *   Find Device by `F{id}` in body.
    *   **Verify Signature**: `HMAC_SHA256(body_params, user_secret)`.
    *   **Verify Timestamp**: Reject if `abs(now - timestamp) > 5 mins`.
3.  **Process**:
    *   If Valid: Create `iot_command` entry (Status: PENDING).
    *   Send **ACK SMS** to User: "Command Accepted. Processing...".
4.  **Execute**:
    *   Check Device Status in DB.
    *   **If Online**: Publish MQTT message `{"action": "OPEN", "valve": 1}`.
    *   **If Offline**: Send SMS to **Device Internal SIM**: `SERVER_CMD OPEN V1 <ServerSignature>`.

---

## 4. Frontend Requirements (AgriOs Web/Mobile)

### **4.1 New Pages**
1.  **`/devices` (Dashboard)**
    *   Card grid of all devices.
    *   Live Status indicators (Online/Offline/Signal Strength).
    *   "Quick Toggle" buttons for valves.

2.  **`/devices/[id]` (Device Detail)**
    *   **Visual Representation**: Graphic of the controller.
    *   **Manual Control**: Toggle switches.
    *   **Scheduler**: "Run daily at 6:00 AM for 30 mins".
    *   **Logs**: History of all commands and sensor readings.

3.  **`/devices/offline-tools` (The "SMS Generator")**
    *   *For uses with spotty internet but valid Web access (e.g. at home).*
    *   User selects action: "Open Valve 1".
    *   UI generates the **Secure String**: `AGRI OPEN V1 F123 T... X...`.
    *   "Copy to Clipboard" or "Open SMS App" button.

### **4.2 Functions to Implement**
-   `generateSecureSMSString(action, deviceId, secret)`: JS util to create the hashed string.
-   `useDeviceStatus(deviceId)`: Hook to poll or listen for websocket updates.
-   `CommandHistoryList`: Component to show the "Pending -> Success" state.

---

## 5. Development Phases (Task List)

### **Phase 1: Foundation (Backend)**
- [ ] Create `iot_devices` and `iot_commands` tables.
- [ ] Implement `DeviceRegistryService` (CRUD for devices).
- [ ] Implement `CommandProcessorService` (Logic to route CMDs via MQTT or SMS).
- [ ] Set up basic MQTT Broker (Mosquitto) or Cloud IoT Core.

### **Phase 2: The SMS Gateway (Security Core)**
- [ ] Integrate Twilio/Msg91/Local Gateway for **Sending** and **Receiving**.
- [ ] Build `POST /webhooks/sms` endpoint.
- [ ] Implement `RequestValidator` (Timestamp + HMAC Check).
- [ ] Implement `UserResponseSystem` (Send SMS reply to user).

### **Phase 3: Frontend Integration**
- [ ] Build `/devices` page with Tailwind UI.
- [ ] Build `/devices/[id]` with real-time state (SWR/React Query).
- [ ] Create `OfflineSMSGenerator` component.

### **Phase 4: Hardware Prototype (Optional)**
- [ ] Flash ESP32 with `AgriFirmware_v1`.
- [ ] Test Server -> Device communication.
