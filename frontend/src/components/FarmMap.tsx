'use client';

import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Component to handle map movement programmatically
function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 13, { duration: 1.5 });
    }, [center, map]);
    return null;
}

interface FarmMapProps {
    farms: any[];
    selectedFarmId?: number;
}

export default function FarmMap({ farms, selectedFarmId }: FarmMapProps) {
    const defaultPosition: [number, number] = [18.5204, 73.8567]; // Pune default
    const [center, setCenter] = useState<[number, number]>(defaultPosition);

    // Auto-detect user location on mount
    useEffect(() => {
        if (!selectedFarmId && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCenter([latitude, longitude]);
                },
                (err) => console.warn("Geolocation access denied or failed", err),
                { enableHighAccuracy: true }
            );
        }
    }, [selectedFarmId]);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setCenter([parseFloat(lat), parseFloat(lon)]);
                setSearchResults(data);
            }
        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    useEffect(() => {
        if (selectedFarmId && farms.length > 0) {
            const farm = farms.find(f => f.id === selectedFarmId);

            if (farm && farm.name.includes("Nasik")) {
                setCenter([18.5, 73.5]); // Matches seed
            } else if (farm) {
                setCenter([18.52, 73.85]);
            }
        }
    }, [selectedFarmId, farms]);

    // Mock Polygon for visual
    const polygonCoords: [number, number][] = [
        [18.5, 73.5],
        [18.51, 73.5],
        [18.51, 73.51],
        [18.5, 73.51]
    ];

    return (
        <MapContainer
            center={defaultPosition} // Initial center
            zoom={13}
            className="w-full h-full z-0"
            zoomControl={false}
        >
            <MapController center={center} />

            {/* Base Layer: Esri World Imagery (Satellite) */}
            <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            {/* Overlay Layer: CartoDB Positron Labels Only */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            />

            {/* Search Bar Overlay - Moved to Top Right to avoid Left Panel overlap */}
            <div className="absolute top-4 right-4 z-[1000] w-64 md:w-80 flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search location..."
                        className="w-full bg-slate-900/90 text-white border border-white/20 rounded-full px-4 py-2 shadow-2xl focus:outline-none focus:border-green-500 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                        🔍
                    </button>
                    {/* Show simple result name tag if found */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full right-0 mt-2 bg-slate-900 text-xs text-green-400 p-2 rounded shadow-lg max-w-[200px] truncate">
                            {searchResults[0].display_name.split(',')[0]} (Click map to verify)
                        </div>
                    )}
                </div>

                {/* My Location Button */}
                <button
                    className="bg-slate-900/90 text-white border border-white/20 rounded-full w-10 h-10 flex items-center justify-center hover:bg-slate-800 shadow-xl"
                    onClick={() => {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                                setCenter([pos.coords.latitude, pos.coords.longitude]);
                            });
                        }
                    }}
                    title="Use My Location"
                >
                    📍
                </button>
            </div>

            {farms.map((farm) => (
                <Marker
                    key={farm.id}
                    position={farm.name.includes("Nasik") ? [18.505, 73.505] : [18.52, 73.85]}
                    icon={icon}
                >
                    <Popup>{farm.name}</Popup>
                </Marker>
            ))}

            {/* Show polygon for selected farm */}
            <Polygon positions={polygonCoords} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.2 }} />
        </MapContainer>
    );
}
