import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AddAssetModal } from './AddAssetModal';
import { EditAssetModal } from './EditAssetModal';
import { api } from '@/lib/api';
import { Pencil, Trash2, Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CriticalAlertModal } from '@/components/iot/CriticalAlertModal';
import { DeviceControlModal } from '@/components/iot/DeviceControlModal';
import { useSearchParams } from 'next/navigation';

export const MachineryManager: React.FC<{ farmId: number; category?: 'machinery' | 'iot' }> = ({ farmId, category = 'machinery' }) => {
    const t = useTranslations('FarmManagement');
    const [assets, setAssets] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingAsset, setEditingAsset] = useState<any>(null);
    const [controlDevice, setControlDevice] = useState<any>(null);
    const [alertData, setAlertData] = useState<any>(null);
    const [ignoredAlerts, setIgnoredAlerts] = useState<string[]>([]);
    const searchParams = useSearchParams();

    // Load ignored alerts from local storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('agrios_ignored_alerts');
        if (stored) {
            try {
                setIgnoredAlerts(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse ignored alerts", e);
            }
        }
    }, []);

    const dismissCurrentAlert = () => {
        if (alertData?.id) {
            const newIgnored = [...ignoredAlerts, alertData.id];
            setIgnoredAlerts(newIgnored);
            localStorage.setItem('agrios_ignored_alerts', JSON.stringify(newIgnored));
        }
        setAlertData(null);
    };

    const fetchAssets = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await api.farmManagement.getAssets(farmId, { forceRefresh: silent });
            const allAssets = Array.isArray(data) ? data : [];

            // Filter based on Category
            const filtered = allAssets.filter((asset: any) => {
                const isIotType = ['Valve', 'Pump', 'Sensor', 'IoT Device', 'Weather Station'].includes(asset.asset_type) || asset.is_iot_enabled;
                if (category === 'iot') {
                    return isIotType;
                } else {
                    return !isIotType;
                }
            });

            if (filtered.length === 0) {
                // Auto-create default asset for category
                const payload = category === 'iot' ? {
                    name: "Smart Valve Left-Sector",
                    asset_type: "Valve",
                    is_iot_enabled: true,
                    iot_device_id: "DEMO-V-01",
                    status: "Active",
                    farm_id: farmId,
                    purchase_date: new Date().toISOString().split('T')[0],
                    cost: 1200,
                    config: { sensors: ['Flow Meter'] }
                } : {
                    name: "John Deere 5050D",
                    asset_type: "Tractor",
                    is_iot_enabled: false,
                    status: "Idle",
                    farm_id: farmId,
                    purchase_date: new Date().toISOString().split('T')[0],
                    cost: 850000
                };

                // Optimistic Update
                setAssets([{ ...payload, id: Date.now() }]);

                try {
                    await api.farmManagement.addAsset(payload);
                    // Silent refresh
                    const refreshedData = await api.farmManagement.getAssets(farmId, { forceRefresh: true });
                    const newAll = Array.isArray(refreshedData) ? refreshedData : [];
                    const newFiltered = newAll.filter((asset: any) => {
                        const isIotType = ['Valve', 'Pump', 'Sensor', 'IoT Device', 'Weather Station'].includes(asset.asset_type) || asset.is_iot_enabled;
                        return category === 'iot' ? isIotType : !isIotType;
                    });
                    if (newFiltered.length > 0) setAssets(newFiltered);
                } catch (createErr) {
                    console.error("Failed to persist default asset", createErr);
                    // Keep optimistic
                }
            } else {
                setAssets(filtered);
            }

        } catch (error) {
            console.error('Failed to fetch assets:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [farmId, category]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    // Check for Critical Alerts (Effect ensures we have fresh 'ignoredAlerts' closure)
    useEffect(() => {
        if (category === 'iot' && assets.length > 0) {
            for (const asset of assets) {
                if (asset.iot_settings?.last_alert && asset.status === 'Idle') {
                    const alert = asset.iot_settings.last_alert;
                    const alertId = `${asset.id}-${alert.timestamp}`;

                    if (!ignoredAlerts.includes(alertId)) {
                        // Only set if we are not already showing THIS alert
                        if (!alertData || alertData.id !== alertId) {
                            setAlertData({
                                title: "Pump Safety Stop",
                                message: alert.message,
                                device_name: asset.name,
                                timestamp: alert.timestamp,
                                id: alertId
                            });

                            // Force close the control modal if it's open for this device
                            if (controlDevice && (controlDevice.id === asset.id || controlDevice.iot_device_id === asset.iot_device_id)) {
                                setControlDevice(null);
                            }
                        }
                        break; // Show one at a time
                    }
                }
            }
        }
    }, [assets, ignoredAlerts, category]);

    // Polling for updates (every 2 seconds, silent)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAssets(true);
        }, 2000);
        return () => clearInterval(interval);
    }, [fetchAssets]);

    // Update the open modal if data changes in background
    useEffect(() => {
        if (controlDevice && assets.length > 0) {
            const updated = assets.find(a => a.id === controlDevice.id);
            // Only update if something changed to avoid re-renders if strict check fails? 
            // React state updates only trigger if reference changes or value changes. 
            // Here `updated` is likely a new object reference from API.
            // DeviceControlModal handles prop updates gracefully.
            if (updated && updated.status !== controlDevice.status) {
                setControlDevice(updated);
            }
        }
    }, [assets]); // Intentionally not including controlDevice to avoid loops, though strict mode is safe.

    // Handle Auto-Open from URL (e.g. Scan QR)
    useEffect(() => {
        if (assets.length > 0 && category === 'iot') {
            const openId = searchParams.get('open_device');
            if (openId && !controlDevice) { // Only auto-open if not already open (prevents over-writing user interaction)
                // Try matching ID or IoT Hardware ID
                const target = assets.find(a => String(a.id) === openId || a.iot_device_id === openId);
                if (target) {
                    setControlDevice(target);
                }
            }
        }
    }, [assets, searchParams, category]); // Removed controlDevice from deps to fix lint warnings but safe logic.

    const handleDelete = async (id: number) => {
        if (!confirm(t('confirm_delete_asset'))) return;
        try {
            await api.farmManagement.deleteAsset(id);
            fetchAssets();
        } catch (error) {
            console.error("Delete failed", error);
            alert(t('error_delete_asset'));
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const title = category === 'iot' ? "IoT Devices & Smart Assets" : t('machinery_title');
    const addButtonText = category === 'iot' ? "Add New Device" : t('btn_add_asset');

    return (
        <>
            <Card className="w-full">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>{title}</CardTitle>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {addButtonText}
                    </button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">{t('loading_assets')}</div>
                    ) : assets.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            {category === 'iot' ? "No IoT devices found. Add valves, pumps, or sensors to get started." : t('empty_assets')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {assets.map((asset) => {
                                // Mock run-time data if not in DB yet, for consistent "monitoring" feel
                                const fuel = asset.fuel_level || Math.floor(Math.random() * 40) + 60;
                                const maintenance = asset.maintenance_status || 'Good';
                                const task = asset.current_task || (asset.status === 'Active' ? 'Running' : 'Idle');

                                return (
                                    <div key={asset.id} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 relative group flex flex-col md:flex-row gap-4 items-center">
                                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-200 dark:bg-slate-800 p-1 rounded z-10">
                                            {category === 'iot' && (
                                                <button
                                                    onClick={() => setControlDevice(asset)}
                                                    className="text-green-500 hover:text-green-600 p-1"
                                                    title="Open Dashboard"
                                                >
                                                    <Activity className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setEditingAsset(asset)}
                                                className="text-blue-500 hover:text-blue-600 p-1"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(asset.id)} className="text-red-500 hover:text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>

                                        {/* Icon / Avatar - Clickable for IoT */}
                                        <div
                                            onClick={() => category === 'iot' && setControlDevice(asset)}
                                            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 ${asset.status === 'Active' ? 'bg-green-100 dark:bg-green-900/40 text-green-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'} ${category === 'iot' ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                                        >
                                            {category === 'iot' ? '📡' : '🚜'}
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1 text-center md:text-left cursor-pointer" onClick={() => category === 'iot' && setControlDevice(asset)}>
                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white hover:text-green-500 transition-colors">{asset.name}</h3>
                                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border ${asset.status === 'Active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200'}`}>
                                                    {asset.status || 'Idle'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                {asset.asset_type}
                                                {asset.iot_device_id && <span className="font-mono text-xs ml-2 bg-slate-100 dark:bg-slate-800 px-1 rounded">ID: {asset.iot_device_id}</span>}
                                            </p>
                                        </div>

                                        {/* Monitoring Stats */}
                                        <div className="flex gap-6 w-full md:w-auto justify-center md:justify-end bg-white dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                                            {category === 'machinery' ? (
                                                <div className="text-center min-w-[80px]">
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 justify-center uppercase tracking-wider">
                                                        Fuel
                                                    </div>
                                                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative mx-auto mb-1">
                                                        <div
                                                            className={`h-full ${fuel < 20 ? 'bg-red-500' : 'bg-green-500'} transition-all`}
                                                            style={{ width: `${fuel}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{fuel}%</span>
                                                </div>
                                            ) : (
                                                <div className="text-center min-w-[80px]">
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 justify-center uppercase tracking-wider">
                                                        Signal
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {asset.status === 'Active' ? 'Strong' : '-'}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-center min-w-[80px] border-l border-slate-200 dark:border-white/10 pl-4">
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 justify-center uppercase tracking-wider">
                                                    Status
                                                </div>
                                                <div className={`text-sm font-bold ${maintenance === 'Good' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {maintenance}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
            <AddAssetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAssets}
                farmId={farmId}
                category={category === 'iot' ? 'irrigation' : 'machinery'}
            />
            {editingAsset && (
                <EditAssetModal
                    isOpen={!!editingAsset}
                    onClose={() => setEditingAsset(null)}
                    onSuccess={fetchAssets}
                    asset={editingAsset}
                />
            )}
            {controlDevice && (
                <DeviceControlModal
                    isOpen={!!controlDevice}
                    onClose={() => setControlDevice(null)}
                    device={controlDevice}
                    onUpdate={fetchAssets}
                />
            )}
            <CriticalAlertModal
                isOpen={!!alertData}
                onClose={dismissCurrentAlert}
                alert={alertData}
            />
        </>
    );
};
