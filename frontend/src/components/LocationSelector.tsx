
'use client';
import { trackLocationSelect, trackCurrentLocation } from '@/lib/analytics';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
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
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
}

function LocationMarker({ position, onPositionChange }: { position: L.LatLng | null, onPositionChange: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            onPositionChange(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={icon}>
            <Popup>Selected Location</Popup>
        </Marker>
    );
}

interface LocationSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lat: number, lng: number, name: string, method: 'manual' | 'gps') => void;
}

export default function LocationSelector({ isOpen, onClose, onSelect }: LocationSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);

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
        const latlng = new L.LatLng(parseFloat(lat), parseFloat(lon));
        setPosition(latlng);
        setSearchResults([]);
    };

    const handleConfirm = async () => {
        if (!position) return;

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`);
            const data = await res.json();
            const displayName = data.display_name ? data.address.city || data.address.town || data.address.village || data.display_name.split(',')[0] : "Custom Location";

            onSelect(position.lat, position.lng, displayName, 'manual');
            trackLocationSelect(position.lat, position.lng, displayName);
            onClose();
        } catch (e) {
            onSelect(position.lat, position.lng, "Custom Location", 'manual');
            onClose();
        }
    };

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const latlng = new L.LatLng(lat, lng);
                setPosition(latlng);

                // Fetch name for accurate tracking
                let locationName = "Current Location";
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();
                    locationName = data.display_name ? data.address.city || data.address.town || data.address.village || data.display_name.split(',')[0] : "Current Location";
                } catch (e) {
                    console.error("Failed to reverse geocode current location", e);
                }

                trackCurrentLocation(lat, lng, locationName);
                onSelect(lat, lng, locationName, 'gps');
                onClose();
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 animate-in fade-in">
            {/* Header - Fixed Top */}
            <div className="flex-none p-4 border-b border-white/10 flex justify-between items-center bg-slate-900/90 backdrop-blur-md z-[1002]">
                <h2 className="text-lg font-semibold text-white">Choose Farming Location</h2>
                <button onClick={onClose} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Map Container - Flexible Grow */}
            <div className="flex-1 relative w-full overflow-hidden">

                {/* Search Bar - Floating */}
                <div className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-[1001]">
                    <div className="relative shadow-2xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search town or village..."
                            className="w-full bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-xl py-3.5 pl-12 pr-10 text-white text-base focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 shadow-black/50 transition-all"
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
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-[40vh] overflow-y-auto overflow-x-hidden">
                            {searchResults.map((result: any, i) => (
                                <button
                                    key={i}
                                    className="w-full text-left p-3.5 hover:bg-green-500/20 border-b border-white/5 last:border-0 transition-colors flex items-start gap-3"
                                    onClick={() => handleSelectResult(result.lat, result.lon, result.display_name)}
                                >
                                    <MapPin className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <div className="font-medium text-white text-sm truncate">{result.display_name.split(',')[0]}</div>
                                        <div className="text-xs text-slate-400 line-clamp-2">{result.display_name}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    className="w-full h-full bg-slate-950"
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

                    <MapController center={position} />
                    <LocationMarker position={position} onPositionChange={setPosition} />
                </MapContainer>

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-[1000] pointer-events-none flex flex-col items-center gap-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">

                    {/* Floating GPS Button */}
                    <div className="w-full flex justify-end pointer-events-auto">
                        <button
                            onClick={handleGetCurrentLocation}
                            className="bg-slate-900 border border-white/20 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-all active:scale-95"
                            title="Use Current Location"
                        >
                            <MapPin className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Action Bar */}
                    <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl p-2 pr-3 rounded-full border border-white/10 shadow-2xl">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-300 hover:text-white font-medium hover:bg-white/5 rounded-full transition-colors"
                        >
                            Cancel
                        </button>
                        <div className="h-6 w-px bg-white/10"></div>
                        <button
                            onClick={handleConfirm}
                            disabled={!position}
                            className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
                        >
                            <MapPin className="w-4 h-4 fill-current" />
                            {position ? 'Confirm Location' : 'Tap on Map'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
