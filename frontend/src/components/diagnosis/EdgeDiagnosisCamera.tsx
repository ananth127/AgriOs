/**
 * Edge AI Diagnosis Camera Component
 * Enables offline-capable plant disease detection using device camera
 */

'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useEdgeDiagnosis } from '@/lib/edge-inference/useEdgeDiagnosis';
import { Camera, Upload, RefreshCw, AlertCircle, CheckCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface EdgeDiagnosisCameraProps {
    onDiagnosisComplete?: (result: {
        disease: string;
        confidence: number;
        treatment: Record<string, unknown>;
    }) => void;
    cropType?: string;
}

export function EdgeDiagnosisCamera({ onDiagnosisComplete, cropType = 'Unknown' }: EdgeDiagnosisCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const {
        isModelLoading,
        isModelReady,
        isAnalyzing,
        modelVersion,
        updateAvailable,
        lastResult,
        lastTreatment,
        error,
        loadModel,
        updateModel,
        startCamera,
        stopCamera,
        captureAndAnalyze,
        analyzeFile,
        clearResult,
    } = useEdgeDiagnosis();

    // Handle camera toggle
    const handleCameraToggle = useCallback(async () => {
        if (isCameraActive) {
            stopCamera();
            setIsCameraActive(false);
        } else if (videoRef.current) {
            const success = await startCamera(videoRef.current);
            setIsCameraActive(success);
        }
    }, [isCameraActive, startCamera, stopCamera]);

    // Handle capture
    const handleCapture = useCallback(async () => {
        if (!isCameraActive) return;

        // Capture current frame as image for display
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                setCapturedImage(canvas.toDataURL('image/jpeg'));
            }
        }

        const analysis = await captureAndAnalyze();
        if (analysis && onDiagnosisComplete) {
            onDiagnosisComplete({
                disease: analysis.result.disease,
                confidence: analysis.result.confidence,
                treatment: analysis.treatment as Record<string, unknown>,
            });
        }
    }, [isCameraActive, captureAndAnalyze, onDiagnosisComplete]);

    // Handle file upload
    const handleFileUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            // Show preview
            setCapturedImage(URL.createObjectURL(file));

            const analysis = await analyzeFile(file);
            if (analysis && onDiagnosisComplete) {
                onDiagnosisComplete({
                    disease: analysis.result.disease,
                    confidence: analysis.result.confidence,
                    treatment: analysis.treatment as Record<string, unknown>,
                });
            }
        },
        [analyzeFile, onDiagnosisComplete]
    );

    // Get confidence color
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return 'text-green-500';
        if (confidence >= 0.7) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-500" />
                    Edge AI Diagnosis
                    {navigator.onLine ? (
                        <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-orange-500" />
                    )}
                </h3>

                {modelVersion && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        v{modelVersion}
                        {updateAvailable && (
                            <button
                                onClick={updateModel}
                                className="ml-2 text-blue-500 hover:text-blue-600"
                                title="Update available"
                            >
                                <RefreshCw className="w-3 h-3 inline" />
                            </button>
                        )}
                    </span>
                )}
            </div>

            {/* Model Status */}
            {!isModelReady && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center gap-2">
                    {isModelLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                            <span className="text-sm text-blue-700 dark:text-blue-300">Loading AI model...</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-blue-700 dark:text-blue-300">Model not loaded</span>
                            <button
                                onClick={() => loadModel()}
                                className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            >
                                Load Now
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Camera View */}
            <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-video">
                {capturedImage && !isCameraActive ? (
                    <img
                        src={capturedImage}
                        alt="Captured plant"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <video
                        ref={videoRef}
                        className={`w-full h-full object-cover ${isCameraActive ? '' : 'hidden'}`}
                        playsInline
                        muted
                    />
                )}

                {!isCameraActive && !capturedImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <Camera className="w-12 h-12 mb-2" />
                        <span className="text-sm">Camera not active</span>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <span className="text-sm">Analyzing...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
                <button
                    onClick={handleCameraToggle}
                    disabled={isAnalyzing}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isCameraActive
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                >
                    <Camera className="w-4 h-4" />
                    {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                </button>

                {isCameraActive && (
                    <button
                        onClick={handleCapture}
                        disabled={isAnalyzing || !isModelReady}
                        className="flex-1 py-2 px-4 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Camera className="w-4 h-4" />
                        Capture & Analyze
                    </button>
                )}

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAnalyzing || !isModelReady}
                    className="py-2 px-4 rounded-lg font-medium bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                    <Upload className="w-4 h-4" />
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Results */}
            {lastResult && (
                <div className="border dark:border-gray-600 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {lastResult.disease.toLowerCase() === 'healthy' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                            )}
                            <span className="font-semibold text-gray-900 dark:text-white">{lastResult.disease}</span>
                        </div>
                        <span className={`font-medium ${getConfidenceColor(lastResult.confidence)}`}>
                            {(lastResult.confidence * 100).toFixed(1)}% confident
                        </span>
                    </div>

                    {lastResult.isOffline && (
                        <div className="text-xs text-orange-500 flex items-center gap-1">
                            <WifiOff className="w-3 h-3" />
                            Analyzed offline
                        </div>
                    )}

                    <div className="text-xs text-gray-500">
                        Inference time: {lastResult.inferenceTimeMs.toFixed(0)}ms
                    </div>

                    {/* Treatment Info */}
                    {lastTreatment && lastResult.disease.toLowerCase() !== 'healthy' && (
                        <div className="mt-3 pt-3 border-t dark:border-gray-600 space-y-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">Treatment Recommendations</h4>

                            {lastTreatment.cause && (
                                <div className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Cause:</span>{' '}
                                    <span className="text-gray-600 dark:text-gray-400">{lastTreatment.cause}</span>
                                </div>
                            )}

                            {lastTreatment.prevention && (
                                <div className="text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Prevention:</span>{' '}
                                    <span className="text-gray-600 dark:text-gray-400">{lastTreatment.prevention}</span>
                                </div>
                            )}

                            {lastTreatment.treatment_organic && (
                                <div className="text-sm">
                                    <span className="font-medium text-green-600 dark:text-green-400">🌿 Organic:</span>{' '}
                                    <span className="text-gray-600 dark:text-gray-400">{lastTreatment.treatment_organic}</span>
                                </div>
                            )}

                            {lastTreatment.treatment_chemical && (
                                <div className="text-sm">
                                    <span className="font-medium text-blue-600 dark:text-blue-400">💊 Chemical:</span>{' '}
                                    <span className="text-gray-600 dark:text-gray-400">{lastTreatment.treatment_chemical}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={clearResult}
                        className="w-full mt-2 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        Clear Result
                    </button>
                </div>
            )}
        </div>
    );
}

export default EdgeDiagnosisCamera;
