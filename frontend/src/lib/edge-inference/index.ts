/**
 * Edge Inference Module - TensorFlow.js based disease detection
 * Enables offline-capable plant disease diagnosis in the browser
 */

// Model configuration
export interface ModelConfig {
    name: string;
    version: string;
    modelUrl: string;
    inputShape: { width: number; height: number; channels: number };
    outputClasses: string[];
    fileHash?: string;
}

// Diagnosis result
export interface DiagnosisResult {
    disease: string;
    confidence: number;
    topPredictions: Array<{ class: string; probability: number }>;
    inferenceTimeMs: number;
    isOffline: boolean;
}

// Treatment recommendation
export interface TreatmentInfo {
    cause?: string;
    symptoms?: string;
    prevention?: string;
    treatment_organic?: string;
    treatment_chemical?: string;
}

// Local storage keys
const STORAGE_KEYS = {
    MODEL_VERSION: 'edge_model_version',
    MODEL_CACHED: 'edge_model_cached',
    MODEL_CONFIG: 'edge_model_config',
};

// Default model configuration (fallback)
const DEFAULT_MODEL_CONFIG: ModelConfig = {
    name: 'disease_detector',
    version: '1.0.0',
    modelUrl: '/static/models/disease_detector_v1/model.json',
    inputShape: { width: 224, height: 224, channels: 3 },
    outputClasses: [
        'Healthy',
        'Late Blight',
        'Early Blight',
        'Powdery Mildew',
        'Leaf Curl',
        'Bacterial Wilt',
        'Anthracnose',
        'Fall Armyworm',
    ],
};

/**
 * Edge Inference Manager
 * Handles model loading, caching, and inference
 */
class EdgeInferenceManager {
    private model: unknown = null;
    private config: ModelConfig = DEFAULT_MODEL_CONFIG;
    private isLoading = false;
    private tf: typeof import('@tensorflow/tfjs') | null = null;

    /**
     * Initialize the inference engine
     */
    async initialize(): Promise<boolean> {
        try {
            // Dynamic import of TensorFlow.js (tree-shaking friendly)
            this.tf = await import('@tensorflow/tfjs');

            // Try to set WebGL backend for performance
            try {
                await this.tf.setBackend('webgl');
            } catch {
                console.log('WebGL not available, using CPU backend');
                await this.tf.setBackend('cpu');
            }

            console.log('✅ TensorFlow.js initialized:', this.tf.version.tfjs);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize TensorFlow.js:', error);
            return false;
        }
    }

    /**
     * Check for model updates from the server
     */
    async checkForUpdates(apiBaseUrl: string): Promise<{ updateAvailable: boolean; config?: ModelConfig }> {
        try {
            const currentVersion = localStorage.getItem(STORAGE_KEYS.MODEL_VERSION);

            const response = await fetch(`${apiBaseUrl}/edge/models/check-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_version: currentVersion,
                    model_name: 'disease_detector',
                    device_type: 'web',
                }),
            });

            if (!response.ok) return { updateAvailable: false };

            const data = await response.json();

            if (data.update_available) {
                return {
                    updateAvailable: true,
                    config: {
                        ...this.config,
                        version: data.latest_version,
                        modelUrl: data.download_url,
                        fileHash: data.file_hash,
                    },
                };
            }

            return { updateAvailable: false };
        } catch (error) {
            console.warn('Could not check for model updates (offline?):', error);
            return { updateAvailable: false };
        }
    }

    /**
     * Load the model (from cache or network)
     */
    async loadModel(forceRefresh = false): Promise<boolean> {
        if (this.isLoading) return false;
        if (this.model && !forceRefresh) return true;

        this.isLoading = true;

        try {
            if (!this.tf) await this.initialize();
            if (!this.tf) throw new Error('TensorFlow.js not available');

            // Check if model is cached in IndexedDB
            const cachedVersion = localStorage.getItem(STORAGE_KEYS.MODEL_VERSION);
            const isCached = localStorage.getItem(STORAGE_KEYS.MODEL_CACHED) === 'true';

            if (isCached && !forceRefresh && cachedVersion) {
                try {
                    // Load from IndexedDB cache
                    this.model = await this.tf.loadLayersModel('indexeddb://disease_detector');
                    console.log('✅ Model loaded from cache, version:', cachedVersion);
                    this.isLoading = false;
                    return true;
                } catch {
                    console.log('Cache miss, loading from network...');
                }
            }

            // Load from network
            console.log('📥 Downloading model from:', this.config.modelUrl);
            this.model = await this.tf.loadLayersModel(this.config.modelUrl);

            // Save to IndexedDB for offline use
            try {
                await (this.model as { save(url: string): Promise<unknown> }).save('indexeddb://disease_detector');
                localStorage.setItem(STORAGE_KEYS.MODEL_VERSION, this.config.version);
                localStorage.setItem(STORAGE_KEYS.MODEL_CACHED, 'true');
                console.log('✅ Model cached for offline use');
            } catch (cacheError) {
                console.warn('Could not cache model:', cacheError);
            }

            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('❌ Failed to load model:', error);
            this.isLoading = false;
            return false;
        }
    }

    /**
     * Preprocess image for model input
     */
    private preprocessImage(imageElement: HTMLImageElement | HTMLCanvasElement): unknown {
        if (!this.tf) throw new Error('TensorFlow.js not initialized');

        const { width, height } = this.config.inputShape;

        // Convert to tensor and preprocess
        return this.tf.tidy(() => {
            let tensor = this.tf!.browser.fromPixels(imageElement);

            // Resize to model input size
            tensor = this.tf!.image.resizeBilinear(tensor, [height, width]);

            // Normalize to [0, 1]
            tensor = tensor.div(255.0);

            // Add batch dimension
            return tensor.expandDims(0);
        });
    }

    /**
     * Run inference on an image
     */
    async diagnose(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<DiagnosisResult> {
        if (!this.model || !this.tf) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }

        const startTime = performance.now();

        // Check if we're offline
        const isOffline = !navigator.onLine;

        // Preprocess image
        const inputTensor = this.preprocessImage(imageElement);

        // Run inference
        const predictions = (this.model as { predict(input: unknown): unknown }).predict(inputTensor) as {
            dataSync(): Float32Array;
            dispose(): void;
        };
        const probabilities = predictions.dataSync();

        // Clean up tensors
        (inputTensor as { dispose(): void }).dispose();
        predictions.dispose();

        // Get top predictions
        const classResults = Array.from(probabilities).map((prob, idx) => ({
            class: this.config.outputClasses[idx] || `Class ${idx}`,
            probability: prob,
        }));

        // Sort by probability
        classResults.sort((a, b) => b.probability - a.probability);

        const inferenceTimeMs = performance.now() - startTime;

        return {
            disease: classResults[0].class,
            confidence: classResults[0].probability,
            topPredictions: classResults.slice(0, 5),
            inferenceTimeMs,
            isOffline,
        };
    }

    /**
     * Get treatment recommendations (tries API, falls back to local)
     */
    async getTreatment(diseaseName: string, apiBaseUrl: string): Promise<TreatmentInfo> {
        // Try API first
        try {
            const response = await fetch(`${apiBaseUrl}/edge/models/treatment/${encodeURIComponent(diseaseName)}`);
            if (response.ok) {
                const data = await response.json();
                return data.treatment;
            }
        } catch {
            console.log('API unavailable, using local treatment database');
        }

        // Fallback to local database
        return this.getLocalTreatment(diseaseName);
    }

    /**
     * Local treatment database (for offline use)
     */
    private getLocalTreatment(diseaseName: string): TreatmentInfo {
        const treatments: Record<string, TreatmentInfo> = {
            'Late Blight': {
                cause: 'Phytophthora infestans fungus',
                symptoms: 'Dark water-soaked lesions on leaves',
                prevention: 'Use resistant varieties, ensure good air circulation',
                treatment_organic: 'Copper-based fungicides',
                treatment_chemical: 'Mancozeb, Metalaxyl',
            },
            'Early Blight': {
                cause: 'Alternaria solani fungus',
                symptoms: 'Brown spots with concentric rings',
                prevention: 'Crop rotation, mulching',
                treatment_organic: 'Neem oil, Bacillus subtilis',
                treatment_chemical: 'Azoxystrobin, Difenoconazole',
            },
            'Powdery Mildew': {
                cause: 'Various fungal species',
                symptoms: 'White powdery coating on leaves',
                prevention: 'Good air circulation',
                treatment_organic: 'Baking soda spray, sulfur',
                treatment_chemical: 'Myclobutanil',
            },
            Healthy: {
                symptoms: 'No disease detected',
                prevention: 'Continue current practices',
            },
        };

        return treatments[diseaseName] || {
            cause: 'Unknown',
            symptoms: diseaseName,
            prevention: 'Consult local agricultural expert',
        };
    }

    /**
     * Check if model is ready for inference
     */
    isReady(): boolean {
        return this.model !== null && this.tf !== null;
    }

    /**
     * Get current model configuration
     */
    getConfig(): ModelConfig {
        return this.config;
    }

    /**
     * Update model configuration
     */
    setConfig(config: Partial<ModelConfig>): void {
        this.config = { ...this.config, ...config };
        localStorage.setItem(STORAGE_KEYS.MODEL_CONFIG, JSON.stringify(this.config));
    }
}

// Singleton instance
export const edgeInference = new EdgeInferenceManager();

// Export default
export default edgeInference;
