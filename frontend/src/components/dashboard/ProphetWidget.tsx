'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function ProphetWidget({ locationName }: { locationName?: string }) {
    const [prediction, setPrediction] = useState<any>(null);

    useEffect(() => {
        const targetLocation = locationName || "Nasik"; // Fallback
        // Call Mock Prophet Engine
        api.prophet.predict({
            crop_name: "Onion",
            location: targetLocation,
            date: new Date().toISOString()
        })
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setPrediction(data[0]);
                }
            })
            .catch(err => console.error("Prophet failed", err));
    }, [locationName]);

    return (
        <div className="col-span-1 md:col-span-2 row-span-2 rounded-2xl bg-slate-900 border border-white/10 p-6 flex flex-col relative overflow-hidden group hover:border-green-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-9xl">📈</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-green-400">Agri-Prophet Engine</h2>
            <p className="text-slate-400 mb-4">Market predictions and crop suggestions based on real-time data.</p>

            <div className="mt-auto bg-slate-800 rounded-lg p-4 z-10">
                {prediction ? (
                    <>
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-white">{prediction.crop_name}</span>
                            <span className="text-green-400 font-mono">Score: {prediction.profitability_score}</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-green-500 h-full transition-all duration-1000"
                                style={{ width: `${prediction.confidence * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {(prediction.confidence * 100).toFixed(0)}% Confidence • {prediction.recommended_action}
                        </p>
                    </>
                ) : (
                    <div className="text-slate-500 animate-pulse">Consulting AI Oracle...</div>
                )}
            </div>
        </div>
    );
}
