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
    const { user, logout } = useAuth();
    const [farms, setFarms] = useState<any[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeZone, setActiveZone] = useState<string>('all'); // State for active zone

    // Dynamically import Map to avoid SSR issues with Leaflet
    const FarmMap = useMemo(() => dynamic(
        () => import('@/components/FarmMap'),
        {
            loading: () => <div className="flex items-center justify-center h-full text-slate-500 bg-slate-900">{t('loading_satellite')}</div>,
            ssr: false
        }
    ), [t]);

    // Helper to parse WKT
    const parseWKT = (wkt: string): [number, number][] => {
        if (!wkt) return [];
        try {
            const matches = wkt.match(/-?\d+\.\d+/g);
            if (matches && matches.length >= 2) {
                const points: [number, number][] = [];
                for (let i = 0; i < matches.length; i += 2) {
                    const x = parseFloat(matches[i]); // Lon
                    const y = parseFloat(matches[i + 1]); // Lat
                    if (!isNaN(x) && !isNaN(y)) {
                        points.push([y, x]); // Leaflet uses [Lat, Lon]
                    }
                }
                return points;
            }
        } catch (e) {
            console.warn("Failed to parse WKT", wkt);
        }
        return [];
    };

    const fetchFarms = useCallback(() => {
        api.farms.list()
            .then((data: any) => {
                if (Array.isArray(data)) {
                    // Process farms to extract lat/lon from WKT geometry
                    const processedFarms = data.map(f => {
                        let lat = f.latitude;
                        let lon = f.longitude;
                        let boundary: [number, number][] = f.boundary || [];

                        // 1. Parse Farm Geometry
                        if (typeof f.geometry === 'string') {
                            const parsed = parseWKT(f.geometry);
                            if (parsed.length > 0) {
                                boundary = parsed;

                                // Calculate centroid key if lat/lon missing
                                if (!lat) {
                                    let totalLat = 0, totalLon = 0;
                                    parsed.forEach(p => { totalLat += p[0]; totalLon += p[1]; });
                                    lat = totalLat / parsed.length;
                                    lon = totalLon / parsed.length;
                                }
                            }
                        }

                        // 2. Parse Zone Geometries
                        const processedZones = (f.zones || []).map((z: any) => ({
                            ...z,
                            boundary: z.geometry ? parseWKT(z.geometry) : []
                        }));

                        return {
                            ...f,
                            latitude: lat,
                            longitude: lon,
                            boundary: boundary,
                            zones: processedZones
                        };
                    });

                    setFarms(processedFarms);

                    // Auto-select logic:
                    if (processedFarms.length > 0) {
                        // If we have a newly created farm (highest ID), maybe prefer it? 
                        // For now, adhere to standard behavior: Select first if none selected.
                        if (selectedFarmId === undefined) {
                            setSelectedFarmId(processedFarms[0].id);
                        } else {
                            // If current selection is invalid, reset to first
                            const exists = processedFarms.find(f => f.id === selectedFarmId);
                            if (!exists) setSelectedFarmId(processedFarms[0].id);

                            // Check if we just added a farm (simple heuristic: list grew?)
                            // Can't easily detect "just added" without more state. 
                            // But fixing lat/lon enables manual selection to work immediately.
                        }
                    }
                } else {
                    console.error("Farms API returned non-array:", data);
                    setFarms([]);
                }
            })
            .catch(err => {
                console.error("Failed to fetch farms", err);
                // Check for 401 Unauthorized via ApiError status
                if (err?.status === 401 || (err?.message && err.message.includes("Unauthorized"))) {
                    logout();
                }
            });
    }, [logout, selectedFarmId]);

    useEffect(() => {
        fetchFarms();
    }, [fetchFarms]);

    // Find selected farm details
    const currentFarm = useMemo(() =>
        farms.find(f => f.id === selectedFarmId) || farms[0]
        , [farms, selectedFarmId]);

    // Ensure we always have at least 4 zones (or show all if more)
    const displayZones = useMemo(() => {
        const zones = currentFarm?.zones || [];

        // 1. Map existing actual zones
        const mappedZones = zones.map((z: any) => ({
            ...z,
            id: String(z.id),
            name: z.name || `Zone ${z.id}`,
            isPlaceholder: false
        }));

        const quadrants = [
            { id: '1', defaultName: 'Zone 1 (North-East)', type: 'NE' },
            { id: '2', defaultName: 'Zone 2 (South-East)', type: 'SE' },
            { id: '3', defaultName: 'Zone 3 (South-West)', type: 'SW' },
            { id: '4', defaultName: 'Zone 4 (North-West)', type: 'NW' },
        ];

        // 2. Pad with placeholders if fewer than 4
        const result = [...mappedZones];
        if (result.length < 4) {
            for (let i = result.length; i < 4; i++) {
                const q = quadrants[i];
                result.push({
                    id: `placeholder-${q.id}`,
                    name: q.defaultName,
                    details: { crop: 'Empty', status: 'Available' },
                    isPlaceholder: true
                });
            }
        }
        return result;
    }, [currentFarm]);

    const [viewCenter, setViewCenter] = useState<[number, number] | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isZonesExpanded, setIsZonesExpanded] = useState(true); // Default expanded for visibility

    // Auto-collapse zones after 5 seconds if no interaction (basic timer)
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isZonesExpanded) {
            timer = setTimeout(() => {
                setIsZonesExpanded(false);
            }, 5000);
        }
        return () => clearTimeout(timer);
    }, [isZonesExpanded]);

    // Reset view state when farm changes
    useEffect(() => {
        setViewCenter(null);
        setActiveZone('all');
        setIsZonesExpanded(true);
        setSearchQuery('');
    }, [selectedFarmId]);

    const userLocation: [number, number] | null = (user?.latitude && user?.longitude)
        ? [user.latitude, user.longitude]
        : null;

    // ... search logic remains ... 
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

    const handleZoneSelect = (zone: any) => {
        setActiveZone(String(zone.id));
        setIsZonesExpanded(false);

        // Priority 1: Use actual Geometry Centroid
        if (zone.boundary && Array.isArray(zone.boundary) && zone.boundary.length > 0) {
            let totalLat = 0, totalLon = 0;
            zone.boundary.forEach((p: [number, number]) => {
                totalLat += p[0];
                totalLon += p[1];
            });
            const centerLat = totalLat / zone.boundary.length;
            const centerLon = totalLon / zone.boundary.length;
            setViewCenter([centerLat, centerLon]);
            return;
        }

        // Priority 2: Fallback to Quadrant Logic (for placeholders)
        if (currentFarm && currentFarm.latitude && currentFarm.longitude) {
            // The ZoneGrid in FarmMap uses a fixed size 'd = 0.00045'
            // To center on the quadrant, we need d/2 = 0.000225
            const offset = 0.000225;

            let targetLat = currentFarm.latitude;
            let targetLon = currentFarm.longitude;

            // displayZones order: NE (0), SE (1), SW (2), NW (3)
            const index = displayZones.findIndex(z => String(z.id) === String(zone.id));

            if (index === 0) { targetLat += offset; targetLon += offset; } // NE
            if (index === 1) { targetLat -= offset; targetLon += offset; } // SE
            if (index === 2) { targetLat -= offset; targetLon -= offset; } // SW
            if (index === 3) { targetLat += offset; targetLon -= offset; } // NW

            setViewCenter([targetLat, targetLon]);
        }
    };

    // Dynamically import BoundaryTools to avoid Leaflet SSR issues
    const BoundaryTools = useMemo(() => dynamic(
        () => import('@/components/farms/BoundaryTools'),
        { ssr: false }
    ), []);

    const [isDrawingMode, setIsDrawingMode] = useState(false);

    const handleZoneCreate = async (geometryWKT: string, details: any) => {
        if (!selectedFarmId) {
            alert(t('custom_error_select_farm_first') || "Please select a farm first.");
            // Fallback string if translation missing
            return;
        }

        const name = prompt(t('prompt_zone_name') || "Enter name for this new zone:", `Zone ${farms.find(f => f.id === selectedFarmId)?.zones?.length + 1 || 1} (AI Detected)`);
        if (!name) return;

        try {
            await api.farms.createZone(selectedFarmId, {
                name,
                geometry: geometryWKT,
                details: {
                    ...details,
                    status: 'Active',
                    crop: details.crop_prediction || 'Unknown'
                }
            });
            // Refresh
            fetchFarms();
            alert(t('success_zone_added') || "Zone added successfully!");
        } catch (error) {
            console.error("Failed to add zone", error);
            alert(t('error_add_zone') || "Failed to add zone.");
        }
    };

    const handleDeleteZone = async (zoneId: number) => {
        if (confirm(t('confirm_delete') || "Are you sure you want to delete this zone?")) {
            try {
                await api.farms.deleteZone(zoneId);
                fetchFarms();
            } catch (error) {
                console.error("Failed to delete zone", error);
                alert("Failed to delete zone");
            }
        }
    };

    return (
        <div className="flex h-full relative">
            {/* Map (Full background) */}
            <div className="absolute inset-0 bg-slate-950 z-0">
                <FarmMap
                    farms={farms}
                    selectedFarmId={selectedFarmId}
                    viewCenter={viewCenter}
                    userLocation={userLocation}
                    activeZone={activeZone} // Pass activeZone if Map supports it (update later)
                    zones={displayZones}    // Pass zones for Grid
                    onDeleteZone={handleDeleteZone}
                >
                    {selectedFarmId && <BoundaryTools onZoneCreated={handleZoneCreate} onDrawStateChange={setIsDrawingMode} />}
                </FarmMap>
            </div>

            {/* Floating Overlay Panel - Dynamic Height */}
            {!isDrawingMode && (
                <div className="absolute top-0 left-0 z-10 p-2 md:p-4 w-[calc(100%-64px)] md:w-96 flex flex-col gap-2 md:gap-3 pointer-events-none max-h-screen overflow-hidden">

                    {/* 1. Search Bar (Above Farm) */}
                    <div className="pointer-events-auto relative shadow-xl flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder={t('search_location')}
                                className="w-full bg-slate-900/95 backdrop-blur text-white border border-white/20 rounded-xl px-3 py-2 md:px-4 md:py-3 shadow-2xl focus:outline-none focus:border-green-500 text-sm pl-11"
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
                    <Card className="p-3 md:p-4 bg-slate-900/95 backdrop-blur border-white/10 shadow-xl pointer-events-auto shrink-0">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('current_farm')}</label>
                        <select
                            className="w-full bg-transparent font-bold text-base md:text-lg mt-0.5 focus:outline-none cursor-pointer appearance-none text-white truncate pr-4"
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
                            className="p-2 md:p-3 border-b border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/5 bg-slate-800/50"
                            onClick={() => setIsZonesExpanded(!isZonesExpanded)}
                        >
                            <h3 className="font-semibold text-sm text-slate-300">
                                {activeZone === 'all'
                                    ? t('active_zones')
                                    : displayZones.find(z => String(z.id) === activeZone)?.name || t('active_zones')
                                }
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-medium">{displayZones.length} Active</span>
                                <span className={`text-slate-500 text-xs transition-transform ${isZonesExpanded ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        <div className={`${isZonesExpanded ? 'max-h-[300px]' : 'max-h-0'} overflow-y-auto transition-all duration-300 ease-in-out`}>
                            <div className="divide-y divide-white/5">
                                {displayZones.map((zone) => (
                                    <div
                                        key={zone.id}
                                        onClick={() => handleZoneSelect(zone)}
                                        className={`p-2 md:p-3 hover:bg-white/5 cursor-pointer transition-colors ${activeZone === String(zone.id) ? 'bg-green-500/10' : ''}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium text-sm ${activeZone === String(zone.id) ? 'text-green-400' : 'text-slate-200'}`}>
                                                    {zone.name}
                                                    {zone.details?.crop && !zone.isPlaceholder && <span className="text-slate-500 font-normal ml-1">- {zone.details.crop}</span>}
                                                </span>
                                            </div>
                                            <div className={`h-1.5 w-1.5 rounded-full ${zone.isPlaceholder ? 'bg-slate-600' : 'bg-green-500'}`}></div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {zone.details?.status || (zone.isPlaceholder ? 'Available' : 'Active')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            <CreateFarmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchFarms}
            />
        </div>
    );
}
