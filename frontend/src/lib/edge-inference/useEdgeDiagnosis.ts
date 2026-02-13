/**
 * React hook for edge AI disease detection
 * Provides easy-to-use interface for camera capture and diagnosis
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { edgeInference, DiagnosisResult, TreatmentInfo } from './index';

interface UseEdgeDiagnosisOptions {
    apiBaseUrl?: string;
    autoLoadModel?: boolean;
    checkUpdatesOnMount?: boolean;
}

interface EdgeDiagnosisState {
    isModelLoading: boolean;
    isModelReady: boolean;
    isAnalyzing: boolean;
    modelVersion: string | null;
    updateAvailable: boolean;
    lastResult: DiagnosisResult | null;
    lastTreatment: TreatmentInfo | null;
    error: string | null;
}

export function useEdgeDiagnosis(options: UseEdgeDiagnosisOptions = {}) {
    const {
        apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
        autoLoadModel = true,
        checkUpdatesOnMount = true,
    } = options;

    const [state, setState] = useState<EdgeDiagnosisState>({
        isModelLoading: false,
        isModelReady: false,
        isAnalyzing: false,
        modelVersion: null,
        updateAvailable: false,
        lastResult: null,
        lastTreatment: null,
        error: null,
    });

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Initialize and load model
    useEffect(() => {
        if (autoLoadModel) {
            loadModel();
        }

        if (checkUpdatesOnMount) {
            checkForUpdates();
        }

        // Cleanup on unmount
        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load the ML model
    const loadModel = useCallback(async (forceRefresh = false) => {
        setState((prev) => ({ ...prev, isModelLoading: true, error: null }));

        try {
            const success = await edgeInference.loadModel(forceRefresh);

            if (success) {
                const config = edgeInference.getConfig();
                setState((prev) => ({
                    ...prev,
                    isModelLoading: false,
                    isModelReady: true,
                    modelVersion: config.version,
                }));
            } else {
                setState((prev) => ({
                    ...prev,
                    isModelLoading: false,
                    error: 'Failed to load model',
                }));
            }
        } catch (error) {
            setState((prev) => ({
                ...prev,
                isModelLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }));
        }
    }, []);

    // Check for model updates
    const checkForUpdates = useCallback(async () => {
        try {
            const result = await edgeInference.checkForUpdates(apiBaseUrl);
            setState((prev) => ({
                ...prev,
                updateAvailable: result.updateAvailable,
            }));

            if (result.updateAvailable && result.config) {
                edgeInference.setConfig(result.config);
            }
        } catch {
            console.warn('Could not check for model updates');
        }
    }, [apiBaseUrl]);

    // Update model to latest version
    const updateModel = useCallback(async () => {
        await loadModel(true);
        setState((prev) => ({ ...prev, updateAvailable: false }));
    }, [loadModel]);

    // Start camera for live capture
    const startCamera = useCallback(async (video: HTMLVideoElement) => {
        try {
            videoRef.current = video;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
            });

            streamRef.current = stream;
            video.srcObject = stream;
            await video.play();

            return true;
        } catch (error) {
            setState((prev) => ({
                ...prev,
                error: 'Could not access camera: ' + (error instanceof Error ? error.message : 'Unknown'),
            }));
            return false;
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    // Capture frame from video and analyze
    const captureAndAnalyze = useCallback(async () => {
        if (!videoRef.current || !edgeInference.isReady()) {
            setState((prev) => ({
                ...prev,
                error: 'Camera or model not ready',
            }));
            return null;
        }

        setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

        try {
            // Create canvas if not exists
            if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
            }

            const canvas = canvasRef.current;
            const video = videoRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0);

            // Run inference
            const result = await edgeInference.diagnose(canvas);

            // Get treatment recommendations
            const treatment = await edgeInference.getTreatment(result.disease, apiBaseUrl);

            setState((prev) => ({
                ...prev,
                isAnalyzing: false,
                lastResult: result,
                lastTreatment: treatment,
            }));

            return { result, treatment };
        } catch (error) {
            setState((prev) => ({
                ...prev,
                isAnalyzing: false,
                error: error instanceof Error ? error.message : 'Analysis failed',
            }));
            return null;
        }
    }, [apiBaseUrl]);

    // Analyze an uploaded image
    const analyzeImage = useCallback(
        async (imageElement: HTMLImageElement) => {
            if (!edgeInference.isReady()) {
                // Try to load model first
                await loadModel();
                if (!edgeInference.isReady()) {
                    setState((prev) => ({
                        ...prev,
                        error: 'Model not ready',
                    }));
                    return null;
                }
            }

            setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

            try {
                const result = await edgeInference.diagnose(imageElement);
                const treatment = await edgeInference.getTreatment(result.disease, apiBaseUrl);

                setState((prev) => ({
                    ...prev,
                    isAnalyzing: false,
                    lastResult: result,
                    lastTreatment: treatment,
                }));

                return { result, treatment };
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    isAnalyzing: false,
                    error: error instanceof Error ? error.message : 'Analysis failed',
                }));
                return null;
            }
        },
        [apiBaseUrl, loadModel]
    );

    // Analyze from file input
    const analyzeFile = useCallback(
        async (file: File) => {
            return new Promise<{ result: DiagnosisResult; treatment: TreatmentInfo } | null>((resolve) => {
                const img = new Image();
                img.onload = async () => {
                    const analysis = await analyzeImage(img);
                    resolve(analysis);
                };
                img.onerror = () => {
                    setState((prev) => ({
                        ...prev,
                        error: 'Could not load image file',
                    }));
                    resolve(null);
                };
                img.src = URL.createObjectURL(file);
            });
        },
        [analyzeImage]
    );

    // Clear last result
    const clearResult = useCallback(() => {
        setState((prev) => ({
            ...prev,
            lastResult: null,
            lastTreatment: null,
            error: null,
        }));
    }, []);

    return {
        // State
        ...state,

        // Actions
        loadModel,
        updateModel,
        checkForUpdates,
        startCamera,
        stopCamera,
        captureAndAnalyze,
        analyzeImage,
        analyzeFile,
        clearResult,

        // Refs (for external use if needed)
        videoRef,
    };
}

export default useEdgeDiagnosis;
