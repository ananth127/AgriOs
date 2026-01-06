
'use client';
import { trackLocationSelect, trackCurrentLocation } from '@/lib/analytics';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

function LocationMarker({ position, setPosition, setLocationName }: any) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            // Reverse geocode
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.display_name) {
                        const name = data.address.city || data.address.town || data.address.village || "Unknown Location";
                        setLocationName(name);
                        trackLocationSelect(e.latlng.lat, e.latlng.lng, name);
                    }
                })
                .catch(err => console.error("Geocoding failed", err));
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position} icon={icon}>
            <Popup>Selected Location</Popup>
        </Marker>
    );
}

export default function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number, name: string) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const [locationName, setLocationName] = useState('');

    useEffect(() => {
        if (position) {
            onLocationSelect(position.lat, position.lng, locationName);
        }
    }, [position, locationName]);

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const latlng = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
                setPosition(latlng);

                // Reverse geocode for name
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.display_name) {
                            const name = data.address.city || data.address.town || data.address.village || "Current Location";
                            setLocationName(name);
                            trackCurrentLocation(pos.coords.latitude, pos.coords.longitude, name);
                        }
                    });
            });
        }
    };

    return (
        <div className="w-full h-64 rounded-xl overflow-hidden relative border border-white/20">
            <MapContainer
                center={[20.5937, 78.9629]} // India Center
                zoom={4}
                className="w-full h-full"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <LocationMarker position={position} setPosition={setPosition} setLocationName={setLocationName} />
            </MapContainer>

            <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 text-white p-2 rounded-full shadow-lg hover:bg-slate-800 transition-colors border border-white/20"
                title="Use Current Location"
            >
                📍
            </button>

            {locationName && (
                <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 text-green-400 px-3 py-1 rounded-lg text-xs font-medium border border-green-500/30 shadow-lg">
                    {locationName}
                </div>
            )}
        </div>
    );
}
