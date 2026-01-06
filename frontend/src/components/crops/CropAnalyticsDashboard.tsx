import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { format } from "date-fns";
import { Loader2 } from 'lucide-react';
import { Bar, Line, Pie } from 'react-chartjs-2'; // Assuming Chart.js is installed or similar
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
}

export const CropAnalyticsDashboard: React.FC<CropDashboardProps> = ({ cropCycle, onClose }) => {
    const [stats, setStats] = useState<any>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!cropCycle) return;
            setLoading(true);
            try {
                // Fetch Timeline
                const events = await api.farmManagement.getTimeline(cropCycle.id);
                setTimeline(events);

                // Ideally we'd have a specific `getAnalytics` endpoint 
                // but for now we'll aggregate local data or mock rich data
                // based on what we have + some mock "AI" returns.

                // MOCK aggregation of "Expenses" (Water, Fertilizers)
                // In real app, we'd query /financials filtered by this crop cycle id.

                setStats({
                    waterUsageLitres: Math.floor(Math.random() * 50000) + 10000,
                    fertilizerCost: Math.floor(Math.random() * 5000) + 1000,
                    laborCost: Math.floor(Math.random() * 8000) + 2000,
                    projectedYieldKg: Math.floor(Math.random() * 2000) + 500,
                    soilHealthTrend: [6.5, 6.6, 6.5, 6.7, 6.8, 6.8], // pH over weeks
                    moistureTrend: [40, 35, 30, 60, 55, 50] // % over weeks
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [cropCycle]);

    if (!cropCycle) return null;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto">
            <div className="min-h-screen p-4 md:p-8">
                {/* Header */}
                <div className="flex justify-between items-center max-w-7xl mx-auto mb-6">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
                            {cropCycle.registry_name || "Crop"} Analytics
                        </h2>
                        <p className="text-slate-400">Cycle ID: #{cropCycle.id} • Started: {cropCycle.sowing_date}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg"
                    >
                        Close Dashboard
                    </button>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 1. Key Metrics Cards */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle>Resource Usage</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between p-3 bg-blue-500/10 rounded-lg">
                                <span>💧 Water Consumed</span>
                                <span className="font-bold text-blue-400">{stats.waterUsageLitres.toLocaleString()} L</span>
                            </div>
                            <div className="flex justify-between p-3 bg-green-500/10 rounded-lg">
                                <span>🌿 Fertilizer Cost</span>
                                <span className="font-bold text-green-400">₹{stats.fertilizerCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-purple-500/10 rounded-lg">
                                <span>🚧 Labor Cost</span>
                                <span className="font-bold text-purple-400">₹{stats.laborCost.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Charts - Trends */}
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

                    {/* 3. Timeline / flow */}
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
                </div>
            </div>
        </div>
    );
};
