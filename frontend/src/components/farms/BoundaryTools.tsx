'use client';

import { useState, useEffect, useRef } from 'react';
import { useMap, GeoJSON, Polygon, Polyline, Marker, useMapEvents } from 'react-leaflet';
import { api } from '@/lib/api';
import { Loader2, Wand2, Check, X, Pencil, Smartphone, Crosshair, Plus } from 'lucide-react';
import L from 'leaflet';
import { useGyroMapController } from '@/hooks/useGyroMapController';

interface BoundaryToolsProps {
    onZoneCreated?: (geometryWKT: string, details: any) => void;
    onDrawStateChange?: (isDrawing: boolean) => void;
}

export default function BoundaryTools({ onZoneCreated, onDrawStateChange }: BoundaryToolsProps) {
    const map = useMap();
    const gyro = useGyroMapController();

    // States
    const [loading, setLoading] = useState(false);
    const [detectedFeatures, setDetectedFeatures] = useState<any[]>([]);
    const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number | null>(null);

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [isGyroMode, setIsGyroMode] = useState(false); // New Gyro Mode state
    const [drawPoints, setDrawPoints] = useState<L.LatLng[]>([]);

    // History for Undo/Redo
    const [history, setHistory] = useState<L.LatLng[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Notify parent when drawing state changes
    useEffect(() => {
        if (onDrawStateChange) {
            onDrawStateChange(isDrawing);
        }
    }, [isDrawing, onDrawStateChange]);

    // Handle Gyro Activation
    useEffect(() => {
        if (isGyroMode && isDrawing) {
            gyro.start();
        } else {
            gyro.stop();
        }
    }, [isGyroMode, isDrawing]); // eslint-disable-line

    // Map Event Listener for Drawing (Manual Taps)
    const lastClickTime = useRef(0);
    useMapEvents({
        click(e) {
            // Ignore clicks on UI elements (buttons, inputs)
            const target = e.originalEvent.target as HTMLElement;
            if (target.closest('button') || target.closest('input')) return;

            // Prevent duplicate clicks (debounce 300ms)
            if (Date.now() - lastClickTime.current < 300) return;
            lastClickTime.current = Date.now();

            if (isDrawing && !isGyroMode) {
                // Prevent adding points very close to the previous one (accidental double tap)
                if (drawPoints.length > 0) {
                    const lastPoint = drawPoints[drawPoints.length - 1];
                    if (e.latlng.distanceTo(lastPoint) < 2) return; // 2 meters
                }
                const newPoints = [...drawPoints, e.latlng];
                setDrawPoints(newPoints);
                addToHistory(newPoints);
            }
        },
        mousemove(e) {
            // OptionalRubberBand
        }
    });

    const addToHistory = (points: L.LatLng[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(points);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setDrawPoints(history[newIndex]);
        } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setDrawPoints([]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setDrawPoints(history[newIndex]);
        }
    };

    const handleClear = () => {
        setDrawPoints([]);
        setHistory([]);
        setHistoryIndex(-1);
    };

    // New: Drop Point from Center (Gyro Mode)
    const handleDropPoint = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const center = map.getCenter();
        const newPoints = [...drawPoints, center];
        setDrawPoints(newPoints);
        addToHistory(newPoints);
    };

    const handleToggleGyro = () => {
        setIsGyroMode(!isGyroMode);
    };

    const handleDetect = async () => {
        setLoading(true);
        setIsDrawing(false);
        setIsGyroMode(false);
        handleClear();

        try {
            const center = map.getCenter();
            const zoom = map.getZoom();

            const res: any = await api.farms.detectBoundaries(center.lat, center.lng, zoom);
            if (res.geojson && res.geojson.features) {
                setDetectedFeatures(res.geojson.features);
                const geoJsonLayer = L.geoJSON(res.geojson);
                map.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] });
            }
        } catch (error) {
            console.error("Failed to detect boundaries", error);
            alert("AI Detection failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleStartDraw = () => {
        setIsDrawing(true);
        setDetectedFeatures([]);
        setSelectedFeatureIndex(null);
        handleClear();
        map.getContainer().style.cursor = 'crosshair';
    };

    const handleStopDraw = () => {
        setIsDrawing(false);
        setIsGyroMode(false); // Stop gyro when stopping draw
        handleClear();
        map.getContainer().style.cursor = '';
    };

    const handleFinishDraw = () => {
        if (drawPoints.length < 3) {
            alert("A zone needs at least 3 points.");
            return;
        }

        // Convert to WKT
        const points = [...drawPoints, drawPoints[0]];
        const wktPoints = points.map(p => `${p.lng} ${p.lat}`).join(", "); // Lon Lat
        const wkt = `POLYGON((${wktPoints}))`;

        if (onZoneCreated) {
            onZoneCreated(wkt, {
                type: isGyroMode ? 'gyro_zone' : 'drawn_zone',
                area_hectares: 0,
                crop_prediction: 'Custom Zone'
            });
        }

        handleStopDraw();
    };

    const handleFeatureClick = (feature: any, index: number) => {
        setSelectedFeatureIndex(index);
        setIsDrawing(false);
    };

    const handleConfirmSelection = () => {
        if (selectedFeatureIndex === null) return;
        const feature = detectedFeatures[selectedFeatureIndex];
        const coords = feature.geometry.coordinates[0];
        const wktPoints = coords.map((p: number[]) => `${p[0]} ${p[1]}`).join(", ");
        const wkt = `POLYGON((${wktPoints}))`;

        if (onZoneCreated) {
            onZoneCreated(wkt, feature.properties);
        }
        setDetectedFeatures([]);
        setSelectedFeatureIndex(null);
    };

    const handleCancelAI = () => {
        setDetectedFeatures([]);
        setSelectedFeatureIndex(null);
    };

    return (
        <>
            {/* 1. Crosshair Overlay (Always visible in Drawing Mode to indicating center) */}
            {isDrawing && (
                <div className="leaflet-bottom leaflet-left w-full h-full flex items-center justify-center pointer-events-none z-[1000] absolute inset-0">
                    <Crosshair className="w-8 h-8 text-black/50 drop-shadow-md" strokeWidth={1} />
                    <div className="absolute w-1 h-1 bg-red-500 rounded-full"></div>

                    {/* Debug Info & Status (Only if Gyro Active) */}
                    {isGyroMode && (
                        <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none">
                            <div className="bg-slate-900/80 text-white text-[10px] p-2 rounded-lg backdrop-blur font-mono flex flex-col items-center gap-1 border border-white/20 shadow-xl max-w-[200px] text-center">
                                <div className="font-bold text-xs uppercase text-slate-400">{gyro.status === 'active' ? 'Gyro Active' : gyro.status}</div>

                                {gyro.status === 'active' ? (
                                    <>
                                        <div>β: {gyro.orientation?.beta?.toFixed(1) || '0.0'}° | γ: {gyro.orientation?.gamma?.toFixed(1) || '0.0'}°</div>
                                        {(!gyro.lastEventTime || Date.now() - gyro.lastEventTime > 2000) && (
                                            <div className="text-red-400 font-bold bg-red-500/10 px-1 py-0.5 rounded">⚠ No Sensor Data</div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-red-400 font-bold">
                                        {gyro.error || "Waiting for user..."}
                                    </div>
                                )}

                                {gyro.status === 'error' && (
                                    <button className="pointer-events-auto bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-[10px] mt-1" onClick={() => gyro.start()}>
                                        Retry
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 2. Top Center Toolbar (Drawing Mode) */}
            {isDrawing && (
                <div className="leaflet-top leaflet-left w-full flex justify-center mt-4 pointer-events-none" style={{ left: 0, right: 0 }}>
                    <div className="pointer-events-auto bg-slate-900/90 backdrop-blur text-white p-2 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20">

                        {/* Toggle Gyro */}
                        <button
                            onClick={handleToggleGyro}
                            className={`p-2 rounded-lg transition-colors ${isGyroMode ? 'bg-blue-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}
                            title="Toggle Gyroscope Control"
                        >
                            <Smartphone className="w-5 h-5" />
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-1"></div>

                        <div className="flex items-center gap-1">
                            <button onClick={handleUndo} disabled={historyIndex < 0} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors">
                                <span className="text-lg">↩️</span>
                            </button>
                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors">
                                <span className="text-lg">↪️</span>
                            </button>
                            <button onClick={handleClear} disabled={drawPoints.length === 0} className="p-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg disabled:opacity-30 transition-colors">
                                <span className="text-lg">🗑️</span>
                            </button>
                        </div>

                        <div className="h-6 w-px bg-white/10 mx-1"></div>

                        {/* Save/Cancel */}
                        <div className="flex items-center gap-2">
                            <button onClick={handleStopDraw} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleFinishDraw} disabled={drawPoints.length < 3} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg disabled:opacity-50 transition-all flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Drop Point Button (Visible in Drawing Mode - Both Mobile & Desktop) */}
            {isDrawing && (
                <div
                    className="leaflet-bottom leaflet-right w-full flex justify-center mb-12 pointer-events-none"
                    style={{ left: 0, right: 0, zIndex: 10000 }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={(e) => handleDropPoint(e)}
                        className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white rounded-full p-6 shadow-2xl border-4 border-white/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
                        title="Add Point at center (Crosshair)"
                    >
                        <Plus className="w-8 h-8" strokeWidth={3} />
                    </button>
                </div>
            )}

            {/* 4. Control Panel (Standard Mode) */}
            {!isDrawing && (
                <div className="leaflet-top leaflet-right" style={{ top: '90px', right: '10px', pointerEvents: 'auto', zIndex: 1000 }}>
                    <div className="leaflet-control flex flex-col gap-2 shadow-none border-none">
                        {/* Main Toolbar */}
                        {!detectedFeatures.length && (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleDetect}
                                    disabled={loading}
                                    className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-slate-600 rounded-lg p-2 shadow-xl flex items-center gap-2 font-bold transition-all w-full justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Wand2 className="w-5 h-5 text-purple-600" />}
                                        <span className="hidden md:inline">AI Smart Detect</span>
                                    </span>
                                </button>

                                <button
                                    onClick={handleStartDraw}
                                    className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-slate-600 rounded-lg p-2 shadow-xl flex items-center gap-2 font-bold transition-all w-full justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <Pencil className="w-5 h-5 text-blue-600" />
                                        <span className="hidden md:inline">Draw Manually</span>
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* AI Selection Mode */}
                        {!!detectedFeatures.length && (
                            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2 min-w-[200px]">
                                <div className="text-xs font-bold text-slate-500 uppercase px-1">
                                    {selectedFeatureIndex !== null ? "Zone Prediction" : "Select a Zone"}
                                </div>
                                {selectedFeatureIndex !== null && (
                                    <div className="text-xs p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-100 dark:border-purple-800 mb-2">
                                        <span className="font-bold text-purple-600">AI Confidence: {(detectedFeatures[selectedFeatureIndex].properties.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleConfirmSelection}
                                        disabled={selectedFeatureIndex === null}
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-white p-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Check className="w-3 h-3" /> Add
                                    </button>
                                    <button
                                        onClick={handleCancelAI}
                                        className="px-2 bg-slate-200 hover:bg-slate-300 text-slate-600 p-1.5 rounded text-xs font-bold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Drawing Layer */}
            {isDrawing && drawPoints.length > 0 && (
                <>
                    <Polyline positions={drawPoints} color="#3b82f6" weight={3} dashArray="5,5" />
                    {drawPoints.map((p, i) => (
                        <Marker
                            key={i}
                            position={p}
                            icon={L.divIcon({
                                className: 'bg-white border-2 border-blue-600 rounded-full w-3 h-3',
                                iconSize: [12, 12]
                            })}
                        />
                    ))}
                    {drawPoints.length > 2 && (
                        <Polygon positions={drawPoints} color="#3b82f6" weight={1} fillOpacity={0.2} />
                    )}
                </>
            )}

            {/* AI Results Layer */}
            {detectedFeatures.map((feature, idx) => {
                const isSelected = selectedFeatureIndex === idx;
                return (
                    <GeoJSON
                        key={feature.id}
                        data={feature}
                        style={() => ({
                            color: isSelected ? '#16a34a' : '#9333ea',
                            weight: isSelected ? 3 : 2,
                            opacity: 1,
                            fillColor: isSelected ? '#22c55e' : '#a855f7',
                            fillOpacity: isSelected ? 0.4 : 0.2,
                            dashArray: isSelected ? undefined : '5, 5'
                        })}
                        eventHandlers={{
                            click: () => handleFeatureClick(feature, idx)
                        }}
                    />
                );
            })}
        </>
    );
}
