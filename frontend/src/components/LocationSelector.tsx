'use client';
import { trackLocationSelect, trackCurrentLocation, trackUserAction } from '@/lib/analytics';
import { useTranslations } from 'next-intl';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polygon } from 'react-leaflet';
import '../styles/leaflet-patched.css';
import { useEffect, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { Search, MapPin, X, Loader2, ChevronDown, Layout, Check, Grid } from 'lucide-react';
import { Card } from './ui/Card';

const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function MapController({ center }: { center: L.LatLng | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13, {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, map]);
    return null;
}

function ZoneGrid({ center, activeZoneId }: { center: L.LatLng | null, activeZoneId: string }) {
    if (!center) return null;

    // ~50m offset for visual grid (represents ~2.5 acres total)
    const d = 0.00045;
    const lat = center.lat;
    const lng = center.lng;

    // Define 4 quadrants
    const quadrants = [
        { id: '1', name: 'Zone 1 (North-East)', color: 'blue', positions: [[lat, lng], [lat + d, lng], [lat + d, lng + d], [lat, lng + d]] as [number, number][] }, // NE
        { id: '2', name: 'Zone 2 (South-East)', color: 'green', positions: [[lat, lng], [lat - d, lng], [lat - d, lng + d], [lat, lng + d]] as [number, number][] }, // SE
        { id: '3', name: 'Zone 3 (South-West)', color: 'orange', positions: [[lat, lng], [lat - d, lng], [lat - d, lng - d], [lat, lng - d]] as [number, number][] }, // SW
        { id: '4', name: 'Zone 4 (North-West)', color: 'purple', positions: [[lat, lng], [lat + d, lng], [lat + d, lng - d], [lat, lng - d]] as [number, number][] }, // NW
    ];

    return (
        <>
            {quadrants.map((q) => (
                <Polygon
                    key={q.id}
                    positions={q.positions}
                    pathOptions={{
                        color: 'white',
                        weight: 2,
                        dashArray: '5, 5',
                        fillColor: q.color,
                        fillOpacity: activeZoneId === 'all' ? 0.05 : (activeZoneId.includes(q.id) ? 0.3 : 0.05)
                    }}
                />
            ))}
        </>
    );
}

function LocationMarker({ position, onPositionChange }: { position: L.LatLng | null, onPositionChange: (latlng: L.LatLng) => void }) {
    const t = useTranslations('LocationSelector');
    useMapEvents({
        click(e) {
            trackUserAction('map_click_try', 'Map Interaction', { lat: e.latlng.lat, lng: e.latlng.lng });
            onPositionChange(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={icon}>
            <Popup>{t('selected_location')}</Popup>
        </Marker>
    );
}

export interface Zone {
    id: number | string;
    name: string;
    land_id?: string;
    details?: {
        crop?: string;
        status?: string;
        color?: string;
    };
    geometry?: any;
    isPlaceholder?: boolean;
}

interface LocationSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lat: number, lng: number, name: string, method: 'manual' | 'gps') => void;
    zones?: Zone[];
    onUpdateZone?: (zoneId: number | string, data: any) => Promise<void>;
    simpleMode?: boolean;
}

export default function LocationSelector({ isOpen, onClose, onSelect, zones = [], onUpdateZone, simpleMode = false }: LocationSelectorProps) {
    const t = useTranslations('LocationSelector');
    const tGlobal = useTranslations('Global');
    const tFarms = useTranslations('Farms');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [activeZone, setActiveZone] = useState<string>('all');
    const [isDropdownOpen, setIsDropdownOpen] = useState(true);

    // Editing state
    const [isEditingZone, setIsEditingZone] = useState(false);
    const [editForm, setEditForm] = useState({ crop: '', status: '' });

    // Ensure we always have 4 zones for the grid (NE, SE, SW, NW)
    const displayZones = useMemo(() => {
        const quadrants = [
            { id: '1', defaultName: 'Zone 1 (North-East)', type: 'NE' },
            { id: '2', defaultName: 'Zone 2 (South-East)', type: 'SE' },
            { id: '3', defaultName: 'Zone 3 (South-West)', type: 'SW' },
            { id: '4', defaultName: 'Zone 4 (North-West)', type: 'NW' },
        ];

        return quadrants.map((q, idx) => {
            // Try to find a matching zone from props (by index or ID preference if we had it)
            // Here we assume sequential mapping 0->NE, 1->SE matches creation logic
            const propZone = zones[idx];
            if (propZone) {
                return {
                    ...propZone,
                    // Ensure ID is string for consistency
                    id: String(propZone.id),
                    // Keep existing name or fallback
                    name: propZone.name || q.defaultName,
                    isPlaceholder: false
                };
            }
            // Fallback placeholder
            return {
                id: `placeholder-${q.id}`,
                name: q.defaultName,
                details: { crop: 'Empty', status: 'Available' },
                isPlaceholder: true
            };
        });
    }, [zones]);

    const handleZoneSelect = (zoneId: string) => {
        setActiveZone(zoneId);
        setIsEditingZone(false);
    };

    const handleStartEdit = (zone: any) => {
        // Prevent editing placeholders for now (or treat as create in future)
        if (zone.isPlaceholder) return;

        setEditForm({
            crop: zone.details?.crop || '',
            status: zone.details?.status || ''
        });
        setIsEditingZone(true);
    };

    const handleSaveZone = async () => {
        if (!onUpdateZone) return;
        try {
            await onUpdateZone(activeZone, {
                crop_details: {
                    crop: editForm.crop,
                    status: editForm.status
                }
            });
            setIsEditingZone(false);
        } catch (e) {
            console.error("Failed to save zone", e);
        }
    };

    // Visualization: Calculate a fake center for the zone if it has no geometry
    const displayPosition = useMemo(() => {
        if (!position) return null;
        if (activeZone === 'all') return position;

        // Find zone
        const zone = zones.find(z => String(z.id) === activeZone);
        if (!zone) return position;

        // Simulate offset based on Zone ID (simple deterministic hash)
        // In real app, use zone.geometry.centroid
        const idNum = parseInt(String(zone.id).replace(/\D/g, '')) || 0;
        // Reduced offset to 0.001 to fit new grid size
        const latOffset = (idNum % 2 === 0 ? 0.001 : -0.001);
        const lngOffset = (idNum % 3 === 0 ? 0.001 : -0.001);

        return new L.LatLng(position.lat + latOffset, position.lng + lngOffset);
    }, [position, activeZone, zones]);


    // Debounced Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setIsSearching(true);
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
                    const data = await res.json();
                    setSearchResults(data);
                } catch (error) {
                    console.error("Search failed:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectResult = (lat: string, lon: string, name: string) => {
        trackUserAction('search_select_try', 'Map Interaction', { lat, lon, name });
        const latlng = new L.LatLng(parseFloat(lat), parseFloat(lon));
        setPosition(latlng);
        setSearchResults([]);
        setActiveZone('all'); // Reset zone when location changes
    };

    const handleConfirm = async () => {
        if (!position) return;

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`);
            const data = await res.json();
            const displayName = data.display_name ? data.address.city || data.address.town || data.address.village || data.display_name.split(',')[0] : t('custom_location');

            onSelect(position.lat, position.lng, displayName, 'manual');
            trackLocationSelect(position.lat, position.lng, displayName);
            trackUserAction('confirm_location', 'Map Interaction', { lat: position.lat, lng: position.lng, name: displayName });
            onClose();
        } catch (e) {
            onSelect(position.lat, position.lng, t('custom_location'), 'manual');
            onClose();
        }
    };

    const handleGetCurrentLocation = useCallback((source: 'auto' | 'manual' = 'manual') => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const latlng = new L.LatLng(lat, lng);
                setPosition(latlng);
                setActiveZone('all');

                // Fetch name for accurate tracking
                let locationName = t('current_location');
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();
                    locationName = data.display_name ? data.address.city || data.address.town || data.address.village || data.display_name.split(',')[0] : t('current_location');
                } catch (e) {
                    console.error("Failed to reverse geocode current location", e);
                }

                trackCurrentLocation(lat, lng, locationName, source);

                // Only auto-select/close if manual, otherwise just update map center
                if (source === 'manual') {
                    onSelect(lat, lng, locationName, 'gps');
                    onClose();
                }
            });
        }
    }, [t, onSelect, onClose]);

    // Auto-fetch if permission is granted (on mount)
    useEffect(() => {
        if (isOpen && navigator.geolocation && navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then(result => {
                if (result.state === 'granted') {
                    handleGetCurrentLocation('auto');
                }
            }).catch(e => {
                // Ignore permission query errors (some browsers/enviros might not support strictly)
                console.log("Permission query skipped", e);
            });
        }
    }, [isOpen, handleGetCurrentLocation]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-slate-950 animate-in fade-in transition-colors duration-300">
            {/* Header - Fixed Top */}
            <div className="flex-none p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-[1002]">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('title')}</h2>
                <button onClick={onClose} className="bg-slate-100 dark:bg-white/10 p-2 rounded-full text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Map Container - Flexible Grow */}
            <div className="flex-1 relative w-full overflow-hidden">

                {/* Search Bar - Floating */}
                <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-[1001]">
                    <div className="relative shadow-2xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-xl py-3.5 pl-12 pr-10 text-slate-900 dark:text-white text-base focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 shadow-black/10 dark:shadow-black/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {isSearching ? (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                            </div>
                        ) : searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-h-[40vh] overflow-y-auto overflow-x-hidden">
                            {searchResults.map((result: any, i) => (
                                <button
                                    key={i}
                                    className="w-full text-left p-3.5 hover:bg-green-50 dark:hover:bg-green-500/20 border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors flex items-start gap-3"
                                    onClick={() => handleSelectResult(result.lat, result.lon, result.display_name)}
                                >
                                    <MapPin className="w-5 h-5 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <div className="font-medium text-slate-900 dark:text-white text-sm truncate">{result.display_name.split(',')[0]}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{result.display_name}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Overlay: Farm Details & Zones */}
                {!simpleMode && position && (
                    <div className="absolute top-24 left-4 z-[1001] w-72 flex flex-col gap-3 animate-in slide-in-from-left-4 duration-300">

                        {/* 1. Main Info Card - Swaps between Farm Overview and Zone Details */}
                        {activeZone === 'all' ? (
                            <div
                                onClick={() => handleZoneSelect('all')}
                                className={`bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 p-4 shadow-2xl cursor-pointer hover:border-green-500/50 transition-all group ring-2 ring-green-500/50`}
                            >
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{tFarms('current_farm')}</p>
                                <h3 className="text-lg font-bold text-white leading-tight mb-3">{tFarms('view_all_location')}</h3>

                                <div className="flex items-center gap-6">
                                    <div>
                                        <p className="text-[10px] text-slate-500 mb-0.5">{tFarms('owners')}</p>
                                        <p className="text-sm font-semibold text-white">{tFarms('self')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 mb-0.5">{tFarms('soil_type')}</p>
                                        <p className="text-sm font-semibold text-green-400">Loamy</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-green-500/30 p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                                {isEditingZone ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="text-sm font-bold text-white">{tGlobal('edit')}</h3>
                                            <button onClick={() => setIsEditingZone(false)} className="text-xs text-slate-400 hover:text-white">{tGlobal('cancel')}</button>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 uppercase font-bold">Crop</label>
                                            <select
                                                value={editForm.crop}
                                                onChange={(e) => setEditForm({ ...editForm, crop: e.target.value })}
                                                className="w-full bg-slate-800 text-white text-sm rounded cursor-pointer mt-1 p-2 border border-slate-700 focus:border-green-500 outline-none"
                                            >
                                                <option value="">None</option>
                                                <option value="Wheat">Wheat</option>
                                                <option value="Corn">Corn</option>
                                                <option value="Rice">Rice</option>
                                                <option value="Potato">Potato</option>
                                                <option value="Fallow">Fallow (Empty)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 uppercase font-bold">Status</label>
                                            <input
                                                type="text"
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                className="w-full bg-slate-800 text-white text-sm rounded mt-1 p-2 border border-slate-700 focus:border-green-500 outline-none"
                                                placeholder="e.g. Irrigation Needed"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveZone}
                                            className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded transition-colors"
                                        >
                                            {tGlobal('save_changes')}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-green-400 font-bold mb-1">Selected Zone</p>
                                                <h3 className="text-lg font-bold text-white leading-tight">
                                                    {displayZones.find(z => String(z.id) === activeZone)?.name}
                                                </h3>
                                            </div>
                                            {onUpdateZone && !displayZones.find(z => String(z.id) === activeZone)?.isPlaceholder && (
                                                <button
                                                    onClick={() => handleStartEdit(displayZones.find(z => String(z.id) === activeZone)!)}
                                                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
                                                >
                                                    {tGlobal('edit')}
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div className="bg-slate-800/50 p-2 rounded">
                                                <p className="text-[10px] text-slate-500 mb-0.5">Crop</p>
                                                <p className="text-sm font-semibold text-white">
                                                    {displayZones.find(z => String(z.id) === activeZone)?.details?.crop || "None"}
                                                </p>
                                            </div>
                                            <div className="bg-slate-800/50 p-2 rounded">
                                                <p className="text-[10px] text-slate-500 mb-0.5">Status</p>
                                                <p className="text-sm font-semibold text-green-400">
                                                    {displayZones.find(z => String(z.id) === activeZone)?.details?.status || "Active"}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 2. Zones List */}
                        <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                            >
                                <h4 className="text-sm font-bold text-white">{tFarms('active_zones')}</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-medium">{displayZones.length} Active</span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {isDropdownOpen && (
                                <div className="divide-y divide-white/5">
                                    {displayZones.map((zone, idx) => (
                                        <button
                                            key={zone.id}
                                            onClick={() => handleZoneSelect(String(zone.id))}
                                            className={`w-full text-left p-3 hover:bg-white/5 transition-colors group flex items-start justify-between ${activeZone === String(zone.id) ? 'bg-green-500/10' : ''}`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-sm font-bold ${activeZone === String(zone.id) ? 'text-green-400' : 'text-slate-200 group-hover:text-white'}`}>
                                                        {zone.name}
                                                        {zone.details?.crop && <span className="text-slate-500 font-normal"> - {zone.details.crop}</span>}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500">
                                                    {zone.details?.status || 'Active'}
                                                </p>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full mt-1.5 ${activeZone === String(zone.id) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-green-500/50'}`}></div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    className="w-full h-full bg-slate-100 dark:bg-slate-950"
                >
                    {/* Satellite Layer */}
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                    {/* Hybrid Labels Layer */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                    />

                    <MapController center={displayPosition} />
                    <ZoneGrid center={position} activeZoneId={activeZone} />
                    <LocationMarker position={position} onPositionChange={setPosition} />
                </MapContainer>

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-[1000] pointer-events-none flex flex-col items-center gap-4 bg-gradient-to-t from-black/20 via-transparent to-transparent">

                    {/* Floating GPS Button */}
                    <div className="w-full flex justify-end pointer-events-auto">
                        <button
                            onClick={() => handleGetCurrentLocation('manual')}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white p-3 rounded-full shadow-lg hover:bg-green-50 dark:hover:bg-green-600 transition-all active:scale-95"
                            title={t('use_current_location')}
                        >
                            <MapPin className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Action Bar */}
                    <div className="pointer-events-auto flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-2 pr-3 rounded-full border border-slate-200 dark:border-white/10 shadow-2xl">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
                        >
                            {tGlobal('cancel')}
                        </button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
                        <button
                            onClick={handleConfirm}
                            disabled={!position}
                            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
                        >
                            <MapPin className="w-4 h-4 fill-current" />
                            {position ? t('confirm_location') : t('tap_on_map')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
