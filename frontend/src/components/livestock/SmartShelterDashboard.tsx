'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import {
    Camera, Video, Wifi, Thermometer, Droplets, Wind,
    AlertTriangle, Lightbulb, Activity, Volume2,
    Settings, Battery, Signal, CloudLightning
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock video loop for demo purposes (Cows grazing/barn interior)
const DEMO_VIDEO_URL = "https://cdn.coverr.co/videos/coverr-cow-eating-grass-in-the-field-5287/1080p.mp4";

interface SmartShelterDashboardProps {
    housingId: number;
    housingName: string;
    onClose: () => void;
}

export function SmartShelterDashboard({ housingId, housingName, onClose }: SmartShelterDashboardProps) {
    const [devices, setDevices] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [telemetry, setTelemetry] = useState<any>({
        temperature: 24.5,
        humidity: 65,
        ammonia_level: 12,
        co2_level: 450,
        noise_level: 45
    });
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isStreaming, setIsStreaming] = useState(true);

    // Controls State
    const [lightsOn, setLightsOn] = useState(true);
    const [statsExpanded, setStatsExpanded] = useState(false);

    // Fetch Initial Data
    useEffect(() => {
        loadDevices();

        // Simulating Real-time telemetry updates
        const interval = setInterval(() => {
            setTelemetry((prev: any) => ({
                temperature: prev.temperature + (Math.random() - 0.5),
                humidity: Math.min(100, Math.max(0, prev.humidity + (Math.random() - 0.5) * 2)),
                ammonia_level: Math.max(0, prev.ammonia_level + (Math.random() - 0.5) * 0.5),
                co2_level: prev.co2_level + (Math.random() * 10 - 5),
                noise_level: Math.random() > 0.9 ? 75 : 45 + Math.random() * 5 // Random spikes
            }));

            // Randomly trigger alerts
            if (Math.random() > 0.95) {
                addSimulatedAlert();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const loadDevices = async () => {
        try {
            const data = await api.livestock.smart.getDevices(housingId);
            setDevices((data as any[]) || []);
        } catch (e) {
            console.error(e);
        }
    };

    const loadSuggestions = async () => {
        try {
            const data = await api.livestock.smart.getSuggestions(housingId);
            setSuggestions((data as any[]) || []);
        } catch (e) {
            console.error("Failed to load suggestions", e);
        }
    };

    const handleAction = async (action: string, label: string) => {
        // Toggle logic (mock)
        if (label === "Main Lights") setLightsOn(!lightsOn);

        // Log the action to learn pattern
        try {
            const deviceId = devices.length > 0 ? devices[0].id : 1;
            await api.livestock.smart.logAction(deviceId, action, `User toggled ${label}`);
            console.log("Action logged:", action);
        } catch (e) {
            console.error(e);
        }
    };

    const addSimulatedAlert = () => {
        const newAlert = {
            id: Date.now(),
            alert_type: Math.random() > 0.5 ? "MOTION" : "SOUND",
            message: Math.random() > 0.5 ? "Motion detected near Entrance A" : "Unusual noise level detected",
            severity: "WARNING",
            timestamp: new Date().toISOString()
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 5));

        // Auto-dismiss toast
        setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
        }, 5000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors font-mono text-xs text-slate-400">
                        ESC
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Wifi className="w-6 h-6 text-green-400 animate-pulse" />
                            Smart Monitor: {housingName}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> System Online</span>
                            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Live Telemetry</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20">
                        <Settings className="w-4 h-4" /> Configure Devices
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">

                {/* Left Column: Video Feed */}
                <div className="col-span-12 lg:col-span-9 flex flex-col gap-6 h-full">
                    <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 flex-1 group">

                        {/* Video Layer */}
                        <video
                            src={DEMO_VIDEO_URL}
                            autoPlay muted loop playsInline
                            className="w-full h-full object-cover opacity-80"
                        />

                        {/* HUD Overlay */}
                        <div className="absolute inset-x-0 top-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                                <span className="text-red-500 font-mono font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live Feed • CAM-01
                                </span>
                                <span className="text-white/60 text-xs font-mono">{new Date().toLocaleTimeString()}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="bg-black/50 text-white px-2 py-1 rounded text-xs border border-white/10">1080p</span>
                                <span className="bg-black/50 text-white px-2 py-1 rounded text-xs border border-white/10">30 FPS</span>
                            </div>
                        </div>

                        {/* Motion Detection Bounding Box Simulation */}
                        <div className="absolute top-1/2 left-1/3 w-32 h-32 border-2 border-dashed border-yellow-500/50 rounded-lg animate-pulse pointer-events-none" />

                        {/* Alert Overlay */}
                        <AnimatePresence>
                            {alerts.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="absolute bottom-6 left-6 right-6"
                                >
                                    <div className="bg-red-500/90 text-white p-4 rounded-xl backdrop-blur-md border border-red-400/50 shadow-xl flex items-center gap-4 max-w-lg">
                                        <AlertTriangle className="w-8 h-8 animate-bounce" />
                                        <div>
                                            <h4 className="font-bold text-lg">Alert Detected</h4>
                                            <p className="text-white/90">{alerts[0].message}</p>
                                        </div>
                                        <button className="ml-auto bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm">Dismiss</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Quick Camera Grid */}
                    <div className="h-32 grid grid-cols-4 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-slate-900 rounded-xl border border-white/5 overflow-hidden relative cursor-pointer hover:border-blue-500/50 transition-colors">
                                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                                    <Camera className="w-6 h-6" />
                                </div>
                                <div className="absolute bottom-2 left-2 text-xs text-slate-400 font-mono">CAM-0{i + 1} <span className="text-red-500">● Live</span></div>
                            </div>
                        ))}
                        <div className="bg-slate-900/50 rounded-xl border border-white/5 border-dashed flex items-center justify-center text-slate-500 hover:text-white cursor-pointer transition-colors">
                            <div className="text-center">
                                <h4 className="text-sm font-semibold">+ Add Camera</h4>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sensors & Controls */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar">

                    {/* Environmental Card */}
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-white/5 space-y-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <CloudLightning className="w-4 h-4 text-blue-400" /> Environment
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <SensorMetric
                                icon={<Thermometer className="w-4 h-4 text-orange-400" />}
                                label="Temp"
                                value={`${telemetry.temperature.toFixed(1)}°C`}
                            />
                            <SensorMetric
                                icon={<Droplets className="w-4 h-4 text-blue-400" />}
                                label="Humidity"
                                value={`${telemetry.humidity.toFixed(0)}%`}
                            />
                            <SensorMetric
                                icon={<Activity className="w-4 h-4 text-purple-400" />}
                                label="Ammonia"
                                value={`${telemetry.ammonia_level.toFixed(1)} ppm`}
                                isWarning={telemetry.ammonia_level > 20}
                            />
                            <SensorMetric
                                icon={<Wind className="w-4 h-4 text-green-400" />}
                                label="CO2"
                                value={`${telemetry.co2_level.toFixed(0)} ppm`}
                            />
                        </div>

                        {/* Noise Level */}
                        <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Volume2 className="w-4 h-4" /> Noise Level
                                </div>
                                <span className={`text-sm font-mono font-bold ${telemetry.noise_level > 70 ? 'text-red-400' : 'text-slate-200'}`}>
                                    {telemetry.noise_level.toFixed(0)} dB
                                </span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${telemetry.noise_level > 70 ? 'bg-red-500' : 'bg-green-500'}`}
                                    animate={{ width: `${Math.min(100, telemetry.noise_level)}%` }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Smart Controls */}
                    <div className="bg-slate-900/80 p-5 rounded-2xl border border-white/5 space-y-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Settings className="w-4 h-4 text-yellow-400" /> Automation
                        </h3>

                        {/* Smart Suggestions Block */}
                        {suggestions.length > 0 && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl mb-2">
                                <h4 className="text-xs font-bold text-indigo-300 uppercase mb-2 flex items-center gap-1">
                                    <Lightbulb className="w-3 h-3" /> Smart Suggestion
                                </h4>
                                <div className="space-y-2">
                                    {suggestions.map((s, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-indigo-200/80 p-2 bg-indigo-500/10 rounded-lg">
                                            <span>💡</span>
                                            <div>
                                                <p className="font-medium">{s.message}</p>
                                                <button
                                                    onClick={() => handleAction(s.action, "Suggestion")}
                                                    className="mt-1 text-[10px] bg-indigo-500 hover:bg-indigo-400 text-white px-2 py-0.5 rounded transition-colors"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <ControlSwitch
                            label="Main Lights"
                            isOn={lightsOn}
                            onToggle={() => handleAction(lightsOn ? "TURN_OFF" : "TURN_ON", "Main Lights")}
                            icon={<Lightbulb className={`w-4 h-4 ${lightsOn ? 'text-yellow-400' : 'text-slate-500'}`} />}
                        />
                        <ControlSwitch
                            label="Ventilation Fans"
                            isOn={true}
                            onToggle={() => handleAction("TOGGLE", "Ventilation Fans")}
                            icon={<Wind className="w-4 h-4 text-blue-400" />}
                        />
                        <ControlSwitch
                            label="Auto Feeder"
                            isOn={false}
                            onToggle={() => handleAction("TOGGLE", "Auto Feeder")}
                            icon={<Activity className="w-4 h-4 text-green-400" />}
                        />
                    </div>

                    {/* Device Status */}
                    <div className="mt-auto bg-slate-900/50 p-4 rounded-xl border border-white/5">
                        <h4 className="text-slate-400 text-xs font-bold uppercase mb-3">Device Health</h4>
                        <div className="space-y-2">
                            <DeviceHealthRow name="Cam-01 Main" battery={9} signal={4} status="Online" />
                            <DeviceHealthRow name="Env Sensor Hub" battery={6} signal={3} status="Online" />
                            <DeviceHealthRow name="Smart Valve A" battery={2} signal={4} status="Low Battery" isWarning />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Subcomponents for cleaner code
function SensorMetric({ icon, label, value, isWarning = false }: any) {
    return (
        <div className={`p-3 rounded-xl border transition-colors ${isWarning ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-950/50 border-white/5 hover:bg-slate-800'}`}>
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className={`text-xs ${isWarning ? 'text-red-300' : 'text-slate-400'}`}>{label}</span>
            </div>
            <div className={`text-lg font-mono font-semibold ${isWarning ? 'text-red-400' : 'text-white'}`}>{value}</div>
        </div>
    );
}

function ControlSwitch({ label, isOn, onToggle, icon }: any) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isOn ? 'bg-white/10' : 'bg-transparent'}`}>
                    {icon}
                </div>
                <span className="text-sm text-slate-300 font-medium">{label}</span>
            </div>
            <button
                onClick={onToggle}
                className={`w-12 h-6 rounded-full relative transition-colors ${isOn ? 'bg-green-500' : 'bg-slate-700'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOn ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}

function DeviceHealthRow({ name, battery, signal, status, isWarning }: any) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{name}</span>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-slate-500" title="Signal Strength">
                    <Signal className="w-3 h-3" />
                </div>
                <div className={`flex items-center gap-1 ${isWarning ? 'text-red-400' : 'text-green-400'}`} title="Battery">
                    <Battery className="w-3 h-3" />
                </div>
                <span className={`px-1.5 py-0.5 rounded ${isWarning ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {status}
                </span>
            </div>
        </div>
    );
}
