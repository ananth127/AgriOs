'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Tractor, Sprout, Users, AlertTriangle,
    Wifi, Battery, Signal, Wind, Droplets, Sun,
    Thermometer, Camera, Maximize2, Filter, Grid, History, ArrowRight, Video,
    Move, ZoomIn, ZoomOut, RotateCw, RotateCcw, Crosshair, Eye, Shield, Zap
} from 'lucide-react';
import { api } from '@/lib/api';
import { getUserFarmId } from '@/lib/userFarm';

import { AddAssetModal } from '@/components/farm-management/AddAssetModal';

export default function SmartMonitorPage() {
    const searchParams = useSearchParams();
    const initialType = searchParams.get('type') || 'ALL';
    const targetId = searchParams.get('id');

    const [activeTab, setActiveTab] = useState(initialType);
    const [spotlightIndex, setSpotlightIndex] = useState(0);
    const [items, setItems] = useState<any[]>([]);

    // Header Actions State
    const [showAddModal, setShowAddModal] = useState(false);
    const [farmId, setFarmId] = useState<number | null>(null);

    // Advanced Controls State
    const [isPtzEnabled, setIsPtzEnabled] = useState(false);
    const [showAiOverlay, setShowAiOverlay] = useState(true);
    const [showZones, setShowZones] = useState(false);
    const [thermalMode, setThermalMode] = useState(false);
    const [ptzState, setPtzState] = useState({ pan: 0, tilt: 0, zoom: 1 });

    // Mock History Snapshots for Advanced View
    const [snapshots, setSnapshots] = useState([
        { id: 1, src: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=400', time: '10:42 AM', label: 'Motion Zone A' },
        { id: 2, src: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=400', time: '10:41 AM', label: 'Gate Entry' },
        { id: 3, src: 'https://images.unsplash.com/photo-1530836369250-ef7203935a8b?q=80&w=400', time: '10:40 AM', label: 'Pump Status' },
        { id: 4, src: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=400', time: '10:39 AM', label: 'Sensor Alert' },
    ]);

    // Fetch Real Data (IoT Devices + Camera Assets)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Farm ID (cached after first call)
                const fId = await getUserFarmId();
                setFarmId(fId);

                // 2. Fetch IoT Devices + Farm Assets in parallel
                const [devices, assets] = await Promise.all([
                    api.iot.getDevices() as Promise<any[]>,
                    api.farmManagement.getAssets(fId) as Promise<any[]>,
                ]);

                // Filter Cameras
                const cameras = assets
                    .filter((a: any) => a.asset_type === 'Camera')
                    .map((cam: any) => ({
                        id: `CAM-${cam.id}`,
                        type: 'CAMERA',
                        name: cam.name,
                        status: 'ACTIVE', // Assume active if present
                        isOnline: true,
                        hasPTZ: true, // Assume PTZ capability for fun/demo
                        imageUrl: cam.iot_device_id, // Stream URL stored here
                        contextLink: '/farm-management?tab=iot',
                        contextLabel: 'Camera Settings',
                        _raw: cam
                    }));

                // Transform IoT Devices
                const transformedIoT = devices.map((device: any, index: number) => {
                    const type = device.asset_type || 'DEVICE';
                    const hasPTZ = type === 'CCTV' || type === 'DRONE';

                    let contextLink = '/';
                    let contextLabel = 'View Dashboard';

                    switch (type) {
                        case 'CROP': contextLink = '/crops'; contextLabel = 'Crop Analytics'; break;
                        case 'LIVESTOCK': contextLink = '/livestock'; contextLabel = 'Livestock Health'; break;
                        case 'MACHINERY': contextLink = '/farm-management'; contextLabel = 'Fleet Management'; break;
                        case 'LABOR': contextLink = '/farm-management'; contextLabel = 'Task Board'; break;
                        default: contextLink = '/dashboard'; contextLabel = 'Main Dashboard';
                    }

                    return {
                        id: device.id.toString(),
                        type,
                        name: device.name,
                        status: device.status || 'IDLE',
                        isOnline: device.is_online,
                        hasPTZ,
                        contextLink,
                        contextLabel,
                        ...device.last_telemetry,
                        _raw: device
                    };
                });

                // Merge: Cameras first for visibility
                const mergedItems = [...cameras, ...transformedIoT];
                setItems(mergedItems);

                // Spotlight Logic
                if (targetId && mergedItems.length > 0) {
                    const targetIndex = mergedItems.findIndex(
                        (item: any) => item.id === targetId || item._raw?.id?.toString() === targetId
                    );
                    if (targetIndex !== -1) {
                        setSpotlightIndex(targetIndex);
                    }
                } else if (cameras.length > 0 && items.length === 0) {
                    // Default to first camera if no previous items
                    setSpotlightIndex(0);
                }

            } catch (error) {
                console.error("Failed to fetch smart monitor data:", error);
                // Don't clear items on single failure, allows stale data survival
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [targetId, items.length]);




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

    // Auto-Rotate Spotlight (only if not manually interacting)
    useEffect(() => {
        if (spotlightQueue.length === 0 || isPtzEnabled) return;
        const interval = setInterval(() => {
            setSpotlightIndex(prev => (prev + 1) % spotlightQueue.length);
        }, 12000);
        return () => clearInterval(interval);
    }, [spotlightQueue, isPtzEnabled]);

    const currentSpotlight = spotlightQueue[spotlightIndex] || spotlightQueue[0];
    const topRef = useRef<HTMLDivElement>(null);

    // Scroll to top when spotlight changes manually
    const handleCameraSelect = (item: any) => {
        const index = spotlightQueue.indexOf(item);
        if (index !== -1) {
            setSpotlightIndex(index);
            // Smooth scroll to player
            topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // PTZ Continuous Movement Logic
    const ptzIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const startPtzMove = (axis: 'pan' | 'tilt' | 'zoom', val: number) => {
        // Immediate move
        handlePtz(axis, val);
        // Continuous move
        ptzIntervalRef.current = setInterval(() => {
            handlePtz(axis, val);
        }, 100);
    };

    const stopPtzMove = () => {
        if (ptzIntervalRef.current) {
            clearInterval(ptzIntervalRef.current);
            ptzIntervalRef.current = null;
        }
    };

    // Mock PTZ Handlers
    const handlePtz = (axis: 'pan' | 'tilt' | 'zoom', val: number) => {
        setPtzState(prev => {
            let newValue = prev[axis] + val;
            if (axis === 'zoom') {
                newValue = Math.max(0.5, Math.min(3, newValue)); // Clamp zoom between 0.5x and 3x
            } else {
                newValue = Math.max(-100, Math.min(100, newValue)); // Clamp pan/tilt
            }
            return { ...prev, [axis]: newValue };
        });
    };

    // Swipe Logic for Camera Switching (Top Area)
    const handleCameraSwipe = (e: any, { offset, velocity }: any) => {
        const swipe = Math.abs(offset.x) * velocity.x;
        if (swipe < -10000) {
            // Swipe Left -> Next Camera
            setSpotlightIndex(prev => (prev + 1) % spotlightQueue.length);
        } else if (swipe > 10000) {
            // Swipe Right -> Prev Camera
            setSpotlightIndex(prev => (prev - 1 + spotlightQueue.length) % spotlightQueue.length);
        }
    };

    // Swipe Logic for Tab Switching (Bottom/List Area)
    const tabs = ['ALL', 'CAMERA', 'CROP', 'LIVESTOCK', 'MACHINERY', 'LABOR'];
    const handleTabSwipe = (e: any, { offset, velocity }: any) => {
        const swipe = Math.abs(offset.x) * velocity.x;
        const currentIndex = tabs.indexOf(activeTab);

        if (swipe < -10000) {
            // Swipe Left -> Next Tab
            const nextIndex = (currentIndex + 1) % tabs.length;
            setActiveTab(tabs[nextIndex]);
            setSpotlightIndex(0);
        } else if (swipe > 10000) {
            // Swipe Right -> Prev Tab
            const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            setActiveTab(tabs[prevIndex]);
            setSpotlightIndex(0);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-4 lg:p-6 pb-20 space-y-6" ref={topRef}>

            {/* Add Asset Modal */}
            {showAddModal && farmId && (
                <AddAssetModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    farmId={farmId}
                    onSuccess={() => {
                        setShowAddModal(false);
                        // Trigger immediate refresh? Effect will pick it up on next interval or we can refetch.
                        // Ideally call fetchData() but it is inside useEffect. 
                        // We can force re-render or let polling handle it. Best is let polling handle it for simplicity safely.
                    }}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
                        Smart Command Center
                    </h1>
                    <p className="text-slate-400 text-sm">Real-time centralized monitoring with AI-Predictive Analytics</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Add Camera Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 text-xs uppercase tracking-wider"
                    >
                        <Camera className="w-4 h-4" />
                        Add Camera
                    </button>

                    {/* Tabs */}
                    <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSpotlightIndex(0); }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-140px)]">

                {/* Left Column: Spotlight (8/12 width) */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                    {/* Advanced Player - Swipeable for Camera Switch */}
                    <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl group min-h-[500px] flex flex-col touch-pan-y">
                        <motion.div
                            className="absolute inset-0 z-0"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={handleCameraSwipe}
                        />

                        <AnimatePresence mode='wait'>
                            {currentSpotlight && (
                                <motion.div
                                    key={currentSpotlight.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full h-full relative z-10 pointer-events-none" // pointer-events-none to let drag pass through, re-enable for controls
                                >
                                    {/* Video/Image Feed */}
                                    <div className={`w-full h-full relative overflow-hidden ${thermalMode ? 'grayscale contrast-125 brightness-75 sepia' : ''}`}>
                                        <motion.div
                                            animate={{
                                                scale: ptzState.zoom,
                                                x: ptzState.pan,
                                                y: ptzState.tilt
                                            }}
                                            transition={{ type: "spring", stiffness: 100 }}
                                            className="w-full h-full"
                                        >
                                            {/* Unified Video Player Logic */}
                                            {(() => {
                                                const url = currentSpotlight.imageUrl;

                                                // 1. Check for RTSP (Protocol Check)
                                                if (url && url.trim().startsWith('rtsp://')) {
                                                    return (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white border-2 border-slate-800 rounded-lg">
                                                            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 border border-slate-800 shadow-xl animate-pulse">
                                                                <Video className="w-6 h-6 text-orange-500" />
                                                            </div>
                                                            <h3 className="font-bold text-base mb-1">RTSP Stream Detected</h3>
                                                            <p className="text-[10px] text-slate-500 mb-4 text-center max-w-xs font-mono break-all px-4 bg-black/50 py-1 rounded">
                                                                {url}
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => navigator.clipboard.writeText(url)}
                                                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded border border-white/10 transition-colors"
                                                                >
                                                                    Copy URL
                                                                </button>
                                                                <a
                                                                    href={url}
                                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded shadow-lg shadow-blue-500/20 transition-colors"
                                                                >
                                                                    Open Stream
                                                                </a>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // 2. Check for Valid HTTP Stream (Iframe Candidate)
                                                // If it's http/https and NOT an image extension, treat as stream
                                                const isStreamConfig = url && (url.startsWith('http') || url.startsWith('/'))
                                                    && !url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)
                                                    && !url.includes('action=stream'); // MJPEG is usually handled better by IMG tag

                                                if (isStreamConfig) {
                                                    return (
                                                        <iframe
                                                            src={url}
                                                            className="w-full h-full border-0 pointer-events-auto bg-black"
                                                            title="Live Feed"
                                                            allowFullScreen
                                                            onError={(e) => {
                                                                // Hide iframe and show error? iframe onerror is unreliable.
                                                                // relying on visual 'blank' if it fails, or fallback.
                                                            }}
                                                        />
                                                    );
                                                }

                                                // 3. Fallback to Image (MJPEG or Snapshot) or Placeholder
                                                // If URL exists, try to show it. If it fails, show "Signal Lost"
                                                if (url && url.length > 5) {
                                                    return (
                                                        <div className="relative w-full h-full">
                                                            <Image
                                                                src={url}
                                                                alt="Live Feed"
                                                                fill
                                                                className="object-cover"
                                                                onError={(e) => {
                                                                    // Handle error gracefully or hide
                                                                }}
                                                                unoptimized
                                                            />
                                                        </div>
                                                    );
                                                }

                                                // 4. No URL Configured -> Signal Lost State
                                                return (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 text-slate-600">
                                                        <div className="w-20 h-20 border-2 border-dashed border-slate-700/50 rounded-full flex items-center justify-center mb-2">
                                                            <Wifi className="w-8 h-8 opacity-20" />
                                                        </div>
                                                        <span className="text-xs font-mono tracking-widest uppercase text-slate-700">Signal Lost</span>
                                                        <span className="text-[10px] text-slate-800 mt-1">Check Connection or URL</span>
                                                    </div>
                                                );
                                            })()}
                                        </motion.div>

                                        {/* AI Overlay Layer */}
                                        {showAiOverlay && (
                                            <div className="absolute inset-0 pointer-events-none">
                                                {/* Mock Bounding Box */}
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                                                    className="absolute top-[30%] left-[40%] w-[20%] h-[30%] border-2 border-green-500/80 bg-green-500/10 rounded-lg"
                                                >
                                                    <div className="absolute -top-6 left-0 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                        Person (98%)
                                                    </div>
                                                </motion.div>
                                            </div>
                                        )}

                                        {/* Playback Overlay (Rewind) */}
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pointer-events-auto flex flex-col gap-4">
                                            {/* Top Control Row */}
                                            <div className="flex justify-between items-end">
                                                {/* Metrics Overlay (Moved to bottom left properly) */}
                                                <div className="max-w-md">
                                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                                        {currentSpotlight.name}
                                                        <a
                                                            href={currentSpotlight.contextLink}
                                                            className="text-[10px] bg-white/10 hover:bg-blue-600 text-white px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 transition-colors no-underline"
                                                        >
                                                            {currentSpotlight.contextLabel} <ArrowRight size={10} />
                                                        </a>
                                                    </h2>
                                                    <div className="flex gap-4 mt-2">
                                                        <div className="space-y-0.5">
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                                                            <p className={`font-mono text-sm font-bold ${currentSpotlight.status === 'ALERT' ? 'text-red-400' : 'text-green-400'}`}>{currentSpotlight.status}</p>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Prediction</span>
                                                            <p className="font-mono text-white text-sm">Anomaly: 12%</p>
                                                        </div>
                                                        {(currentSpotlight.value || currentSpotlight.activity) && (
                                                            <div className="space-y-0.5">
                                                                <span className="text-[10px] text-slate-400 uppercase font-bold">Telemetry</span>
                                                                <p className="text-sm text-white font-mono">{currentSpotlight.value || currentSpotlight.activity}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timeline Scrubber */}
                                            <div className="w-full flex items-center gap-3">
                                                <button className="text-white hover:text-blue-400"><RotateCcw size={16} /></button>
                                                <div className="flex-1 h-10 relative bg-white/10 rounded-lg overflow-hidden cursor-pointer group/timeline">
                                                    {/* Mock timeline content */}
                                                    <div className="absolute inset-y-0 left-0 w-[85%] bg-blue-600/20" /> {/* Played */}
                                                    <div className="absolute inset-y-0 left-[20%] w-[2%] bg-red-500/50" /> {/* Event Marker */}
                                                    <div className="absolute inset-y-0 left-[60%] w-[1%] bg-green-500/50" /> {/* Event Marker */}
                                                    <div className="absolute inset-y-0 left-[85%] w-0.5 bg-white h-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" /> {/* Cursor */}
                                                    <div className="absolute top-1 right-2 text-[10px] text-white/50 font-mono">LIVE</div>
                                                </div>
                                                <button className="text-white hover:text-blue-400"><History size={16} /></button>
                                            </div>
                                        </div>

                                        {/* Zones Layer */}
                                        {showZones && (
                                            <div className="absolute inset-0 pointer-events-none opacity-30">
                                                <div className="absolute inset-0 border-4 border-red-500/50 m-12 rounded-xl bg-red-500/5" />
                                                <div className="absolute top-12 left-12 text-red-500 font-bold p-2">RESTRICTED ZONE</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Top Controls Bar */}
                                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)] ${currentSpotlight.status === 'ALERT' ? 'bg-red-500' : 'bg-green-500'}`} />
                                            <div>
                                                <span className="text-white text-xs font-bold tracking-wider block">LIVE • {currentSpotlight.name}</span>
                                                <span className="text-slate-400 text-[10px] uppercase font-mono">{currentSpotlight.camId || 'CAM-01'} • 30FPS • 4K</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setThermalMode(!thermalMode)}
                                                className={`p-2 rounded-lg backdrop-blur-md border ${thermalMode ? 'bg-orange-500 text-white border-orange-400' : 'bg-black/40 text-slate-300 border-white/10'}`}
                                            >
                                                <Zap size={16} />
                                            </button>
                                            <button
                                                onClick={() => setShowZones(!showZones)}
                                                className={`p-2 rounded-lg backdrop-blur-md border ${showZones ? 'bg-red-500 text-white border-red-400' : 'bg-black/40 text-slate-300 border-white/10'}`}
                                            >
                                                <Shield size={16} />
                                            </button>
                                            <button
                                                onClick={() => setShowAiOverlay(!showAiOverlay)}
                                                className={`p-2 rounded-lg backdrop-blur-md border ${showAiOverlay ? 'bg-green-500 text-white border-green-400' : 'bg-black/40 text-slate-300 border-white/10'}`}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* PTZ Controls Overlay (Bottom Right) - Smaller & Continuous Press */}
                                    {currentSpotlight.hasPTZ && (
                                        <div className="absolute bottom-24 right-6 flex flex-col gap-2 z-20 pointer-events-auto">
                                            <div className="bg-black/60 backdrop-blur-lg p-2 rounded-2xl border border-white/10 flex flex-col items-center gap-1.5 shadow-xl">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">PTZ</span>
                                                <div className="grid grid-cols-3 gap-1">
                                                    <div />
                                                    <button onPointerDown={() => startPtzMove('tilt', -10)} onPointerUp={stopPtzMove} onPointerLeave={stopPtzMove} className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md active:bg-blue-500 transition-colors"><Move size={12} className="rotate-180" /></button>
                                                    <div />
                                                    <button onPointerDown={() => startPtzMove('pan', -10)} onPointerUp={stopPtzMove} onPointerLeave={stopPtzMove} className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md active:bg-blue-500 transition-colors"><Move size={12} className="-rotate-90" /></button>
                                                    <button onClick={() => setPtzState({ pan: 0, tilt: 0, zoom: 1 })} className="w-7 h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-md text-white shadow"><Crosshair size={12} /></button>
                                                    <button onPointerDown={() => startPtzMove('pan', 10)} onPointerUp={stopPtzMove} onPointerLeave={stopPtzMove} className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md active:bg-blue-500 transition-colors"><Move size={12} className="rotate-90" /></button>
                                                    <div />
                                                    <button onPointerDown={() => startPtzMove('tilt', 10)} onPointerUp={stopPtzMove} onPointerLeave={stopPtzMove} className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md active:bg-blue-500 transition-colors"><Move size={12} /></button>
                                                    <div />
                                                </div>
                                                <div className="flex gap-1 w-full mt-1 pt-1.5 border-t border-white/10">
                                                    <button onPointerDown={() => startPtzMove('zoom', 0.1)} onPointerUp={stopPtzMove} onPointerLeave={stopPtzMove} className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center active:bg-blue-500 transition-colors"><ZoomIn size={12} /></button>
                                                    <button onPointerDown={() => startPtzMove('zoom', -0.1)} onPointerUp={stopPtzMove} onPointerLeave={stopPtzMove} className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center active:bg-blue-500 transition-colors"><ZoomOut size={12} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Camera List & Events (4/12 width) - Swipeable for Tabs */}
                <motion.div
                    className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden touch-pan-y"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleTabSwipe}
                >

                    {/* Camera List */}
                    <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-4 flex flex-col gap-3 h-1/2 overflow-y-auto custom-scrollbar">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 sticky top-0 bg-slate-900 py-2 z-10 flex justify-between">
                            <span>Connected Cameras ({filteredItems.length})</span>
                            <Grid className="w-4 h-4" />
                        </h3>
                        {filteredItems.map((item, idx) => (
                            <div
                                key={item.id}
                                onClick={() => handleCameraSelect(item)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-3 ${currentSpotlight?.id === item.id
                                    ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)] ring-1 ring-blue-400/50'
                                    : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
                                    }`}
                            >
                                <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                                    <Image
                                        src={item.imageUrl || "https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=200"}
                                        alt={item.name}
                                        fill
                                        className="object-cover opacity-70"
                                        unoptimized
                                    />
                                    <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${item.status === 'ALERT' ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                                    <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                                        <span className="flex items-center gap-1">{getIconForType(item.type, "w-3 h-3")} {item.type}</span>
                                        {item.hasPTZ && <span className="text-blue-400 font-bold px-1 bg-blue-500/10 rounded">360°</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detected Events Timeline */}
                    <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-4 flex flex-col gap-3 h-1/2 overflow-hidden">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <History className="w-4 h-4" /> Notable Events
                            </h3>
                            <button className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/20">View All</button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                            {snapshots.map((snap) => (
                                <div key={snap.id} className="relative pl-4 border-l-2 border-slate-800 hover:border-blue-500 transition-colors group cursor-pointer">
                                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-500 transition-colors" />
                                    <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-white">{snap.label}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{snap.time}</span>
                                        </div>
                                        <div className="w-full h-20 rounded-lg overflow-hidden mt-2 relative">
                                            <Image
                                                src={snap.src}
                                                alt={snap.label}
                                                fill
                                                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                            <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[8px] text-white">00:15</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </motion.div>
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
        case 'LIVESTOCK': return <Wifi className={className} />;
        case 'LABOR': return <Users className={className} />;
        default: return <Activity className={className} />;
    }
}
