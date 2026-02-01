'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Link } from '@/navigation';
import { Plus, Router, Cpu, AlertTriangle, Settings, QrCode } from 'lucide-react';
import { SignalIndicator } from '@/components/iot/SignalIndicator';
import { ValveSwitch } from '@/components/iot/ValveSwitch';
import { QRScannerModal } from '@/components/iot/QRScannerModal';
import { DeviceControlModal } from '@/components/iot/DeviceControlModal';

export default function DevicesPage() {
    const { token } = useAuth();
    const [devices, setDevices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toggling, setToggling] = useState<number | null>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [scannedDevice, setScannedDevice] = useState<any>(null);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            // Fetch Assets from Farm Management that are IoT enabled
            // We use Farm ID 1 for this demo context
            const assets = await api.farmManagement.getAssets(1, { forceRefresh: silent }) as any[];

            // Filter: Only show IoT enabled devices (Valves, Pumps, Sensors)
            // The user wants to see "all IOT enabled"
            const iotAssets = assets.filter((a: any) => a.is_iot_enabled || ['Valve', 'Pump', 'Sensor'].includes(a.asset_type));

            setDevices(iotAssets);
        } catch (e) {
            console.error("Failed to fetch devices", e);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    // Polling for updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDevices(true);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Sync open modal with polled data
    useEffect(() => {
        if (scannedDevice && devices.length > 0) {
            const updated = devices.find(d => d.id === scannedDevice.id);
            if (updated && updated.status !== scannedDevice.status) {
                setScannedDevice(updated);
            }
        }
    }, [devices]);

    const handleToggle = async (device: any) => {
        setToggling(device.id);
        const newState = device.status !== 'Active';
        const newStatusStr = newState ? 'Active' : 'Idle';

        // Optimistic Update
        setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: newStatusStr } : d));

        try {
            await api.iot.update(device.id, { status: newStatusStr });
        } catch (e) {
            console.error("Toggle failed", e);
            // Revert
            setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: device.status } : d));
            alert("Failed to toggle device. Check connection.");
        } finally {
            setToggling(null);
        }
    };

    const handleScanSuccess = (deviceId: string) => {
        // Mock lookup: In reality, we'd find by ID. Here we just pick the first one or a random one to demo the modal.
        // We'll try to find a device that matches the scanned string, or fallback to the first "Pump" available for demo
        const found = devices.length > 0
            ? (devices.find(d => d.iot_device_id === deviceId || d.id === deviceId) || devices[0])
            : null;

        if (found) {
            setScannedDevice(found);
            setShowScanner(false);
        } else {
            alert("Device not found in inventory.");
            setShowScanner(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Smart Devices</h1>
                    <p className="text-slate-500 text-sm mt-1">Control your field assets remotely</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowScanner(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold transition-all active:scale-95 text-sm"
                    >
                        <QrCode className="w-5 h-5" />
                        <span className="hidden sm:inline">Scan</span>
                    </button>
                    <Link
                        href="/farm-management?tab=iot"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 text-sm"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Manage</span>
                    </Link>
                </div>
            </div>

            <QRScannerModal
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScanSuccess={handleScanSuccess}
            />

            {scannedDevice && (
                <DeviceControlModal
                    isOpen={!!scannedDevice}
                    onClose={() => setScannedDevice(null)}
                    device={scannedDevice}
                    onUpdate={fetchDevices}
                />
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                </div>
            ) : devices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                        <Router className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Smart Devices Found</h3>
                    <p className="text-slate-500 max-w-xs text-center mt-2 mb-6">
                        Add IoT-enabled valves, pumps, or sensors in the Management section to see them here.
                    </p>
                    <Link
                        href="/farm-management?tab=iot"
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm"
                    >
                        Go to IoT Management
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devices.map((device) => (
                        <IotAssetCard
                            key={device.id}
                            device={device}
                            onToggle={() => handleToggle(device)}
                            isToggling={toggling === device.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function IotAssetCard({ device, onToggle, isToggling }: { device: any, onToggle: () => void, isToggling: boolean }) {
    const isOnline = true; // Assume online for assets unless we have a specific field
    const isActive = device.status === 'Active';

    return (
        <div className="group relative block bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-green-500/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", isActive ? "bg-green-100/50 dark:bg-green-500/10 text-green-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                        {device.asset_type === 'Pump' ? '⚡' : device.asset_type === 'Sensor' ? '📡' : '💧'}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{device.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{device.asset_type}</span>
                        </div>
                    </div>
                </div>

                {/* Configuration Redirect */}
                <Link href="/farm-management?tab=iot" className="text-slate-300 hover:text-slate-500 p-1" title="Configure">
                    <Settings className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-4">
                {/* Interactive Toggle */}
                <div className="py-2 border-t border-slate-100 dark:border-white/5">
                    <ValveSwitch
                        label={isActive ? "Status: OPEN" : "Status: CLOSED"}
                        isOn={isActive}
                        isLoading={isToggling}
                        onToggle={onToggle}
                    />
                </div>

                <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-white/5">
                    <span>Hardware ID: <span className="font-mono">{device.iot_device_id || 'N/A'}</span></span>
                    {device.asset_type === 'Pump' && <span>Flow: {isActive ? '120L/m' : '0'}</span>}
                </div>
            </div>
        </div>
    );
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

