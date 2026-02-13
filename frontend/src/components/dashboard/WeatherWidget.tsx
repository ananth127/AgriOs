'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function WeatherWidget({ lat, lng, locationName }: { lat?: number, lng?: number, locationName?: string }) {
    const [weather, setWeather] = useState<any>(null);

    useEffect(() => {
        const targetLat = lat || 19.99;
        const targetLng = lng || 73.78;

        // Fetch from Backend (Phase 2.2)
        api.weather.getAdvisory(targetLat, targetLng)
            .then((data: any) => {
                setWeather({
                    temp: data.forecast.current_temp,
                    humidity: data.forecast.current_humidity,
                    condition: data.forecast.condition,
                    advisories: data.advisories
                });
            })
            .catch(err => console.error("Weather advisory fetch failed", err));
    }, [lat, lng]);

    return (
        <div className="col-span-1 row-span-1 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 border border-white/10 p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-1 text-indigo-300">{locationName || "Local"} Weather</h2>
            {weather ? (
                <>
                    <div className="text-4xl font-bold my-2">{weather.temp}°C</div>
                    <p className="text-indigo-200/60 text-sm mb-2">
                        Humidity {weather.humidity}% • {weather.condition}
                    </p>
                    {weather.advisories && weather.advisories.length > 0 && (
                        <div className="mt-2 text-xs bg-red-500/20 text-red-200 p-2 rounded-lg border border-red-500/30">
                            ⚠️ {weather.advisories[0].risk_level} Risk: {weather.advisories[0].disease_name}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-indigo-400/50 animate-pulse mt-4">Loading...</div>
            )}
        </div>
    );
}
