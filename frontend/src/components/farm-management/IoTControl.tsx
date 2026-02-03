import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { SignalIndicator } from '@/components/iot/SignalIndicator';
import { Wifi, Activity, Droplets, Power, Gauge, Zap, Waves, AlertTriangle } from 'lucide-react';
import { Link } from '@/navigation';

export const IoTControl: React.FC = () => {
    const t = useTranslations('FarmManagement');
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Derived state
    const [mainPump, setMainPump] = useState<any>(null);
    const [valves, setValves] = useState<any[]>([]);

    // Simulated Sensor Data (bind to assets later)
    const [pressure, setPressure] = useState(0);
    const [flowRate, setFlowRate] = useState(0);
    const [soilMoisture, setSoilMoisture] = useState(42);
    const [temperature, setTemperature] = useState(28);

    const loadAssets = async () => {
        try {
            // Using ID 1 as default for demo/pair-programming context
            // In production, this comes from the active farm context
            const allAssets = await api.farmManagement.getAssets(1) as any[];

            // Filter for IoT enabled assets relevant to irrigation
            const irrigationAssets = allAssets.filter((item: any) =>
                item.is_iot_enabled &&
                ['Valve', 'Pump', 'Sprinkler', 'DripSystem', 'Sensor'].includes(item.asset_type)
            );

            setAssets(irrigationAssets);

            // Identify Main Pump (first pump found)
            const pump = irrigationAssets.find((a: any) => a.asset_type === 'Pump');
            setMainPump(pump || null);

            // Identify Valves
            const vs = irrigationAssets.filter((a: any) => a.asset_type === 'Valve');
            setValves(vs);

        } catch (error) {
            console.error("Failed to load IoT assets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssets();
    }, []);

    // Simulate Sensor Jitter if Pump is "Running" (mock status for now)
    const isPumpRunning = mainPump?.status === 'Active' || mainPump?.status === 'Running';

    useEffect(() => {
        const interval = setInterval(() => {
            if (isPumpRunning) {
                setPressure(prev => 40 + Math.floor(Math.random() * 10));
                setFlowRate(prev => 115 + Math.floor(Math.random() * 15));
                setSoilMoisture(prev => Math.min(prev + 0.5, 90));
            } else {
                setPressure(0);
                setFlowRate(0);
                setSoilMoisture(prev => Math.max(prev - 0.1, 42));
            }
            setTemperature(27 + Math.random() * 2);
        }, 2000);
        return () => clearInterval(interval);
    }, [isPumpRunning]);

    return (
        <Card className="w-full bg-slate-900 border-slate-800 text-white overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 relative z-10">
                <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Zap className="w-5 h-5 text-amber-500" />
                        {/* {t('iot_title')} */} Smart Irrigation Control
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-1">Real-time pump & valve management</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-white/5 mt-2 md:mt-0">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-slate-400">Live Monitoring</span>
                    </div>
                    <div className="w-px h-4 bg-white/10"></div>
                    <Wifi className="w-4 h-4 text-green-400" />
                    <SignalIndicator strength={4} showLabel={false} className="h-3" />
                </div>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Main Pump Monitor */}
                    <div className="lg:col-span-3 bg-slate-950/50 rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                        {/* Status Glow */}
                        <div className={`absolute inset-0 bg-gradient-to-b ${isPumpRunning ? 'from-green-500/10 to-transparent' : 'from-red-500/5 to-transparent'} transition-colors duration-500`}></div>

                        <div className="relative z-10 text-center space-y-6 w-full max-w-sm">
                            <div className="relative mx-auto">
                                {/* Pulse Effect when active */}
                                {isPumpRunning && <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></div>}
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isPumpRunning ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>
                                    <Power className="w-10 h-10" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">
                                    {mainPump ? mainPump.name : "No Pump Configured"}
                                </h3>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isPumpRunning ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {isPumpRunning ? (t('pump_status_running') || "Running") : (t('pump_status_off') || "Switched Off")}
                                </div>
                            </div>

                            {!mainPump && (
                                <div className="text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg">
                                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                                    Add a Pump in Management Tab to see it here.
                                </div>
                            )}
                        </div>

                        {/* Metrics Mini-Row */}
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-white/5 py-3 px-6 flex justify-around text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> {isPumpRunning ? '240V' : '0V'}</span>
                            <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-blue-500" /> {isPumpRunning ? '1450 RPM' : '0 RPM'}</span>
                        </div>
                    </div>

                    {/* Right Column: Valves & Sensors */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Valve Status Panel */}
                        <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 h-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <Waves className="w-4 h-4 text-blue-400" /> Valve Status
                                </h3>
                                <Link href="/devices" className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors">
                                    Manage & Control
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 gap-3 min-h-[200px] content-start">
                                {loading && <div className="col-span-2 text-center text-slate-500 text-xs py-10">Loading assets...</div>}

                                {!loading && valves.length === 0 && (
                                    <div className="col-span-2 flex flex-col items-center justify-center py-8 text-slate-500 gap-2 border border-dashed border-slate-800 rounded-xl">
                                        <Waves className="w-8 h-8 opacity-20" />
                                        <span className="text-xs">No Smart Valves Found</span>
                                    </div>
                                )}

                                {valves.map((valve) => (
                                    <ValveStatusCard
                                        key={valve.id}
                                        label={valve.name}
                                        isOn={valve.status === 'Active'}
                                        sensors={valve.iot_settings?.sensors || []}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Live Sensors Panel */}
                        <div className="bg-slate-900/50 rounded-2xl p-5 border border-white/5">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Live Sensors</h3>
                            <div className="space-y-4">
                                {/* Soil Moisture */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-300">Soil Moisture {valves.some(v => v.status === 'Active') && <span className="text-blue-400 animate-pulse">(Rising)</span>}</span>
                                        <span className="font-bold text-blue-400">{soilMoisture.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${soilMoisture}%` }} />
                                    </div>
                                </div>

                                {/* Temperature */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-300">Temperature</span>
                                        <span className="font-bold text-orange-400">{temperature.toFixed(1)}°C</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${(temperature / 50) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

interface ValveStatusCardProps {
    label: string;
    isOn: boolean;
    sensors?: string[];
}

function ValveStatusCard({ label, isOn, sensors = [] }: ValveStatusCardProps) {
    return (
        <div className="bg-slate-900 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 group relative">

            {/* Sensor Indicators */}
            {sensors.length > 0 && (
                <div className="absolute top-2 right-2 flex gap-1">
                    {sensors.includes('Flow Meter') && <Droplets className="w-3 h-3 text-blue-400" />}
                    {sensors.includes('Pressure Gauge') && <Gauge className="w-3 h-3 text-amber-400" />}
                    {sensors.includes('Soil Moisture') && <Waves className="w-3 h-3 text-green-400" />}
                </div>
            )}

            <div className={`w-3 h-3 rounded-full mb-1 shadow-lg transition-all duration-500 ${isOn ? 'bg-green-500 shadow-green-500/50 animate-pulse' : 'bg-red-500 shadow-red-500/20'}`}></div>

            <span className="font-bold text-xs text-slate-300 group-hover:text-white transition-colors text-center truncate w-full">{label}</span>

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isOn ? <span className="text-green-400">Active</span> : 'Idle'}
            </span>
        </div>
    );
}
