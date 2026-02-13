---
description: How to Add or Sync IoT Devices (Valves, Pumps, Sensors)
---

# Adding and Syncing IoT Devices in Agri-OS

You can connect physical farm hardware (Smart Valves, Pumps, Sensors) to Agri-OS to enable remote monitoring and control. There are two ways to do this:

## Method 1: Scan QR Code (Fastest)
Best for new installations where the device has a visible QR sticker.

1. Navigate to **Farm Management** > **IoT Control**.
2. Click the **Scan QR** button in the Valve Control section.
3. Allow camera access if prompted.
4. Point your camera at the device's QR code.
5. The system will detect the device ID and prompt you to name it (e.g., "North Sector Valve").
6. **Done!** The device is now synced and will appear in your control panel.

## Method 2: Manual Entry
Best for existing devices or if the QR code is damaged.

1. Navigate to **Farm Management** > **Machinery**.
2. Click **+ Add Asset**.
3. Fill in the details:
   - **Name**: e.g. "Main Borewell Pump"
   - **Type**: Select "Pump" or "IoT Device"
4. **Important**: Check the box **"IoT Enabled"**.
5. A new field **"Hardware ID / MAC Address"** will appear.
6. Enter the unique ID printed on your device (e.g., `A1:B2:C3:D4`).
7. Click **Add Asset**.

## Controlling Linked Devices
Once added, go to **Farm Management** > **IoT Control**.
- **Valves/Pumps**: Toggle the switch to turn them ON/OFF. The command is sent to the device using the linked Hardware ID.
- **Sensors**: Data (Moisture, Temp) will automatically stream if the Hardware ID matches.
