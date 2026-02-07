'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { getUserFarmId } from '@/lib/userFarm';
import { Link } from '@/navigation';
import { Plus, Router, Cpu, AlertTriangle, Settings, QrCode, Video, RefreshCw, ExternalLink } from 'lucide-react';
import { SignalIndicator } from '@/components/iot/SignalIndicator';
import { ValveSwitch } from '@/components/iot/ValveSwitch';
import { QRScannerModal } from '@/components/iot/QRScannerModal';
import { DeviceControlModal } from '@/components/iot/DeviceControlModal';
import { cn } from '@/lib/utils'; // Assuming this exists or I'll implement it locally at bottom

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
            // Get User Farm ID (cached after first call)
            const farmId = await getUserFarmId();

            // Fetch Assets from Farm Management that are IoT enabled
            // Only force-refresh on explicit (non-silent) loads; silent polls use cache
            const assets = await api.farmManagement.getAssets(farmId, { forceRefresh: !silent }) as any[];

            // Filter: Only show IoT enabled devices (Valves, Pumps, Sensors, Cameras)
            const iotAssets = assets.filter((a: any) => a.is_iot_enabled || ['Valve', 'Pump', 'Sensor', 'Camera'].includes(a.asset_type));

            setDevices(iotAssets);
        } catch (e) {
            console.error("Failed to fetch devices", e);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    // Polling for updates (30s — use WebSocket for real-time later)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDevices(true);
        }, 30000);
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
            // If it has a real IoT ID, update that. If not (just camera), update asset locally.
            // But we want to call API updateAsset or IoT update.
            // If it's a "Camera", usually status isn't toggleable like a valve, but maybe "Recording" vs "Idle"?
            // For now, assume this is for Valves/Pumps.

            // We use generic IoT update which syncs back to farm asset
            if (device.iot_device_id && !device.iot_device_id.startsWith('http')) {
                // It has a real hardware ID? Or maybe the ID is reused.
                // Just use updateAsset to be safe if we don't know the proper IoT ID mapping
                await api.farmManagement.updateAsset(device.id, { status: newStatusStr });
            } else {
                await api.farmManagement.updateAsset(device.id, { status: newStatusStr });
            }

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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Smart Devices & Cameras</h1>
                    <p className="text-slate-500 text-sm mt-1">Control field assets and view live feeds</p>
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
                        <span className="hidden sm:inline">Add / Manage</span>
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
                        Add IoT-enabled valves, pumps, sensors, or cameras in the Management section.
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
                        device.asset_type === 'Camera'
                            ? (
                                <CameraCard key={device.id} device={device} />
                            ) : (
                                <IotAssetCard
                                    key={device.id}
                                    device={device}
                                    onToggle={() => handleToggle(device)}
                                    isToggling={toggling === device.id}
                                />
                            )
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

                <Link href="/farm-management?tab=iot" className="text-slate-300 hover:text-slate-500 p-1" title="Configure">
                    <Settings className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-4">
                <div className="py-2 border-t border-slate-100 dark:border-white/5">
                    <ValveSwitch
                        label={isActive ? "Status: OPEN/ON" : "Status: CLOSED/OFF"}
                        isOn={isActive}
                        isLoading={isToggling}
                        onToggle={onToggle}
                    />
                </div>

                <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-white/5">
                    <span>ID: <span className="font-mono">{device.iot_device_id || 'N/A'}</span></span>
                    {device.asset_type === 'Pump' && <span>Flow: {isActive ? 'ACTIVE' : '0'}</span>}
                </div>
            </div>
        </div>
    );
}

function CameraCard({ device }: { device: any }) {
    // The Stream URL is stored in iot_device_id
    const streamUrl = device.iot_device_id;
    const [refreshKey, setRefreshKey] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // If no URL provided, show placeholder
    if (!streamUrl || streamUrl.length < 5) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm min-h-[250px] flex flex-col items-center justify-center text-slate-500">
                <Video className="w-10 h-10 mb-2 opacity-50" />
                <p>No Stream URL configured</p>
                <div className="text-xs mt-2 bg-slate-800 px-2 py-1 rounded">Edit in Farm Management</div>
            </div>
        );
    }

    const isMJPEG = streamUrl.includes('.mjpeg') || streamUrl.includes('action=stream') || !streamUrl.includes('.html');

    return (
        <div
            className="group relative block bg-black border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-green-500/30 transition-all duration-300"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]"></div>
                    <h3 className="font-bold text-white text-sm shadow-black drop-shadow-md">{device.name}</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setRefreshKey(k => k + 1)}
                        className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-lg backdrop-blur-sm transition-colors"
                        title="Reload Feed"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </button>
                    <a
                        href={streamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-lg backdrop-blur-sm transition-colors"
                        title="Open in New Tab"
                    >
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>

            {/* Video Area */}
            <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative">
                {/* Try to determine player type. If typical IP Cam, iframe or img often works. */}
                {isMJPEG ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={refreshKey}
                        src={`${streamUrl}#${refreshKey}`}
                        alt="Live Feed"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback if image fails?
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    <iframe
                        key={refreshKey}
                        src={streamUrl}
                        className="w-full h-full border-0"
                        allowFullScreen
                        title={device.name}
                    />
                )}

                {/* Placeholder if load fails (hidden by video if successful usually, or handle onError) */}
                <div className="absolute inset-0 -z-10 flex items-center justify-center text-slate-600">
                    <span className="flex items-center gap-2"><Video className="w-5 h-5" /> Loading Stream...</span>
                </div>
            </div>

            {/* Footer Info */}
            <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800">
                <span>IP: {streamUrl.split('/')[2] || 'Local'}</span>
                <span className="uppercase tracking-wider font-medium text-slate-500">Live View</span>
            </div>
        </div>
    );
}
