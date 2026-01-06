'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { CreateFarmModal } from '@/components/farms/CreateFarmModal';
import { Plus } from 'lucide-react';

export default function FarmsPage() {
    const [farms, setFarms] = useState<any[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Dynamically import Map to avoid SSR issues with Leaflet
    const FarmMap = useMemo(() => dynamic(
        () => import('@/components/FarmMap'),
        {
            loading: () => <div className="flex items-center justify-center h-full text-slate-500 bg-slate-900">Loading Satellite Data...</div>,
            ssr: false
        }
    ), []);

    const fetchFarms = () => {
        api.farms.list()
            .then((data: any) => {
                if (Array.isArray(data)) {
                    setFarms(data);
                    if (data.length > 0 && !selectedFarmId) setSelectedFarmId(data[0].id);
                } else {
                    console.error("Farms API returned non-array:", data);
                    setFarms([]);
                }
            })
            .catch(err => console.error("Failed to fetch farms", err));
    };

    useEffect(() => {
        fetchFarms();
    }, []);

    // Find selected farm details
    const currentFarm = farms.find(f => f.id === selectedFarmId);

    const [viewCenter, setViewCenter] = useState<[number, number] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isZonesExpanded, setIsZonesExpanded] = useState(false); // Default collapsed on mobile

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setViewCenter([parseFloat(lat), parseFloat(lon)]);
            }
        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    return (
        <div className="flex h-full relative">
            {/* Map (Full background) */}
            <div className="absolute inset-0 bg-slate-950 z-0">
                <FarmMap farms={farms} selectedFarmId={selectedFarmId} viewCenter={viewCenter} />
            </div>

            {/* Floating Overlay Panel - Dynamic Height */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 w-full md:w-96 flex flex-col gap-3 pointer-events-none max-h-screen overflow-hidden">

                {/* 1. Search Bar (Above Farm) */}
                <div className="pointer-events-auto relative shadow-xl flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search location..."
                            className="w-full bg-slate-900/95 backdrop-blur text-white border border-white/20 rounded-xl px-4 py-3 shadow-2xl focus:outline-none focus:border-green-500 text-sm pl-11"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            🔍
                        </button>
                    </div>
                    {/* Add Farm Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-4 flex items-center justify-center shadow-xl"
                        title="Add New Farm"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. Farm Selector (Compact) */}
                <Card className="p-4 bg-slate-900/95 backdrop-blur border-white/10 shadow-xl pointer-events-auto shrink-0">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Farm</label>
                    <select
                        className="w-full bg-transparent font-bold text-lg mt-0.5 focus:outline-none cursor-pointer appearance-none text-white truncate pr-4"
                        value={selectedFarmId ?? ''}
                        onChange={(e) => setSelectedFarmId(e.target.value ? parseInt(e.target.value) : undefined)}
                    >
                        {farms.length > 0 ? (
                            farms.map(f => <option key={f.id} value={f.id} className="bg-slate-900">{f.name}</option>)
                        ) : (
                            <option>No farms found</option>
                        )}
                    </select>
                    <div className="mt-3 flex gap-4 text-xs">
                        <div>
                            <div className="text-slate-500">Owners</div>
                            <div className="font-mono text-white">Self</div>
                        </div>
                        <div>
                            <div className="text-slate-500">Soil Type</div>
                            <div className="font-mono text-green-400">
                                {currentFarm?.soil_profile?.type || 'Unknown'}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 3. Active Zones (Collapsible) */}
                <Card className="p-0 bg-slate-900/95 backdrop-blur border-white/10 shadow-xl pointer-events-auto flex flex-col overflow-hidden shrink transition-all duration-300">
                    <div
                        className="p-3 border-b border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/5 bg-slate-800/50"
                        onClick={() => setIsZonesExpanded(!isZonesExpanded)}
                    >
                        <h3 className="font-semibold text-sm text-slate-300">Active Zones</h3>
                        <span className={`text-slate-500 text-xs transition-transform ${isZonesExpanded ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </div>

                    {/* Collapsible Content */}
                    <div className={`${isZonesExpanded ? 'max-h-[300px]' : 'max-h-0'} overflow-y-auto transition-all duration-300 ease-in-out`}>
                        <div className="divide-y divide-white/5">
                            <div className="p-3 hover:bg-white/5 cursor-pointer transition-colors">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-green-400 text-sm">Zone A - Wheat</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Irrigation in 2 days</p>
                            </div>
                            <div className="p-3 hover:bg-white/5 cursor-pointer transition-colors">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-orange-400 text-sm">Zone B - Fallow</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Ready for sowing</p>
                            </div>
                        </div>
                    </div>

                    {/* Preview (Shown when collapsed) */}
                    {!isZonesExpanded && (
                        <div className="p-3 text-xs text-slate-500 text-center cursor-pointer" onClick={() => setIsZonesExpanded(true)}>
                            2 Zones Active • Tap to view
                        </div>
                    )}
                </Card>
            </div>
            <CreateFarmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchFarms}
            />
        </div>
    );
}
