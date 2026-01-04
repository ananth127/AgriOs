'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';

export default function FarmsPage() {
    const [farms, setFarms] = useState<any[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(undefined);

    // Dynamically import Map to avoid SSR issues with Leaflet
    const FarmMap = useMemo(() => dynamic(
        () => import('@/components/FarmMap'),
        {
            loading: () => <div className="flex items-center justify-center h-full text-slate-500 bg-slate-900">Loading Satellite Data...</div>,
            ssr: false
        }
    ), []);

    useEffect(() => {
        api.farms.list()
            .then((data: any) => {
                if (Array.isArray(data)) {
                    setFarms(data);
                    if (data.length > 0) setSelectedFarmId(data[0].id);
                } else {
                    console.error("Farms API returned non-array:", data);
                    setFarms([]);
                }
            })
            .catch(err => console.error("Failed to fetch farms", err));
    }, []);

    // Find selected farm details
    const currentFarm = farms.find(f => f.id === selectedFarmId);

    return (
        <div className="flex h-full relative">
            {/* Map (Full background) */}
            <div className="absolute inset-0 bg-slate-950 z-0">
                <FarmMap farms={farms} selectedFarmId={selectedFarmId} />
            </div>

            {/* Floating Overlay Panel */}
            <div className="relative z-10 p-4 md:p-6 w-full md:w-96 h-full pointer-events-none flex flex-col gap-4">
                <div className="pointer-events-auto space-y-4">
                    {/* Farm Selector */}
                    <Card className="p-4 bg-slate-900/90 backdrop-blur border-white/10 shadow-xl">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Farm</label>
                        <select
                            className="w-full bg-transparent font-bold text-xl mt-1 focus:outline-none cursor-pointer"
                            value={selectedFarmId ?? ''}
                            onChange={(e) => setSelectedFarmId(e.target.value ? parseInt(e.target.value) : undefined)}
                        >
                            {farms.length > 0 ? (
                                farms.map(f => <option key={f.id} value={f.id} className="bg-slate-900">{f.name}</option>)
                            ) : (
                                <option>No farms found</option>
                            )}
                        </select>
                        <div className="mt-4 flex gap-4 text-sm">
                            <div>
                                <div className="text-slate-500">Owners</div>
                                <div className="font-mono">Self</div>
                            </div>
                            <div>
                                <div className="text-slate-500">Soil Type</div>
                                <div className="font-mono text-green-400">
                                    {currentFarm?.soil_profile?.type || 'Unknown'}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Plots List */}
                    <Card className="p-0 bg-slate-900/90 backdrop-blur border-white/10 overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-white/10">
                            <h3 className="font-semibold">Active Zones</h3>
                        </div>
                        <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                            {/* In a real app, Fetch zones/plots for this farm */}
                            <div className="p-4 hover:bg-white/5 cursor-pointer transition-colors">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-green-400">Zone A - Wheat</span>
                                    <span className="text-xs text-slate-500">Healthy</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Next: Irrigation in 2 days</p>
                            </div>
                            <div className="p-4 hover:bg-white/5 cursor-pointer transition-colors">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-orange-400">Zone B - Fallow</span>
                                    <span className="text-xs text-slate-500">Idle</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Ready for sowing</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
