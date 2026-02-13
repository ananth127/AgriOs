/**
 * Smart Irrigation Dashboard
 * VRI zone management with AI predictions and water usage analytics
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Droplets,
    Plus,
    RefreshCw,
    Play,
    Square,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Cloud,
    Thermometer,
    Wind,
    Sun,
    Loader2,
} from 'lucide-react';

interface Zone {
    id: number;
    name: string;
    soil_type: string | null;
    crop_type: string | null;
    crop_stage: string | null;
    crop_coefficient: number;
    target_moisture: number | null;
    area_hectares: number | null;
    is_active: boolean;
    last_irrigation: string | null;
}

interface Prediction {
    id: number;
    zone_id: number;
    prediction_date: string;
    predicted_etc: number | null;
    predicted_moisture: number | null;
    recommended_irrigation: number | null;
    confidence: number | null;
}

interface WaterUsage {
    period_days: number;
    total_events: number;
    total_volume_liters: number;
    total_duration_minutes: number;
    average_volume_per_event: number;
    events_by_type: Record<string, number>;
}

interface IrrigationDashboardProps {
    apiBaseUrl?: string;
}

export function IrrigationDashboard({ apiBaseUrl = '/api/v1' }: IrrigationDashboardProps) {
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [waterUsage, setWaterUsage] = useState<WaterUsage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isIrrigating, setIsIrrigating] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

            const [zonesRes, usageRes] = await Promise.all([
                fetch(`${apiBaseUrl}/irrigation/zones`, { headers }),
                fetch(`${apiBaseUrl}/irrigation/analytics/water-usage?days=30`, { headers }),
            ]);

            if (zonesRes.ok) {
                const zonesData = await zonesRes.json();
                setZones(zonesData);
                if (zonesData.length > 0 && !selectedZone) {
                    setSelectedZone(zonesData[0]);
                }
            }

            if (usageRes.ok) {
                setWaterUsage(await usageRes.json());
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    }, [apiBaseUrl, selectedZone]);

    // Fetch predictions when zone changes
    useEffect(() => {
        if (selectedZone) {
            fetchPredictions(selectedZone.id);
        }
    }, [selectedZone]);

    const fetchPredictions = async (zoneId: number) => {
        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

            const res = await fetch(`${apiBaseUrl}/irrigation/zones/${zoneId}/predictions`, { headers });
            if (res.ok) {
                setPredictions(await res.json());
            }
        } catch {
            console.warn('Could not fetch predictions');
        }
    };

    const generatePredictions = async () => {
        if (!selectedZone) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiBaseUrl}/irrigation/zones/${selectedZone.id}/predictions?days=3`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            if (res.ok) {
                const newPredictions = await res.json();
                setPredictions(newPredictions);
            }
        } catch (err) {
            setError('Failed to generate predictions');
        }
    };

    const startIrrigation = async (zoneId: number) => {
        setIsIrrigating(zoneId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${apiBaseUrl}/irrigation/zones/${zoneId}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({ trigger_reason: 'manual' }),
            });

            if (res.ok) {
                await fetchData();
            }
        } catch {
            setError('Failed to start irrigation');
        } finally {
            setIsIrrigating(null);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const getMoistureColor = (moisture: number | null) => {
        if (!moisture) return 'text-gray-400';
        if (moisture >= 35) return 'text-green-500';
        if (moisture >= 25) return 'text-yellow-500';
        return 'text-red-500';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Droplets className="w-8 h-8 text-blue-500" />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Irrigation</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Variable Rate Irrigation with AI predictions
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Water Usage Overview */}
            {waterUsage && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Total Events</span>
                            <Droplets className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                            {waterUsage.total_events}
                        </div>
                        <span className="text-xs text-gray-500">Last 30 days</span>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Water Used</span>
                            <TrendingUp className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                            {(waterUsage.total_volume_liters / 1000).toFixed(1)}
                        </div>
                        <span className="text-xs text-gray-500">Kiloliters</span>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Active Zones</span>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                            {zones.filter((z) => z.is_active).length}
                        </div>
                        <span className="text-xs text-gray-500">of {zones.length} total</span>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Avg Duration</span>
                            <Cloud className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                            {waterUsage.total_duration_minutes.toFixed(0)}
                        </div>
                        <span className="text-xs text-gray-500">Minutes</span>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Zones List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                    <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Irrigation Zones</h3>
                        <button className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                            <Plus className="w-4 h-4" />
                            Add
                        </button>
                    </div>

                    <div className="divide-y dark:divide-gray-700 max-h-96 overflow-y-auto">
                        {zones.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Droplets className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No zones configured</p>
                            </div>
                        ) : (
                            zones.map((zone) => (
                                <div
                                    key={zone.id}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${selectedZone?.id === zone.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                    onClick={() => setSelectedZone(zone)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{zone.name}</h4>
                                            <p className="text-sm text-gray-500">
                                                {zone.crop_type || 'No crop'} • {zone.area_hectares?.toFixed(1) || '?'} ha
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startIrrigation(zone.id);
                                            }}
                                            disabled={isIrrigating === zone.id}
                                            className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 hover:bg-blue-200 disabled:opacity-50"
                                        >
                                            {isIrrigating === zone.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Play className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Selected Zone Details */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedZone ? (
                        <>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {selectedZone.name}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${selectedZone.is_active
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        {selectedZone.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Crop</span>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedZone.crop_type || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Stage</span>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedZone.crop_stage || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Kc</span>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedZone.crop_coefficient.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Target Moisture</span>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedZone.target_moisture?.toFixed(0) || '-'}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Predictions */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-purple-500" />
                                        AI Irrigation Predictions
                                    </h3>
                                    <button
                                        onClick={generatePredictions}
                                        className="text-sm text-purple-500 hover:text-purple-600 flex items-center gap-1"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Generate
                                    </button>
                                </div>

                                {predictions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Cloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No predictions available</p>
                                        <button
                                            onClick={generatePredictions}
                                            className="mt-2 text-sm text-purple-500 hover:underline"
                                        >
                                            Generate predictions
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {predictions.slice(0, 3).map((pred) => (
                                            <div
                                                key={pred.id}
                                                className="border dark:border-gray-700 rounded-lg p-4"
                                            >
                                                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                    {formatDate(pred.prediction_date)}
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 flex items-center gap-1">
                                                            <Thermometer className="w-3 h-3" />
                                                            ETc
                                                        </span>
                                                        <span>{pred.predicted_etc?.toFixed(1) || '-'} mm</span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 flex items-center gap-1">
                                                            <Droplets className="w-3 h-3" />
                                                            Moisture
                                                        </span>
                                                        <span className={getMoistureColor(pred.predicted_moisture)}>
                                                            {pred.predicted_moisture?.toFixed(0) || '-'}%
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between font-medium">
                                                        <span className="text-gray-500">Recommended</span>
                                                        <span className="text-blue-600">
                                                            {pred.recommended_irrigation?.toFixed(1) || 0} mm
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-2 border-t dark:border-gray-700">
                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                        <span>Confidence</span>
                                                        <span>{((pred.confidence || 0) * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded">
                                                        <div
                                                            className="h-1 bg-purple-500 rounded"
                                                            style={{ width: `${(pred.confidence || 0) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center text-gray-500">
                            <Droplets className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Select a zone to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default IrrigationDashboard;
