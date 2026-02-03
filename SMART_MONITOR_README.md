# Smart Monitor - Full Stack Implementation

## Overview
The Smart Monitor is now fully functional with real-time data from the IoT backend. It aggregates monitoring feeds from Livestock, Crops, Machinery, and Labor into a centralized command center.

## Backend Changes

### 1. IoT Device Model Enhancement (`backend/app/modules/iot/models.py`)
Added two new fields to the `IoTDevice` model:
- `status`: VARCHAR field for device status (ACTIVE, ALERT, WARNING, IDLE, RUNNING)
- `last_telemetry`: JSON field for storing current sensor readings and metadata

### 2. IoT Schema Update (`backend/app/modules/iot/schemas.py`)
Updated `IoTDeviceResponse` to include:
- `status`: Optional[str]
- `last_telemetry`: Optional[Dict[str, Any]]

### 3. Database Migration & Seeding (`backend/seed_iot_devices.py`)
Created a comprehensive seed script that:
- Adds the new columns to existing `iot_devices` table
- Seeds 11 diverse demo devices across 4 categories:
  - **Livestock** (3 devices): Cameras and feed dispensers
  - **Crops** (3 devices): Soil moisture, climate control, light sensors
  - **Machinery** (3 devices): Tractor, drone, harvester
  - **Labor** (2 devices): Team trackers

Each device includes realistic telemetry data like battery levels, signal strength, current values, and alerts.

## Frontend Changes

### 1. API Client Update (`frontend/src/lib/api.ts`)
Updated the `iot` section to use the real IoT endpoints:
```typescript
iot: {
    getDevices: () => fetchAPI("/iot/devices"),
    getDevice: (id: number) => fetchAPI(`/iot/devices/${id}`),
    registerDevice: (data: any) => fetchAPI("/iot/devices", "POST", data),
    sendCommand: (deviceId: number, command: any) => fetchAPI(`/iot/devices/${deviceId}/command`, "POST", command),
    getCommands: (deviceId: number) => fetchAPI(`/iot/devices/${deviceId}/commands`),
}
```

### 2. Smart Monitor Page (`frontend/src/app/[locale]/smart-monitor/page.tsx`)
Completely refactored to use real data:
- Removed all mock data generators
- Fetches devices from `/iot/devices` endpoint
- Transforms API response to match UI requirements
- Auto-refreshes every 10 seconds
- Supports deep linking via query parameters (`?type=LIVESTOCK&id=1`)
- Implements smart spotlight rotation (Alerts → Running → Active → Idle)

### 3. Livestock Integration
Updated `LivestockMainDashboard.tsx` to redirect to Smart Monitor:
- Removed modal-based Smart Shelter Dashboard
- "Smart Monitor" button now navigates to `/smart-monitor?type=LIVESTOCK&id={housingId}`
- Cleaner separation of concerns

## Features

### Real-Time Monitoring
- Fetches live data from backend every 10 seconds
- Displays device status, telemetry, and alerts
- Visual indicators for online/offline status

### Smart Prioritization
The spotlight automatically prioritizes:
1. **Alerts** (Critical issues requiring attention)
2. **Running/Active** (Currently operating devices)
3. **Idle** (Standby devices)

### Multi-Category Support
Filters by asset type:
- ALL (shows everything)
- LIVESTOCK
- CROP
- MACHINERY
- LABOR

### Rich Telemetry Display
Each device can show:
- Battery level
- Signal strength
- Current readings (temperature, moisture, etc.)
- Activity status
- Video feeds (for cameras)
- Operator information (for machinery)
- Alert messages

## How to Use

### 1. Seed the Database
```bash
cd backend
python seed_iot_devices.py
```

### 2. Access Smart Monitor
Navigate to: `http://localhost:3000/en/smart-monitor`

### 3. From Livestock Page
Click "Smart Monitor" button on any housing card to jump directly to that device.

## Data Structure

### Device Telemetry Format
```json
{
  "battery": 85,
  "signal": 5,
  "value": "45%",
  "videoUrl": "https://...",
  "alert": "High Humidity",
  "activity": "Plowing Field C",
  "operator": "Ramesh K.",
  "fuel": 65,
  "speed": "12 km/h"
}
```

The UI automatically adapts to display whatever telemetry fields are present.

## Next Steps

### Potential Enhancements
1. **Real Device Integration**: Connect actual IoT hardware via MQTT/SMS
2. **Historical Analytics**: Add charts showing telemetry trends over time
3. **Alert Management**: Implement alert acknowledgment and resolution workflows
4. **Command Center**: Add ability to send commands to devices from the UI
5. **Notifications**: Push notifications for critical alerts
6. **Custom Dashboards**: Allow users to create custom monitoring layouts
7. **Export Reports**: Generate PDF/CSV reports of device activity

## Technical Notes

- Uses PostgreSQL JSON column for flexible telemetry storage
- Type-safe TypeScript interfaces throughout
- Responsive design works on mobile and desktop
- Framer Motion for smooth transitions
- Auto-refresh prevents stale data
- Error handling with graceful fallbacks
