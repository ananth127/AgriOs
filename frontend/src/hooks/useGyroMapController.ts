import { useEffect, useState, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface GyroConfig {
    deadzone?: number; // degrees before movement starts (default: 2)
    sensitivity?: number; // Multiplier for speed (default: 1.0)
    smoothing?: number; // 0-1, higher is smoother (default: 0.1)
    maxSpeed?: number; // Max pixels per frame (default: 50)
}

export function useGyroMapController(config: GyroConfig = {}) {
    const map = useMap();
    const [isActive, setIsActive] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orientation, setOrientation] = useState({ beta: 0, gamma: 0 });
    const [lastEventTime, setLastEventTime] = useState(0);
    const [status, setStatus] = useState<'initial' | 'requesting' | 'active' | 'error'>('initial');

    // Dynamic State
    const velocity = useRef({ x: 0, y: 0 }); // Current velocity
    const calibration = useRef({ beta: 0, gamma: 0 }); // Zero point (user holding angle)
    const requestRef = useRef<number | undefined>(undefined);

    // Configuration
    const DEADZONE = config.deadzone ?? 2;
    const SENSITIVITY = config.sensitivity ?? 0.5; // Lower sensitivity for panBy
    const SMOOTHING = config.smoothing ?? 0.1;
    const MAX_SPEED = config.maxSpeed ?? 30;

    // Permissions (iOS 13+)
    const requestPermission = async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const response = await (DeviceOrientationEvent as any).requestPermission();
                if (response === 'granted') {
                    setPermissionGranted(true);
                    return true;
                } else {
                    setError("Permission denied by user.");
                    setStatus('error');
                    return false;
                }
            } catch (e) {
                console.error("Permission error:", e);
                setError("Permission request failed.");
                setStatus('error');
                return false;
            }
        }
        setPermissionGranted(true);
        return true;
    };

    const calibrate = useCallback(() => {
        velocity.current = { x: 0, y: 0 };
    }, []);

    // Main Loop
    const animate = useCallback(() => {
        if (!map) return;

        // Apply velocity to map center
        if (Math.abs(velocity.current.x) > 0.1 || Math.abs(velocity.current.y) > 0.1) {
            map.panBy([-velocity.current.x, -velocity.current.y], { animate: false });
        }

        requestRef.current = requestAnimationFrame(animate);
    }, [map]);

    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        const beta = event.beta;
        const gamma = event.gamma;

        if (beta === null || gamma === null) return;

        // Update State for Debugging
        setOrientation({ beta, gamma });
        setLastEventTime(Date.now());

        // Logic:
        let deltaX = gamma - calibration.current.gamma; // Left/Right
        let deltaY = beta - calibration.current.beta;   // Front/Back

        // 2. Apply Deadzone
        if (Math.abs(deltaX) < DEADZONE) deltaX = 0;
        else deltaX = deltaX > 0 ? deltaX - DEADZONE : deltaX + DEADZONE;

        if (Math.abs(deltaY) < DEADZONE) deltaY = 0;
        else deltaY = deltaY > 0 ? deltaY - DEADZONE : deltaY + DEADZONE;

        // 3. Calculate Target Velocity
        const targetVx = deltaX * SENSITIVITY;
        const targetVy = deltaY * SENSITIVITY;

        // 4. Smooth Velocity (Interpolation)
        velocity.current.x += (targetVx - velocity.current.x) * SMOOTHING;
        velocity.current.y += (targetVy - velocity.current.y) * SMOOTHING;

        // 5. Clamp
        velocity.current.x = Math.max(Math.min(velocity.current.x, MAX_SPEED), -MAX_SPEED);
        velocity.current.y = Math.max(Math.min(velocity.current.y, MAX_SPEED), -MAX_SPEED);

    }, [DEADZONE, SENSITIVITY, SMOOTHING, MAX_SPEED]);

    const start = useCallback(async () => {
        setError(null);
        if (typeof window === 'undefined') return;

        // 1. HTTPS Check (Most common reason for API being missing/disabled)
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            setError("HTTPS Required! (Sensors disabled)");
            setStatus('error');
            return;
        }

        // 2. API Support Check
        // Note: Some browsers hide the API entirely in insecure contexts, so check HTTPS first.
        if (typeof DeviceOrientationEvent === 'undefined') {
            setError("Device Incompatible (No Gyro API found)");
            setStatus('error');
            return;
        }

        setStatus('requesting');
        const granted = await requestPermission();
        if (granted) {
            const initialHandler = (e: DeviceOrientationEvent) => {
                if (e.beta === null || e.gamma === null) return;

                calibration.current = {
                    beta: e.beta,
                    gamma: e.gamma
                };
                window.removeEventListener('deviceorientation', initialHandler);

                // Start Loop
                window.addEventListener('deviceorientation', handleOrientation);
                requestRef.current = requestAnimationFrame(animate);
                setIsActive(true);
                setStatus('active');
            };
            window.addEventListener('deviceorientation', initialHandler);

            // Timeout backup: if no event fires within 1s, it might be uncalibrated but granted
            // or desktop simulation
            setTimeout(() => {
                if (status === 'requesting') {
                    // setStatus('active'); // Assume active but no data yet?
                    // Better to let it hang on 'requesting' or show 'waiting for data'
                }
            }, 1000);
        }
    }, [handleOrientation, animate, requestPermission, isActive, status]);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('deviceorientation', handleOrientation);
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        velocity.current = { x: 0, y: 0 };
        setIsActive(false);
        setStatus('initial');
    }, [handleOrientation]);

    useEffect(() => {
        return () => {
            stop(); // Cleanup on unmount
        };
    }, [stop]);

    return { start, stop, calibrate, isActive, status, permissionGranted, error, orientation, lastEventTime };
}
