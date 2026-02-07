import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { format } from "date-fns";
import { Loader2, ArrowRight, Plus, Pencil, Trash2, X, Save, Clock, Settings, ArrowUpRight } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement
);

interface CropDashboardProps {
    cropCycle: any;
    onClose: () => void;
    visibleMetrics?: string[];
    onUpdateMetrics?: (metrics: string[]) => void;
}

export const CropAnalyticsDashboard: React.FC<CropDashboardProps> = ({ cropCycle, onClose, visibleMetrics: initialVisibleMetrics, onUpdateMetrics }) => {
    const t = useTranslations('Crops');
    const defaultMetrics = ['Water Usage', 'Financials', 'Soil Health', 'Machinery', 'Timeline', 'Harvest Projections', 'IoT Network'];
    const activeMetrics = initialVisibleMetrics || defaultMetrics;

    // Local state for configuration mode
    const [isConfiguring, setIsConfiguring] = useState(false);

    // Edit/Add State
    const [editingItem, setEditingItem] = useState<{ type: 'machinery' | 'valve', id?: number, data?: any } | null>(null);

    // If onUpdateMetrics is not provided, we can't really edit, so hide the button or handle locally
    const canEdit = !!onUpdateMetrics;

    const [stats, setStats] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // State for Link Valve Modal
    const [showValveSelector, setShowValveSelector] = useState(false);
    const [availableValves, setAvailableValves] = useState<any[]>([]);

    const fetchAnalyticsData = async (silent = false) => {
        if (!cropCycle) return;
        if (!silent) setLoading(true);

        try {
            const farmId = cropCycle.farm_id || 1;

            // 1. Fetch Timeline
            const eventsReq = api.farmManagement.getTimeline(cropCycle.id);
            // 2. Fetch Assets with cache bust for polling
            const assetsReq = api.farmManagement.getAssets(farmId, { forceRefresh: silent });
            // 3. Fetch Financials
            const financialsReq = api.farmManagement.getFinancials(farmId);

            const [events, assets, financials] = await Promise.all([eventsReq, assetsReq, financialsReq]) as [any[], any[], any];

            // Filter Assets
            const machines = assets.filter((a: any) => !a.is_iot_enabled && a.asset_type !== 'Valve');

            // IoT Enabled devices (Sensors) - assuming assets with is_iot_enabled=true AND not 'Valve' are sensors/others
            // OR we can fetch from api.iot.getDevices() but that is global. 
            // Better to rely on "linked" assets here if possible. 
            // For now, if no linked sensors, show empty.
            const sensors = assets.filter((a: any) => a.is_iot_enabled && a.asset_type !== 'Valve');

            // User requested ONLY valves in this list. 
            const valves = assets.filter((a: any) => a.asset_type === 'Valve');

            setTimeline(events || []);

            // 3. Set Stats (REAL DATA ONLY)
            setStats({
                waterUsageLitres: financials?.water_usage || 0,
                fertilizerCost: financials?.cost_breakdown?.fertilizer || 0,
                laborCost: financials?.cost_breakdown?.labor || 0,
                projectedYieldKg: cropCycle.estimated_yield || 0,

                // For trends, we ideally need a historical API. 
                // Since we don't have one readily available in the context, we return empty structure.
                // The charts should handle empty data gracefully or show "No Data".
                soilHealthTrend: [],
                moistureTrend: [],

                iotDevices: sensors.map(s => ({
                    name: s.name,
                    type: s.asset_type,
                    status: s.status,
                    battery: 'N/A', // Not in generic asset model
                    lastReading: 'No recent data' // Needs telemetry API
                })),

                valves: valves.map(v => ({
                    id: v.id,
                    name: v.name,
                    iot_device_id: v.iot_device_id, // Critical for API updates
                    lastActive: 'Unknown',
                    status: v.status || 'Idle',
                    type: v.asset_type,
                    nextSchedule: v.iot_settings?.schedule || 'Manual'
                })),
                machinery: machines.map(m => ({
                    id: m.id,
                    name: m.name,
                    type: m.asset_type,
                    status: m.status,
                    location: 'Farm',
                    usage: '0h',
                    last_maintenance: 'Unknown'
                }))
            });

        } catch (err) {
            console.error("Failed to fetch analytics details:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, [cropCycle]);

    // Polling for Real-Time Updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAnalyticsData(true);
        }, 3000);
        return () => clearInterval(interval);
    }, [cropCycle]);

    const handleSimulate = () => {
        // Just refresh real data instead of faking it
        fetchAnalyticsData(true);
    };

    const toggleValve = async (index: number) => {
        if (!stats) return;
        const valve = stats.valves[index];

        if (!valve.iot_device_id) {
            alert(t('alert_no_linked_device')); // Ensure you add this key or just use fallback text
            return;
        }

        const newStatus = valve.status === 'Active' ? 'Idle' : 'Active';

        // Optimistic Update
        const updatedValves = [...stats.valves];
        updatedValves[index] = {
            ...valve,
            status: newStatus,
            lastActive: newStatus === 'Active' ? 'Running now' : 'Just now',
            nextSchedule: newStatus === 'Active' ? 'Running Manual' : 'Stopped'
        };

        setStats((prev: any) => ({ ...prev, valves: updatedValves }));

        try {
            // Persist to DB using the IOT DEVICE ID
            await api.iot.update(valve.iot_device_id, { status: newStatus });
        } catch (error) {
            console.error("Failed to update valve status", error);
            // Revert on failure
            updatedValves[index] = valve;
            setStats((prev: any) => ({ ...prev, valves: updatedValves }));
            alert(t('failed_switch_device'));
        }
    };

    const toggleMetric = (metric: string) => {
        if (!onUpdateMetrics) return;
        if (activeMetrics.includes(metric)) {
            onUpdateMetrics(activeMetrics.filter(m => m !== metric));
        } else {
            onUpdateMetrics([...activeMetrics, metric]);
        }
    };

    // CRUD Operations
    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !stats) return;

        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData.entries());

        // Farm ID check
        const farmId = cropCycle.farm_id || 1;

        try {
            if (editingItem.type === 'machinery') {
                if (editingItem.id) {
                    await api.farmManagement.updateAsset(editingItem.id, {
                        ...data,
                        asset_type: data.type, // Map 'type' to 'asset_type'
                        farm_id: farmId
                    });
                } else {
                    await api.farmManagement.addAsset({
                        ...data,
                        asset_type: data.type || 'Machinery',
                        farm_id: farmId,
                        cost: 0,
                        purchase_date: new Date().toISOString().split('T')[0]
                    });
                }
            } else if (editingItem.type === 'valve') {
                // Per user request: Valves should be added in IoT/Irrigation control
                alert(t('go_to_smart_irrigation'));
                return;
            }

            // Refresh Local State
            const assets = await api.farmManagement.getAssets(farmId) as any[];
            const machines = assets.filter((a: any) => !a.is_iot_enabled && a.asset_type !== 'Valve');
            const valves = assets.filter((a: any) => a.is_iot_enabled || a.asset_type === 'Valve');

            setStats((prev: any) => ({
                ...prev,
                machinery: machines.map((m: any) => ({
                    id: m.id, name: m.name, type: m.asset_type, status: m.status, location: 'Farm', usage: '0h', last_maintenance: 'Unknown'
                })),
                valves: valves.map((v: any) => ({
                    id: v.id, name: v.name, lastActive: 'Unknown', status: v.status, type: v.asset_type, nextSchedule: 'Manual'
                }))
            }));
            setEditingItem(null);

        } catch (error) {
            console.error("Failed to save item", error);
            alert(t('failed_to_save'));
        }
    };

    const handleDeleteItem = async (type: 'machinery' | 'valve', id: number) => {
        if (!confirm(t('are_you_sure'))) return;
        try {
            await api.farmManagement.deleteAsset(id);
            // Refresh Local State
            setStats((prev: any) => ({
                ...prev,
                [type === 'machinery' ? 'machinery' : 'valves']: prev[type === 'machinery' ? 'machinery' : 'valves'].filter((i: any) => i.id !== id)
            }));
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    if (!cropCycle) return null;

    if (loading || !stats) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    const isPumpActive = stats.valves?.some((v: any) => v.status === 'Active');



    const handleOpenValveSelection = async () => {
        try {
            // Fetch all IoT devices
            // Note: In a real app we might filter for 'Valve' type devices specifically if the API supports it,
            // or filter client side.
            const devices = await api.iot.getDevices() as any[];
            setAvailableValves(devices);
            setShowValveSelector(true);
        } catch (error) {
            console.error("Failed to fetch devices", error);
            alert(t('failed_to_fetch_devices'));
        }
    };

    const handleSelectValve = async (device: any) => {
        if (!cropCycle) return;
        const farmId = cropCycle.farm_id || 1;

        try {
            // Create a Farm Asset that represents this IoT Device in this Farm context
            await api.farmManagement.addAsset({
                name: device.name || `Valve ${device.device_id}`,
                asset_type: 'Valve',
                farm_id: farmId,
                is_iot_enabled: true,
                iot_device_id: device.device_id, // Link to the IoT Device
                status: 'Active',
                purchase_date: new Date().toISOString().split('T')[0],
                cost: 0
            });

            // Refresh analytics
            fetchAnalyticsData(true);
            setShowValveSelector(false);
        } catch (error) {
            console.error("Failed to link valve", error);
            alert(t('failed_to_link_valve'));
        }
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-300 relative">
            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                <div>
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> {t('back_to_crops')}
                    </button>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
                        {t('analytics_title', { crop: cropCycle.registry_name || t('crop_default_name', { id: cropCycle.id }) })}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {t('cycle_id')}: <span className="font-mono text-white">#{cropCycle.id}</span> • {t('started')}: <span className="text-white">{cropCycle.sowing_date}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    {canEdit && (
                        <button
                            onClick={() => setIsConfiguring(!isConfiguring)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border ${isConfiguring ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                        >
                            {isConfiguring ? t('done_editing') : t('customize_dashboard')}
                        </button>
                    )}
                    <button
                        onClick={handleSimulate}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                        🔄 {t('simulate_sensor_update')}
                    </button>
                </div>
            </div>

            {/* Configuration Panel */}
            {isConfiguring && (
                <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-xl mb-6 animate-in slide-in-from-top-2">
                    <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-3">{t('manage_visible_widgets')}</h3>
                    <div className="flex flex-wrap gap-3">
                        {defaultMetrics.map(metric => (
                            <button
                                key={metric}
                                onClick={() => toggleMetric(metric)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${activeMetrics.includes(metric) ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-950 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                            >
                                {activeMetrics.includes(metric) ? '✓ ' : '+ '} {metric}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ROW 1: Real-time Operations (IoT, Machinery, Harvest KPI) */}
                {/* IoT Devices & Irrigation Status */}
                {activeMetrics.includes('IoT Network') && (
                    <div className="lg:col-span-1 block group">
                        <Card className="bg-slate-900 border-slate-800 h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle>{t('irrigation_iot_network')}</CardTitle>
                                {/* Main Pump Status Display */}
                                <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-bold border ${isPumpActive ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${isPumpActive ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                                    {isPumpActive ? t('pump_on') : t('pump_off')}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* VALVES SECTION */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('active_valves')}</h4>
                                            <button
                                                onClick={handleOpenValveSelection}
                                                className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 bg-green-900/20 px-2 py-1 rounded-full font-bold transition-all hover:bg-green-900/40"
                                            >
                                                <Plus className="w-3 h-3" /> {t('add_valves')}
                                            </button>
                                        </div>
                                        {/* Editing Form for Valve */}
                                        {/* Simplified editing for Linked Valves can go here if needed, but we rely on Link Logic primarily now */}

                                        {stats.valves?.map((valve: any, idx: number) => {
                                            const isActive = valve.status === 'Active';
                                            const isSuggested = valve.status === 'Suggested';

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`relative flex flex-col gap-1 p-3 rounded-lg border transition-all ${isActive ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]' :
                                                        isSuggested ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-950 border-white/5 hover:border-white/20'
                                                        }`}
                                                >
                                                    {/* Suggestion Badge */}
                                                    {isSuggested && !isActive && (
                                                        <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                                                            {t('suggested')}
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center">
                                                        <div
                                                            className="flex items-center gap-2 cursor-pointer flex-1"
                                                            onClick={() => toggleValve(idx)}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                                                            <div>
                                                                <span className={`font-bold text-sm block ${isActive ? 'text-blue-100' : 'text-slate-300'}`}>{valve.name} <span className="text-[10px] text-slate-500 font-normal">({valve.type})</span></span>
                                                                <span className="text-[10px] text-slate-500 block">{isActive ? t('flowing') + ' • 120L/min' : `${t('last')}: ${valve.lastActive}`}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {/* Interactive Toggle Switch */}
                                                            <div
                                                                className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer mr-2 ${isActive ? 'bg-blue-500' : 'bg-slate-700'}`}
                                                                onClick={() => toggleValve(idx)}
                                                            >
                                                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'left-4.5 translate-x-3.5' : 'left-0.5'}`} />
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex flex-col gap-1 opacity-10 hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleDeleteItem('valve', valve.id)} className="text-slate-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {(!stats.valves || stats.valves.length === 0) && (
                                            <div className="text-center py-4 bg-slate-950/50 rounded border border-dashed border-white/10">
                                                <p className="text-xs text-slate-500">No valves linked.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* SENSORS SECTION */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sensors</h4>
                                        {stats.iotDevices?.map((device: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${device.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    <div>
                                                        <div className="font-medium text-xs text-slate-300">{device.name}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-mono text-slate-400">{device.lastReading}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Machinery */}
                {activeMetrics.includes('Machinery') && (
                    <div className="lg:col-span-1 block group">
                        <Card className="bg-slate-900 border-slate-800 transition-all h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle>Machinery Deployed</CardTitle>
                                <button
                                    onClick={() => setEditingItem({ type: 'machinery', data: {} })}
                                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-green-400 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </CardHeader>
                            <CardContent>
                                {/* Editing Form for Machinery */}
                                {editingItem?.type === 'machinery' && (
                                    <div className="bg-slate-800 p-4 rounded-lg border border-amber-500/50 mb-4 animate-in fade-in slide-in-from-top-2 relative z-10 shadow-xl">
                                        <h4 className="text-xs font-bold text-slate-400 mb-2">{editingItem.id ? 'Edit Machinery' : 'Deploy New Machinery'}</h4>
                                        <form onSubmit={handleSaveItem} className="space-y-3">
                                            <input name="name" defaultValue={editingItem.data?.name} placeholder="Machine Name" className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-sm" required />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input name="type" defaultValue={editingItem.data?.type} placeholder="Type (Tractor, Plough...)" className="bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-xs" />
                                                <input name="status" defaultValue={editingItem.data?.status} placeholder="Status" className="bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-xs" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input name="usage" defaultValue={editingItem.data?.usage} placeholder="Usage Duration" className="bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-xs" />
                                                <input name="location" defaultValue={editingItem.data?.location} placeholder="Location" className="bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-xs" />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <button type="button" onClick={() => setEditingItem(null)} className="px-3 py-1.5 text-xs hover:bg-slate-700 rounded text-slate-300">Cancel</button>
                                                <button type="submit" className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 rounded text-white font-bold flex items-center gap-1"><Save className="w-3 h-3" /> Save Details</button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {stats.machinery?.map((machine: any, idx: number) => (
                                        <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-950 rounded-lg border border-white/5 hover:border-white/20 transition-all group/item">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 text-lg">
                                                        {machine.type === 'Drone' ? '🚁' : machine.type === 'Plough' ? '🚜' : '🚜'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm text-white">{machine.name}</div>
                                                        <div className="text-xs text-slate-500">{machine.type || 'Machinery'} • <span className={machine.status === 'In Use' ? 'text-green-400' : 'text-slate-400'}>{machine.status}</span></div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingItem({ type: 'machinery', id: machine.id, data: machine })} className="p-1.5 text-slate-500 hover:bg-slate-800 hover:text-blue-400 rounded"><Pencil className="w-3 h-3" /></button>
                                                    <button onClick={() => handleDeleteItem('machinery', machine.id)} className="p-1.5 text-slate-500 hover:bg-slate-800 hover:text-red-400 rounded"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>

                                            {/* Details Row */}
                                            <div className="flex gap-4 mt-1 pt-2 border-t border-white/5">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Used: <span className="text-slate-200">{machine.usage || 'N/A'}</span></span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                                    <Settings className="w-3 h-3" />
                                                    <span>Maint: <span className="text-slate-200">{machine.last_maintenance || 'N/A'}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats.machinery || stats.machinery.length === 0) && (
                                        <div className="text-center py-6 text-slate-500 text-xs italic">
                                            No machinery deployed. Click + to add.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Harvest Projections */}
                {activeMetrics.includes('Harvest Projections') && (
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle>Harvest Projections</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                <span className="block text-slate-400 text-sm uppercase tracking-wider">Estimated Yield</span>
                                <span className="block text-3xl font-bold text-yellow-400 mt-1">{stats.projectedYieldKg.toLocaleString()} Kg</span>
                                <span className="text-xs text-yellow-500/70">± 5% Variance</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-white/10 pt-4">
                                <span className="text-slate-400">Est. Revenue</span>
                                <span className="font-mono text-green-400">₹{(stats.projectedYieldKg * 25).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Days to Harvest</span>
                                <span className="font-mono text-white">42 Days</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ROW 2: Analytical Trends & Usage */}
                {/* Growth Trends */}
                {activeMetrics.includes('Soil Health') && (
                    <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
                        <CardHeader><CardTitle>Growth Environment Trends</CardTitle></CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <Line
                                    data={{
                                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                                        datasets: [
                                            {
                                                label: 'Soil Moisture (%)',
                                                data: stats.moistureTrend,
                                                borderColor: 'rgb(59, 130, 246)',
                                                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                                            },
                                            {
                                                label: 'Soil pH (x10)',
                                                data: stats.soilHealthTrend.map((v: number) => v * 10), // Scale for viz
                                                borderColor: 'rgb(34, 197, 94)',
                                                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { position: 'top' as const } }
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Resource Usage (Moved to side) */}
                {(activeMetrics.includes('Water Usage') || activeMetrics.includes('Financials')) && (
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle>Resource Usage</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {activeMetrics.includes('Water Usage') && (
                                <div className="flex justify-between p-3 bg-blue-500/10 rounded-lg">
                                    <span>💧 Water Consumed</span>
                                    <span className="font-bold text-blue-400">{stats.waterUsageLitres.toLocaleString()} L</span>
                                </div>
                            )}
                            {activeMetrics.includes('Financials') && (
                                <>
                                    <div className="flex justify-between p-3 bg-green-500/10 rounded-lg">
                                        <span>🌿 Fertilizer Cost</span>
                                        <span className="font-bold text-green-400">₹{stats.fertilizerCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between p-3 bg-purple-500/10 rounded-lg">
                                        <span>🚧 Labor Cost</span>
                                        <span className="font-bold text-purple-400">₹{stats.laborCost.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ROW 3: Timeline */}
                {activeMetrics.includes('Timeline') && (
                    <Card className="bg-slate-900 border-slate-800 lg:col-span-3">
                        <CardHeader><CardTitle>Lifecycle Timeline</CardTitle></CardHeader>
                        <CardContent>
                            <div className="relative border-l border-white/10 ml-3 space-y-8">
                                {timeline.map((event, index) => (
                                    <div key={index} className="ml-6 relative">
                                        <span className={`absolute -left-[31px] flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-slate-900 ${event.type === 'Milestone' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                        <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-white">{event.title}</h3>
                                                <span className="text-xs text-slate-400">{format(new Date(event.date), "MMM d")}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1">{event.details}</p>
                                        </div>
                                    </div>
                                ))}
                                {timeline.length === 0 && <p className="text-slate-500 ml-6">No events recorded yet.</p>}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* MODAL: IoT Device Selector */}
            {showValveSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <Card className="w-full max-w-lg bg-slate-950 border-slate-800 max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Select IoT Valve</h2>
                            <button onClick={() => setShowValveSelector(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-2">
                            {availableValves.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">No IoT devices found.</p>
                            ) : (
                                availableValves.map((device) => (
                                    <div key={device.device_id} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-white/10 hover:border-green-500/50 transition-all">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white">{device.name || device.device_id}</span>
                                                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{device.type || 'Unknown'}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">ID: {device.device_id} • Status: {device.status || 'Offline'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleSelectValve(device)}
                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded"
                                        >
                                            Select
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
