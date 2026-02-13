# Agri-OS IoT Smart Features & enhancements

## Overview
This document details the enhancements made to the IoT module to support "Smart Control", including usage statistics, safety interlocks (Pump/Valve), and timer-based operations.

## 1. Safety Interlock (Pump Protection)
**Goal**: Prevent dead-heading pumps by ensuring at least one downstream valve is OPEN before the pump starts.

### Implementation
- **Data Model**:
    - `IoTDevice` now has a `parent_device_id` field.
    - Valves are linked to Pumps via this ID.
- **Logic (`service.control_device`)**:
    - **Startup Protection**:
        - When `TURN_ON` is requested for a device with `asset_type="Pump"`, query all child devices (Valves).
        - If linked valves exist, verify at least one is in `Active` status.
        - If none are active, raise `ValueError("Safety Block: ...")`.
    - **Deadhead Protection (Auto-Stop)**:
        - When `TURN_OFF` is requested for a **Valve**, the system checks its parent Pump.
        - It then checks if *any other* sibling valves are still `Active`.
        - If no other valves are open, the **Pump is automatically turned OFF** to prevent damage.
        - An alert is logged on the Pump's telemetry.

## 2. Usage Statistics
**Goal**: Track real usage for maintenance and reporting.

### Implementation
- **Data Model**:
    - `last_active_at` (DateTime): Updated on every `TURN_ON`.
    - `total_runtime_minutes` (Float): Accumulates duration on every `TURN_OFF`.
    - `current_run_start_time` (DateTime): Temporary timestamp while `Active`.
- **Logic**:
    - On `TURN_OFF`: `delta = now - current_run_start_time`. Add `delta` to `total_runtime_minutes`.

## 3. Timer Control
**Goal**: Allow users to "Turn On for X minutes".

### Implementation
- **API**: `POST /devices/{id}/command` accepts payload `{"duration_minutes": 30}`.
- **Backend**:
    - Calculates `target_turn_off_at = now + duration`.
    - *Future Work*: A background scheduler (Celery/Cron) is needed to actually enforce this by checking `target_turn_off_at` and auto-sending `TURN_OFF`. For now, it is stored for UI display and manual checking.
- **Frontend**:
    - `DeviceControlModal` calculates and displays "Auto-off at..." if set.

## 4. Frontend Workflows
- **Registration & Management**:
    - New "Type" selector (Pump, Valve, Sensor).
    - If "Valve" is selected, a "Link Parent Pump" dropdown appears.
    - **Asset List**: Valves without a connected pump show a warning icon and a direct "Link Now" button.
    - **Edit Mode**: Users can now update existing valves to link them to a parent pump.
- **Control**:
    - Timer input added to the "Turn On" flow.
    - Real-time stats (Last Active, Total Runtime) displayed.
