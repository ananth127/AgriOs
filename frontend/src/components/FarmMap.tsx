'use client';

import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import '../styles/leaflet-patched.css';
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
interface MapControllerProps {
    center?: [number, number];
    zoom?: number;
    bounds?: L.LatLngBoundsExpression;
}

function MapController({ center, zoom, bounds }: MapControllerProps) {
    const map = useMap();

    useEffect(() => {
        if (bounds) {
            map.flyToBounds(bounds as L.LatLngBoundsExpression, { duration: 1.5, padding: [50, 50] });
        } else if (center && zoom) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, bounds, map]);
    return null;
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
    const t = useTranslations('FarmMap');
    if (!center) return null;

    // ~50m offset for visual grid (represents ~2.5 acres total)
    const d = 0.00045;
    const lat = center.lat;
    const lng = center.lng;

    // Define 4 quadrants
    // Define 4 quadrants
    const quadrants = [
        { id: '1', name: t('zone_ne'), color: 'blue', positions: [[lat, lng], [lat + d, lng], [lat + d, lng + d], [lat, lng + d]] as [number, number][] }, // NE
        { id: '2', name: t('zone_se'), color: 'green', positions: [[lat, lng], [lat - d, lng], [lat - d, lng + d], [lat, lng + d]] as [number, number][] }, // SE
        { id: '3', name: t('zone_sw'), color: 'orange', positions: [[lat, lng], [lat - d, lng], [lat - d, lng - d], [lat, lng - d]] as [number, number][] }, // SW
        { id: '4', name: t('zone_nw'), color: 'purple', positions: [[lat, lng], [lat + d, lng], [lat + d, lng - d], [lat, lng - d]] as [number, number][] }, // NW
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
    onDeleteZone?: (zoneId: number) => void;
    children?: React.ReactNode;
}

export default function FarmMap({ farms, selectedFarmId, viewCenter, userLocation, activeZone = 'all', zones, onDeleteZone, children }: FarmMapProps) {
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
    const [bounds, setBounds] = useState<L.LatLngBoundsExpression | undefined>(undefined);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Main Centering Logic
    useEffect(() => {
        // 1. Explicit View Center (Search) - Highest Priority
        if (viewCenter) {
            setCenter(viewCenter);
            setZoom(18); // Street level
            setBounds(undefined); // Clear bounds
            return;
        }

        // 2. Selected Farm Location
        if (selectedFarmId && farms.length > 0) {
            const farm = farms.find(f => f.id === selectedFarmId);
            if (farm && farm.latitude && farm.longitude) {
                setCenter([farm.latitude, farm.longitude]);
                setZoom(18); // Close zoom for specific farm
                setBounds(undefined); // Clear bounds to focus on point
                return;
            }
        }

        // 3. "View All" Mode (No specific farm selected) OR fallback
        if (!selectedFarmId) {
            // Collect all points of interest
            const points: L.LatLng[] = [];

            // Add User Location
            if (userLocation) {
                points.push(L.latLng(userLocation[0], userLocation[1]));
            }

            // Add Farm Locations
            farms.forEach(f => {
                if (f.latitude && f.longitude) {
                    points.push(L.latLng(f.latitude, f.longitude));
                }
                // Add Polygon Points if available
                if (f.boundary && Array.isArray(f.boundary)) {
                    f.boundary.forEach((p: [number, number]) => points.push(L.latLng(p[0], p[1])));
                }
            });

            if (points.length > 1) {
                // If we have multiple points, fit bounds
                const newBounds = L.latLngBounds(points);
                setBounds(newBounds);
                // Center/Zoom will be ignored by MapController if bounds are set
            } else if (points.length === 1) {
                // Only one point (likely just User Location), center on it
                setCenter([points[0].lat, points[0].lng]);
                setZoom(16);
                setBounds(undefined);
            } else if (!hasInitialized && navigator.geolocation) {
                // 4. GPS Fallback if absolutely no data
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setCenter([pos.coords.latitude, pos.coords.longitude]);
                        setZoom(15);
                    },
                    (err) => console.warn("Geolocation denied", err)
                );
                setHasInitialized(true);
            }
        }

    }, [selectedFarmId, farms, viewCenter, userLocation, hasInitialized]);

    // Calculate Grid Center for Zone Grid (always keep consistent)
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
            <MapController center={center} zoom={zoom} bounds={bounds} />

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

            {/* Real Zone Boundaries (from DB/Manual Draw) */}
            {zones?.map((zone) => {
                if (zone.boundary && Array.isArray(zone.boundary) && zone.boundary.length > 0) {
                    const isSelected = activeZone === String(zone.id);
                    return (
                        <Polygon
                            key={`zone-${zone.id}`}
                            positions={zone.boundary}
                            pathOptions={{
                                color: zone.details?.color || (isSelected ? '#22c55e' : '#9333ea'), // Green if active, Purple otherwise
                                weight: isSelected ? 3 : 2,
                                fillColor: zone.details?.color || (isSelected ? '#22c55e' : '#9333ea'),
                                fillOpacity: isSelected ? 0.4 : 0.2,
                                dashArray: isSelected ? undefined : '5, 5'
                            }}
                        >
                            <Popup>
                                <div className="text-center">
                                    <div className="font-bold">{zone.name}</div>
                                    <div className="text-xs text-slate-500">{t('crop') || 'Crop'}: {zone.details?.crop || 'None'}</div>
                                    <div className="text-xs text-slate-500">{t('status') || 'Status'}: {zone.details?.status || 'Active'}</div>
                                    {onDeleteZone && !zone.isPlaceholder && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent map click
                                                onDeleteZone(zone.id);
                                            }}
                                            className="mt-2 text-[10px] bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded w-full"
                                        >
                                            Delete Zone
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Polygon>
                    );
                }
                return null;
            })}

            {farms.map((farm) => {
                const hasBoundary = farm.boundary && Array.isArray(farm.boundary) && farm.boundary.length > 0;
                const hasLocation = farm.latitude && farm.longitude;

                return (
                    <div key={farm.id}>
                        {/* 1. Farm Marker */}
                        {/* Blue Marker Removed per user request */}

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
            {/* Inject additional layers/controls */}
            {children}
        </MapContainer>
    );
}
