import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/constants';

export const useConnectionHealth = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [frontendSignalStrength, setFrontendSignalStrength] = useState(0);
    const [isBackendHealthy, setIsBackendHealthy] = useState(false);
    const [backendSignalStrength, setBackendSignalStrength] = useState(0);
    const [connectionWarning, setConnectionWarning] = useState<string | null>(null);

    const calculateStrength = (latency: number) => {
        if (latency < 80) return 5;
        if (latency < 100) return 4;
        if (latency < 200) return 3;
        if (latency < 500) return 2;
        if (latency < 1000) return 1;
        return 0;
    };

    const checkConnectionHealth = useCallback(async () => {
        // Frontend Check
        const feStart = Date.now();
        let feLatency = 99999;
        try {
            await fetch('/', { method: 'HEAD', cache: 'no-store' });
            feLatency = Date.now() - feStart;
            setFrontendSignalStrength(calculateStrength(feLatency));
            setIsOnline(true);
        } catch (e) {
            setFrontendSignalStrength(0);
        }

        // Backend Check
        const beStart = Date.now();
        try {
            const res = await fetch(API_BASE_URL.replace('/api/v1', ''), { method: 'GET' });
            const beLatency = Date.now() - beStart;

            if (res.ok) {
                setIsBackendHealthy(true);
                setBackendSignalStrength(calculateStrength(beLatency));

                if (beLatency > 3000) {
                    const msg = feLatency > 3000 ? "Network Congestion: Internet is very slow." : "Heavy Latency: Backend response > 3s.";
                    setConnectionWarning(msg);
                    setTimeout(() => setConnectionWarning(null), 5000);
                }
            } else {
                setIsBackendHealthy(false);
                setBackendSignalStrength(0);
                setConnectionWarning("Server Error: Backend unreachable.");
                setTimeout(() => setConnectionWarning(null), 5000);
            }
        } catch (e) {
            setIsBackendHealthy(false);
            setBackendSignalStrength(0);
            const msg = feLatency > 3000 ? "Connection Issue: Check your internet." : "Network Error: Backend not reachable.";
            setConnectionWarning(msg);
            setTimeout(() => setConnectionWarning(null), 5000);
        }
    }, []);

    useEffect(() => {
        const updateOnlineStatus = () => setIsOnline(typeof window !== 'undefined' ? navigator.onLine : true);
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();

        checkConnectionHealth();
        const interval = setInterval(checkConnectionHealth, 20000);

        let lastCheck = 0;
        const handleInteraction = () => {
            const now = Date.now();
            if (now - lastCheck > 2000) {
                checkConnectionHealth();
                lastCheck = now;
            }
        };
        window.addEventListener('click', handleInteraction);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            window.removeEventListener('click', handleInteraction);
            clearInterval(interval);
        };
    }, [checkConnectionHealth]);

    return {
        isOnline,
        frontendSignalStrength,
        isBackendHealthy,
        backendSignalStrength,
        connectionWarning
    };
};
