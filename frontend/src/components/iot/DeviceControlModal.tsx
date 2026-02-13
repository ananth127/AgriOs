import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Power, RefreshCw, Clock, Calendar, QrCode, X, Download, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

interface DeviceControlModalProps {
    isOpen: boolean;
    onClose: () => void;
    device: any;
    onUpdate?: () => void;
}

export const DeviceControlModal: React.FC<DeviceControlModalProps> = ({ isOpen, onClose, device, onUpdate }) => {
    const [timerMinutes, setTimerMinutes] = useState<string>('');
    const [toggling, setToggling] = useState(false);
    // Local status for immediate feedback, initialized from props
    const [status, setStatus] = useState(device?.status || 'Idle');
    const [siteUrl, setSiteUrl] = useState('');

    // Sync if props change (e.g. parent refetech)
    React.useEffect(() => {
        if (device?.status) setStatus(device.status);
        if (typeof window !== 'undefined') {
            setSiteUrl(window.location.origin);
        }
    }, [device?.status]);

    const isActive = status === 'Active' || status === 'Running';
    // Check if it's a Valve without a parent Pump (and current status is NOT active)
    const isOrphanValve = device?.asset_type === 'Valve' && !device.parent_device_id && !isActive;

    const handleToggle = async () => {
        if (!device) return;

        if (isOrphanValve) {
            alert("Cannot turn on Valve: No connected Pump found. Please link a pump in settings.");
            return;
        }

        setToggling(true);

        const action = isActive ? 'TURN_OFF' : 'TURN_ON';

        let targetId = device.id;
        // If device.id is not a number (e.g. wrapper object), try to parse it or use iot_device_id
        if (isNaN(Number(targetId))) {
            if (device.iot_device_id && !isNaN(Number(device.iot_device_id))) {
                targetId = Number(device.iot_device_id);
            } else if (typeof device.id === 'string' && !isNaN(parseInt(device.id))) {
                targetId = parseInt(device.id);
            }
        }

        try {
            // Optimistic Update
            const prevStatus = status;
            setStatus(isActive ? 'Idle' : 'Active');

            // Send Command
            await api.iot.sendCommand(Number(targetId), {
                command: action,
                payload: {
                    duration_minutes: timerMinutes ? parseInt(timerMinutes) : undefined
                }
            });

            if (onUpdate) onUpdate();
        } catch (e: any) {
            console.error(e);
            setStatus(isActive ? 'Active' : 'Idle'); // Revert
            const msg = e.response?.data?.detail || e.message || "Command Failed";
            alert(`Error: ${msg}`);
        } finally {
            setToggling(false);
        }
    };

    if (!device) return null;

    // Real Stats
    const totalMinutes = device.total_runtime_minutes || 0;
    const usageHours = (totalMinutes / 60).toFixed(1);

    let lastUsed = 'Never';
    if (device.last_active_at) {
        lastUsed = new Date(device.last_active_at).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    // QR Code - Generate Full URL for scanning
    // Directs to Farm Management IoT Tab and auto-opens this device
    const qrValue = siteUrl
        ? `${siteUrl}/farm-management?tab=iot&open_device=${device.id}`
        : (device.iot_device_id || `AGRIOS-${device.id}`);

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrValue)}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={device.name}>
            <div className="space-y-6">
                {/* Status Header */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                        {isActive ? 'Online & Running' : 'Standby / Idle'}
                    </span>
                    <span>Battery: {device.battery_level || 100}%</span>
                </div>

                {/* Big Control Button */}
                <div className="flex flex-col items-center justify-center py-4 gap-4">
                    {isOrphanValve && (
                        <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 p-3 rounded-lg flex items-center gap-2 text-sm font-medium w-full justify-center">
                            <AlertTriangle className="w-4 h-4" />
                            No Pump Connected. Cannot Start.
                        </div>
                    )}
                    <button
                        onClick={handleToggle}
                        disabled={toggling || isOrphanValve}
                        className={`w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-500 border-8 relative overflow-hidden
                            ${isActive
                                ? 'bg-green-500 border-green-200 shadow-green-500/50 text-white'
                                : isOrphanValve
                                    ? 'bg-slate-100 dark:bg-slate-900 border-amber-200/50 text-slate-300 opacity-50 cursor-not-allowed'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300 shadow-slate-200/50 active:scale-95'
                            }
                        `}
                    >
                        {isActive && <div className="absolute inset-0 bg-white/10 animate-pulse rounded-full" />}
                        {toggling ? (
                            <RefreshCw className="w-12 h-12 animate-spin mb-2 relative z-10" />
                        ) : (
                            <Power className="w-16 h-16 mb-2 relative z-10" />
                        )}
                        <span className="font-bold text-lg relative z-10">{isActive ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Timer Input (Only when OFF and valid) */}
                    {!isActive && !isOrphanValve && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-white/10">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                placeholder="Timer (min)"
                                className="w-24 bg-transparent outline-none text-sm"
                                value={timerMinutes}
                                onChange={e => setTimerMinutes(e.target.value)}
                            />
                        </div>
                    )}
                    {isActive && device.target_turn_off_at && (
                        <div className="text-xs text-amber-500 font-mono bg-amber-500/10 px-2 py-1 rounded">
                            Auto-off at {new Date(device.target_turn_off_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                </div>

                {/* Timeline / Usage Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                            <Clock className="w-3 h-3" /> Usage
                        </div>
                        <p className="text-xl font-mono font-bold text-slate-700 dark:text-slate-200">{usageHours}h</p>
                        <p className="text-[10px] text-slate-400">Total Runtime</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                            <Calendar className="w-3 h-3" /> Last Active
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{lastUsed}</p>
                        <p className="text-[10px] text-slate-400">Timestamp</p>
                    </div>
                </div>

                {/* QR Section */}
                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-lg p-1 border border-slate-100 shrink-0">
                        <img src={qrUrl} alt="Device QR" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Device QR Code</h4>
                        <p className="text-xs text-slate-500 mb-3 truncate">ID: {device.iot_device_id || device.id}</p>
                        <button className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg transition-colors font-medium">
                            <Download className="w-3 h-3" /> Save for Print
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
