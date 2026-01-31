'use client';

import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.5 });
    }, [center, zoom, map]);
    return null;
}

interface FarmMapProps {
    farms: any[];
    selectedFarmId?: number;
    viewCenter?: [number, number] | null;
    userLocation?: [number, number] | null;
}

// Custom User Location Icon (Red)
const userIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

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

interface FarmMapProps {
    farms: any[];
    selectedFarmId?: number;
    viewCenter?: [number, number] | null;
    userLocation?: [number, number] | null;
    activeZone?: string;
    zones?: any[];
}

export default function FarmMap({ farms, selectedFarmId, viewCenter, userLocation, activeZone = 'all', zones }: FarmMapProps) {
    const t = useTranslations('FarmMap');
    // Priority:
    // 1. View Center (Search Result)
    // 2. Selected Farm
    // 3. User Land Location (from Profile/Database)
    // 4. User Current Location (GPS)
    // 5. Fallback (Pune/India/Default)

    const fallbackPosition: [number, number] = [18.5204, 73.8567]; // Default Fallback (Pune)

    // Initialize center with User Location if available right away, otherwise Fallback
    const [center, setCenter] = useState<[number, number]>(userLocation || fallbackPosition);
    const [zoom, setZoom] = useState(13); // Default zoom
    const [hasInitialized, setHasInitialized] = useState(false);

    // Main Centering Logic
    useEffect(() => {
        // 1. Explicit View Center (Search) - Highest Priority
        if (viewCenter) {
            setCenter(viewCenter);
            setZoom(18); // Street level
            return;
        }

        // 2. Selected Farm Location
        if (selectedFarmId && farms.length > 0) {
            const farm = farms.find(f => f.id === selectedFarmId);
            if (farm && farm.latitude && farm.longitude) {
                setCenter([farm.latitude, farm.longitude]);
                setZoom(20); // Extremely close zoom (digital)
                return;
            }
        }

        // 3. User Profile Location (Land Location from DB)
        if (userLocation && !selectedFarmId) {
            setCenter(userLocation);
            setZoom(20); // Extremely close zoom (digital)
            return;
        }

        // 4. GPS Location - Auto-detect on mount if nothing else fits (and no land location set)
        if (!hasInitialized && !selectedFarmId && !viewCenter && !userLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCenter([pos.coords.latitude, pos.coords.longitude]);
                    setZoom(16); // City level for GPS
                },
                (err) => console.warn("Geolocation access denied or failed", err),
                { enableHighAccuracy: true }
            );
            setHasInitialized(true);
        }
    }, [selectedFarmId, farms, viewCenter, userLocation, hasInitialized]);

    // Calculate Grid Center
    const targetGridLocation = useMemo(() => {
        if (selectedFarmId && farms.length > 0) {
            const f = farms.find(f => f.id === selectedFarmId);
            if (f?.latitude) return new L.LatLng(f.latitude, f.longitude);
        }
        if (userLocation) return new L.LatLng(userLocation[0], userLocation[1]);
        return null;
    }, [selectedFarmId, farms, userLocation]);


    // Repositioned My Location Button (Above Mic)
    return (
        <MapContainer
            center={fallbackPosition}
            zoom={13}
            className="w-full h-full z-0"
            zoomControl={false}
        >
            <MapController center={center} zoom={zoom} />

            {/* Base Layer: Google Satellite */}
            <TileLayer
                attribution='&copy; Google Maps'
                url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                maxZoom={22}
                maxNativeZoom={19}
                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />

            {/* Overlay Layer: CartoDB Positron Labels Only */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            />

            {/* Zone Grid Visualization */}
            <ZoneGrid center={targetGridLocation} activeZoneId={activeZone} />

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
                    title={t('use_my_location')}
                >
                    <span className="text-xl">📍</span>
                </button>
            </div>

            {/* User Land Location Marker */}
            {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                    <Popup>{t('my_land_location')}</Popup>
                </Marker>
            )}

            {farms.map((farm) => {
                const hasBoundary = farm.boundary && Array.isArray(farm.boundary) && farm.boundary.length > 0;
                const hasLocation = farm.latitude && farm.longitude;

                return (
                    <div key={farm.id}>
                        {/* 1. Farm Marker */}
                        {hasLocation && (
                            <Marker
                                position={[farm.latitude, farm.longitude]}
                                icon={icon}
                            >
                                <Popup>
                                    <div className="text-center">
                                        <div className="font-bold">{farm.name}</div>
                                        {farm.survey_number && <div className="text-xs text-gray-500">{t('survey_no')}: {farm.survey_number}</div>}
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* 2. Farm Boundary (Patta/Cadastral Map) */}
                        {hasBoundary && (
                            <Polygon
                                positions={farm.boundary}
                                pathOptions={{
                                    color: '#FACC15', // Yellow (visible on satellite)
                                    weight: 2,
                                    fillColor: '#FACC15',
                                    fillOpacity: 0.1,
                                    dashArray: '5, 5' // Dashed line for boundary
                                }}
                            >
                                <Popup>
                                    <span className="font-semibold text-xs">{t('correction_boundary')}: {farm.name}</span>
                                </Popup>
                            </Polygon>
                        )}
                    </div>
                );
            })}
        </MapContainer>
    );
}
