'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Tractor, Sprout, Users, AlertTriangle,
    Wifi, Battery, Signal, Wind, Droplets, Sun,
    Thermometer, Camera, Maximize2, Filter, Grid
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SmartMonitorPage() {
    const searchParams = useSearchParams();
    const initialType = searchParams.get('type') || 'ALL';
    const targetId = searchParams.get('id');

    const [activeTab, setActiveTab] = useState(initialType);
    const [spotlightIndex, setSpotlightIndex] = useState(0);
    const [livestockDevices, setLivestockDevices] = useState<any[]>([]);

    // Mock Data State
    const [items, setItems] = useState<any[]>([]);

    // Fetch Real IoT Device Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all IoT devices
                const devices = await api.iot.getDevices() as any[];

                // Transform API data to match UI format
                const transformedItems = devices.map((device: any) => ({
                    id: device.id.toString(),
                    type: device.asset_type || 'DEVICE',
                    name: device.name,
                    status: device.status || 'IDLE',
                    isOnline: device.is_online,
                    // Merge telemetry data
                    ...device.last_telemetry,
                    // Keep original for reference
                    _raw: device
                }));

                setItems(transformedItems);

                // If targetId is specified, find and spotlight it
                if (targetId && transformedItems.length > 0) {
                    const targetIndex = transformedItems.findIndex(
                        (item: any) => item.id === targetId || item._raw?.id?.toString() === targetId
                    );
                    if (targetIndex !== -1) {
                        setSpotlightIndex(targetIndex);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch IoT devices:", error);
                setItems([]);
            }
        };

        fetchData();

        // Refresh data every 10 seconds
        const interval = setInterval(fetchData, 10000);

        return () => clearInterval(interval);
    }, [targetId]);

    // Filter Logic
    const filteredItems = useMemo(() => {
        if (activeTab === 'ALL') return items;
        return items.filter(i => i.type === activeTab);
    }, [items, activeTab]);

    // Spotlight Logic: Prioritize Alerts -> Running -> Active
    const spotlightQueue = useMemo(() => {
        const alerts = filteredItems.filter(i => i.status === 'ALERT' || i.status === 'WARNING');
        const running = filteredItems.filter(i => i.status === 'RUNNING' || i.status === 'ACTIVE');
        const others = filteredItems.filter(i => !alerts.includes(i) && !running.includes(i));
        return [...alerts, ...running, ...others];
    }, [filteredItems]);

    // Rotate Spotlight
    useEffect(() => {
        if (spotlightQueue.length === 0) return;
        const interval = setInterval(() => {
            setSpotlightIndex(prev => (prev + 1) % spotlightQueue.length);
        }, 8000); // 8 seconds per spotlight
        return () => clearInterval(interval);
    }, [spotlightQueue]);

    const currentSpotlight = spotlightQueue[spotlightIndex] || spotlightQueue[0];

    return (
        <div className="min-h-screen bg-slate-950 p-6 pb-20 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
                        Command Center
                    </h1>
                    <p className="text-slate-400">Real-time centralized monitoring across your entire farm.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
                    {['ALL', 'CROP', 'LIVESTOCK', 'MACHINERY', 'LABOR'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setSpotlightIndex(0); }}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">

                {/* Left Column: Spotlight (2/3 width) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <AnimatePresence mode='wait'>
                        {currentSpotlight && (
                            <motion.div
                                key={currentSpotlight.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.5 }}
                                className="flex-1 relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl group"
                            >
                                {/* Content based on Type */}
                                {currentSpotlight.videoUrl ? (
                                    <video
                                        src={currentSpotlight.videoUrl}
                                        autoPlay muted loop playsInline
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                                        {getIconForType(currentSpotlight.type, "w-32 h-32 text-slate-700")}
                                    </div>
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20 p-8 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${getStatusColor(currentSpotlight.status)}`}>
                                            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                            {currentSpotlight.status}
                                        </span>
                                        <Maximize2 className="w-6 h-6 text-white/50 hover:text-white cursor-pointer" />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 text-blue-400 font-mono text-sm mb-2">
                                            {getIconForType(currentSpotlight.type, "w-4 h-4")}
                                            {currentSpotlight.type} MONITOR
                                        </div>
                                        <h2 className="text-4xl font-bold text-white mb-4">{currentSpotlight.name}</h2>

                                        {/* Dynamic Metrics */}
                                        <div className="grid grid-cols-4 gap-4">
                                            {currentSpotlight.value && (
                                                <MetricBox label="Current Reading" value={currentSpotlight.value} />
                                            )}
                                            {currentSpotlight.battery && (
                                                <MetricBox label="Battery" value={`${currentSpotlight.battery}%`} icon={<Battery className="w-4 h-4" />} />
                                            )}
                                            {currentSpotlight.signal && (
                                                <MetricBox label="Signal" value={`${currentSpotlight.signal}/5`} icon={<Signal className="w-4 h-4" />} />
                                            )}
                                            {currentSpotlight.operator && (
                                                <MetricBox label="Operator" value={currentSpotlight.operator} icon={<Users className="w-4 h-4" />} />
                                            )}
                                        </div>

                                        {currentSpotlight.alert && (
                                            <div className="mt-6 bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-4 text-red-200 animate-pulse">
                                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                                <span className="font-bold">{currentSpotlight.alert}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: Feed List (1/3 width) */}
                <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 sticky top-0 bg-slate-900 py-2 z-10 flex justify-between">
                        <span>Active Networks ({filteredItems.length})</span>
                        <Grid className="w-4 h-4" />
                    </h3>

                    {filteredItems.map((item, idx) => (
                        <div
                            key={item.id}
                            onClick={() => setSpotlightIndex(spotlightQueue.indexOf(item))} // Jump to this item
                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${currentSpotlight?.id === item.id
                                ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/10'
                                : 'bg-slate-900 border-white/5 hover:border-white/20'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                                        {getIconForType(item.type, "w-4 h-4")}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-semibold ${item.status === 'ALERT' ? 'text-red-400' : 'text-white'}`}>{item.name}</h4>
                                        <span className="text-[10px] text-slate-500">{item.type}</span>
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${item.status === 'ACTIVE' || item.status === 'RUNNING' ? 'bg-green-500' : item.status === 'ALERT' ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                            </div>

                            {(item.value || item.activity) && (
                                <div className="mt-2 text-xs font-mono text-slate-300 bg-black/20 p-2 rounded">
                                    {item.value || item.activity}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Helpers
function getStatusColor(status: string) {
    switch (status) {
        case 'ACTIVE': return 'bg-green-500/10 border-green-500/20 text-green-400';
        case 'RUNNING': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
        case 'WARNING': return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
        case 'ALERT': return 'bg-red-500/10 border-red-500/20 text-red-500';
        case 'MAINTENANCE': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
        default: return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
}

function getIconForType(type: string, className: string) {
    switch (type) {
        case 'CROP': return <Sprout className={className} />;
        case 'MACHINERY': return <Tractor className={className} />;
        case 'LIVESTOCK': return <Wifi className={className} />; // Or a generic sensor/wifi icon
        case 'LABOR': return <Users className={className} />;
        default: return <Activity className={className} />;
    }
}

function MetricBox({ label, value, icon }: any) {
    return (
        <div className="bg-slate-950/50 p-3 rounded-xl border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                {icon} {label}
            </div>
            <div className="text-white font-mono font-semibold">{value}</div>
        </div>
    );
}
