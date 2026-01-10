'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, Loader2, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

interface DiagnosisResult {
    id: number;
    disease_detected: string;
    confidence_score: number;
    recommendation: string;
    image_url: string;
}

export default function DiagnosisUploader() {
    const t = useTranslations('Diagnosis');
    const { token } = useAuth();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DiagnosisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cropName, setCropName] = useState("Unknown");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('crop_name', cropName);

            // TODO: Get real location
            formData.append('lat', "19.0760");
            formData.append('lng', "72.8777");

            const res = await fetch(`${API_BASE_URL}/diagnosis/predict`, {
                method: 'POST',
                headers: {
                    // 'Content-Type': 'multipart/form-data', // Do NOT set this manually with fetch & FormData
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Analysis failed');
            }

            const data = await res.json();

            // Adjust image URL to be absolute if it's relative
            if (data.image_url.startsWith('/')) {
                // Remove trailing slash from base if present to avoid double slashes
                const baseUrl = API_BASE_URL.replace('/api/v1', '').replace(/\/$/, '');
                data.image_url = `${baseUrl}${data.image_url}`;
            }

            setResult(data);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to analyze image");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Upload Section */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{t('upload_title')}</h3>
                <p className="text-slate-400 text-sm mb-6">{t('upload_desc')}</p>

                {!previewUrl ? (
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-green-500/50 hover:bg-slate-800/50 rounded-xl aspect-[4/3] flex flex-col items-center justify-center cursor-pointer transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-green-400" />
                        </div>
                        <p className="text-slate-300 font-medium">Click to upload or drag & drop</p>
                        <p className="text-slate-500 text-sm mt-1">PG, PNG, JPEG (Max 5MB)</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </div>
                ) : (
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-slate-700">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-contain"
                        />
                        <button
                            onClick={reset}
                            className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 rounded-full text-white transition-colors backdrop-blur-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <div className="mt-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-400 block mb-2">{t('select_crop')}</label>
                        <select
                            value={cropName}
                            onChange={(e) => setCropName(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-white focus:border-green-500/50 focus:outline-none"
                        >
                            <option value="Unknown">Unknown / Detect Auto</option>
                            <option value="Wheat">Wheat</option>
                            <option value="Rice">Rice</option>
                            <option value="Potato">Potato</option>
                            <option value="Tomato">Tomato</option>
                            <option value="Cotton">Cotton</option>
                            <option value="Corn">Corn</option>
                        </select>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!selectedFile || loading}
                        className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${!selectedFile || loading
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-400 text-slate-900 shadow-lg shadow-green-900/20'
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t('analyzing')}
                            </>
                        ) : (
                            t('btn_analyze')
                        )}
                    </button>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Results Section */}
            <div className={`transition-all duration-500 ${result ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-4 blur-sm grayscale'}`}>
                {result ? (
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-3 rounded-full ${result.disease_detected === 'Healthy' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                {result.disease_detected === 'Healthy' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">{result.disease_detected}</h3>
                                <p className="text-slate-400 text-sm">{t('result_title')}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-400 text-sm">{t('confidence')}</span>
                                    <span className="text-green-400 font-mono font-bold">{(result.confidence_score * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-1000 ease-out"
                                        style={{ width: `${result.confidence_score * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold text-white mb-3">{t('recommendation')}</h4>
                                <div className="p-4 bg-slate-800/30 rounded-xl border-l-4 border-green-500 text-slate-300 leading-relaxed">
                                    {result.recommendation}
                                </div>
                            </div>

                            <div className="pt-4">
                                <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Suggested Actions</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-green-500/20">
                                        <div className="text-green-400 font-medium mb-1">Find Medicine</div>
                                        <div className="text-xs text-slate-500">Search Marketplace</div>
                                    </div>
                                    <div className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-500/20">
                                        <div className="text-blue-400 font-medium mb-1">Ask Expert</div>
                                        <div className="text-xs text-slate-500">Contact Agronomist</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 border border-white/5 rounded-2xl p-6 bg-slate-950/20">
                        <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                            <Activity className="w-8 h-8 opacity-20" />
                        </div>
                        <p>Analysis results will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
