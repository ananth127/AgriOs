'use client';

import { useEffect, useState } from 'react';

export default function WeatherWidget({ lat, lng, locationName }: { lat?: number, lng?: number, locationName?: string }) {
    const [weather, setWeather] = useState<any>(null);

    useEffect(() => {
        // Fallback to Nasik if no props
        const targetLat = lat || 19.99;
        const targetLng = lng || 73.78;

        // Fetch Real Weather from Open-Meteo (Free, No Key)
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLng}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m`)
            .then(res => res.json())
            .then(data => {
                setWeather({
                    temp: data.current.temperature_2m,
                    humidity: data.current.relative_humidity_2m,
                    code: data.current.weather_code
                });
            })
            .catch(err => console.error("Weather fetch failed", err));
    }, []);

    return (
        <div className="col-span-1 row-span-1 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 border border-white/10 p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-1 text-indigo-300">{locationName || "Local"} Weather</h2>
            {weather ? (
                <>
                    <div className="text-4xl font-bold my-2">{weather.temp}°C</div>
                    <p className="text-indigo-200/60 text-sm">
                        Humidity {weather.humidity}% •
                        {weather.code < 3 ? ' Clear' : weather.code < 50 ? ' Cloudy' : ' Rainy'}
                    </p>
                </>
            ) : (
                <div className="text-indigo-400/50 animate-pulse mt-4">Loading...</div>
            )}
        </div>
    );
}
