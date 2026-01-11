'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { CreateFarmModal } from '@/components/farms/CreateFarmModal';
import { Plus } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';

export default function FarmsPage() {
    const t = useTranslations('Farms');
    const tGlobal = useTranslations('Global');
    const { user } = useAuth();
    const [farms, setFarms] = useState<any[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Dynamically import Map to avoid SSR issues with Leaflet
    const FarmMap = useMemo(() => dynamic(
        () => import('@/components/FarmMap'),
        {
            loading: () => <div className="flex items-center justify-center h-full text-slate-500 bg-slate-900">{t('loading_satellite')}</div>,
            ssr: false
        }
    ), [t]);

    const fetchFarms = useCallback(() => {
        api.farms.list()
            .then((data: any) => {
                if (Array.isArray(data)) {
                    setFarms(data);
                    // Do not auto-select first farm; let map default to User Land Location
                    // if (data.length > 0 && !selectedFarmId) setSelectedFarmId(data[0].id);
                } else {
                    console.error("Farms API returned non-array:", data);
                    setFarms([]);
                }
            })
            .catch(err => console.error("Failed to fetch farms", err));
    }, []);

    useEffect(() => {
        fetchFarms();
    }, [fetchFarms]);

    // Find selected farm details
    const currentFarm = farms.find(f => f.id === selectedFarmId);

    const [viewCenter, setViewCenter] = useState<[number, number] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isZonesExpanded, setIsZonesExpanded] = useState(false); // Default collapsed on mobile

    const userLocation: [number, number] | null = (user?.latitude && user?.longitude)
        ? [user.latitude, user.longitude]
        : null;

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
                <FarmMap farms={farms} selectedFarmId={selectedFarmId} viewCenter={viewCenter} userLocation={userLocation} />
            </div>

            {/* Floating Overlay Panel - Dynamic Height */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 w-full md:w-96 flex flex-col gap-3 pointer-events-none max-h-screen overflow-hidden">

                {/* 1. Search Bar (Above Farm) */}
                <div className="pointer-events-auto relative shadow-xl flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder={t('search_location')}
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
                        title={t('add_new_farm')}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. Farm Selector (Compact) */}
                <Card className="p-4 bg-slate-900/95 backdrop-blur border-white/10 shadow-xl pointer-events-auto shrink-0">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('current_farm')}</label>
                    <select
                        className="w-full bg-transparent font-bold text-lg mt-0.5 focus:outline-none cursor-pointer appearance-none text-white truncate pr-4"
                        value={selectedFarmId ?? ''}
                        onChange={(e) => setSelectedFarmId(e.target.value ? parseInt(e.target.value) : undefined)}
                    >
                        <option value="" className="bg-slate-900 text-slate-400">{t('view_all_location')}</option>
                        {farms.length > 0 ? (
                            farms.map(f => <option key={f.id} value={f.id} className="bg-slate-900">{f.name}</option>)
                        ) : (
                            <option value="" disabled>{t('no_farms')}</option>
                        )}
                    </select>
                    <div className="mt-3 flex gap-4 text-xs">
                        <div>
                            <div className="text-slate-500">{t('owners')}</div>
                            <div className="font-mono text-white">{t('self')}</div>
                        </div>
                        <div>
                            <div className="text-slate-500">{t('soil_type')}</div>
                            <div className="font-mono text-green-400">
                                {currentFarm?.soil_profile?.type || tGlobal('unknown')}
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
                        <h3 className="font-semibold text-sm text-slate-300">{t('active_zones')}</h3>
                        <span className={`text-slate-500 text-xs transition-transform ${isZonesExpanded ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </div>

                    {/* Collapsible Content */}
                    <div className={`${isZonesExpanded ? 'max-h-[300px]' : 'max-h-0'} overflow-y-auto transition-all duration-300 ease-in-out`}>
                        <div className="divide-y divide-white/5">
                            <div className="p-3 hover:bg-white/5 cursor-pointer transition-colors">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-green-400 text-sm">{t('mock_zone_a')}</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">{t('mock_status_irrigation')}</p>
                            </div>
                            <div className="p-3 hover:bg-white/5 cursor-pointer transition-colors">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-orange-400 text-sm">{t('mock_zone_b')}</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">{t('mock_status_sowing')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Preview (Shown when collapsed) */}
                    {!isZonesExpanded && (
                        <div className="p-3 text-xs text-slate-500 text-center cursor-pointer" onClick={() => setIsZonesExpanded(true)}>
                            {t('zones_tap_view_other', { count: 2 })}
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
