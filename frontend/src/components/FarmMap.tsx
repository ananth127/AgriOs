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
    viewCenter?: [number, number] | null;
}

export default function FarmMap({ farms, selectedFarmId, viewCenter }: FarmMapProps) {
    const defaultPosition: [number, number] = [18.5204, 73.8567]; // Pune default
    const [center, setCenter] = useState<[number, number]>(defaultPosition);

    // Sync with external viewCenter prop
    useEffect(() => {
        if (viewCenter) {
            setCenter(viewCenter);
        }
    }, [viewCenter]);

    // Auto-detect user location on mount if no selection
    useEffect(() => {
        if (!selectedFarmId && !viewCenter && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCenter([pos.coords.latitude, pos.coords.longitude]);
                },
                (err) => console.warn("Geolocation access denied or failed", err),
                { enableHighAccuracy: true }
            );
        }
    }, [selectedFarmId, viewCenter]);

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

    // Repositioned My Location Button (Above Mic)
    return (
        <MapContainer
            center={defaultPosition}
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

            {/* My Location Button - Fixed above Voice Mic (bottom-8 + h-16 + gap) ~ 32 + 64 + 20 = 116px. Using bottom-32 (128px) */}
            <div className="absolute bottom-48 right-6 z-[400]">
                <button
                    className="bg-slate-900/90 text-white border border-white/20 rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-600 transition-colors shadow-2xl"
                    onClick={() => {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                                setCenter([pos.coords.latitude, pos.coords.longitude]);
                            });
                        }
                    }}
                    title="Use My Location"
                >
                    <span className="text-xl">📍</span>
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
