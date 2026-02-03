# IoT UI Structure & Page Guide

This document defines the structure for the new "Device Management" section of the AgriOS application.

## 1. Page Hierarchy

```
/src/app/[locale]/devices/
├── page.tsx                  # "My Devices" Dashboard (Grid View)
├── layout.tsx                # Layout wrapper (Sidebar active state)
├── new/
│   └── page.tsx              # "Add New Device" Wizard
├── [deviceId]/
│   ├── page.tsx              # Main Control Dashboard (Toggle Center)
│   ├── settings/
│   │   └── page.tsx          # Device Config (Name, SIM No, Secret)
│   ├── logs/
│   │   └── page.tsx          # Command History & Sensor Graphs
│   └── offline/
│       └── page.tsx          # "Offline Emergency Mode" (SMS Generator)
```

---

## 2. Page Specifications

### **A. My Devices (Dashboard)**
**Path**: `/devices`
**Layout**:
-   **Header**: "Farm Controllers", "Add Device (+)" button.
-   **Content**: Responsive Grid (1 col mobile, 3 col desktop).

**Components**:
-   `DeviceSummaryCard`:
    -   Top: Icon + Name + "Online/Offline" Badge.
    -   Middle: "Last Active: 2 mins ago".
    -   Bottom: "Active Valves: 0/4".
    -   Action: Click to navigate to `[deviceId]`.

### **B. Device Control Center**
**Path**: `/devices/[deviceId]`
**Layout**:
-   **Header**: Device Name + Status Dot + Signal Strength (SignalIcon).
-   **Tabs**: Controls | Schedule | Settings.

**Key Widgets**:
1.  **Valve Array**:
    -   Visual representation of the 4 valves.
    -   Large Toggle Switch for each.
    -   Status Text: "Valve 1: OPEN (Running for 15m)".
2.  **Sensor Readings** (If applicable):
    -   "Soil Moisture: 45%"
    -   "Battery: 12.4V"
3.  **Recent Activity**:
    -   Simple list of last 5 actions.

### **C. Offline "Emergency" Tools**
**Path**: `/devices/[deviceId]/offline`
**Purpose**: When internet is weak, help user generate the SMS command manually.

**UI Flow**:
1.  **Action Selector**: Dropdown ("Turn On", "Turn Off").
2.  **Target Selector**: Radio Button ("Valve 1", "Valve 2"...).
3.  **Parameter**: Input ("Duration in Minutes").
4.  **Generation Area**:
    -   Display huge text box: `AGRI V1 ON 30 X92J2`
    -   Button: `Copy to Clipboard`
    -   Button: `Send via SMS App` (`sms:server_number?body=AGRI...`)

---

## 3. Styling Guidelines (Tailwind)

-   **"Active" State**: `bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.6)]`
-   **"Inactive" State**: `bg-slate-200 dark:bg-slate-800 text-slate-500`
-   **"Emergency/Offline" Mode**: Use `amber` or `orange` accents to denote this is a fallback method.
-   **Cards**: `glass-card` class (from global.css).

## 4. Component Library Additions

**New Components Needed**:
-   `src/components/iot/ValveSwitch.tsx` (Animated toggle)
-   `src/components/iot/SignalIndicator.tsx` (5-bar mobile style)
-   `src/components/iot/OfflineCommandBuilder.tsx` (The SMS logic)
