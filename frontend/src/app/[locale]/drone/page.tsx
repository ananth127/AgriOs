'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Upload, Camera, Zap, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

export default function DronePage() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setAnalysisResult(null); // Reset previous analysis
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedImage) return;
        setIsAnalyzing(true);
        try {
            // Send base64 image to backend (mocked service will return bounding boxes)
            const result = await api.drone.analyze({
                image_data: selectedImage.split(',')[1], // Remove data:image/png;base64 header
                flight_id: "FLIGHT-101"
            });
            setAnalysisResult(result);
        } catch (error) {
            console.error("Analysis failed", error);
            alert("Failed to analyze image.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">Drone AI Analysis</h1>
                <p className="text-slate-400">Upload aerial imagery to detect pests, diseases, and crop health issues.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-4">
                    <Card className="p-8 border-dashed border-2 border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center min-h-[400px]">
                        {selectedImage ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={selectedImage}
                                    alt="Upload"
                                    fill
                                    className="object-contain rounded-lg"
                                />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-2 right-2 bg-slate-900/80 p-2 rounded-full hover:bg-slate-800"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                    <Upload className="w-10 h-10 text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Upload Flight Imagery</h3>
                                    <p className="text-slate-500 text-sm">Supports JPG, PNG (Max 10MB)</p>
                                </div>
                                <label className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer font-medium transition-colors">
                                    Browse Files
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                        )}
                    </Card>

                    <button
                        onClick={handleAnalyze}
                        disabled={!selectedImage || isAnalyzing}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-lg hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <Zap className="w-5 h-5 animate-spin" /> Analyzing...
                            </>
                        ) : (
                            <>
                                <Camera className="w-5 h-5" /> Analyze Image
                            </>
                        )}
                    </button>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                    {analysisResult ? (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="bg-red-500/10 border-red-500/20 p-4">
                                    <h3 className="text-red-400 font-bold uppercase text-xs">Issues Detected</h3>
                                    <p className="text-3xl font-bold mt-1">{analysisResult.detected_objects?.length || 0}</p>
                                </Card>
                                <Card className="bg-green-500/10 border-green-500/20 p-4">
                                    <h3 className="text-green-400 font-bold uppercase text-xs">Confidence</h3>
                                    <p className="text-3xl font-bold mt-1">98%</p>
                                </Card>
                            </div>

                            <Card className="p-0 overflow-hidden">
                                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                    <h3 className="font-semibold">Detection Log</h3>
                                    <span className="text-xs text-slate-500">Flight #101</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {analysisResult.detected_objects.map((obj: any, i: number) => (
                                        <div key={i} className="p-4 flex items-center gap-4 hover:bg-white/5">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${obj.label === 'Healthy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {obj.label === 'Healthy' ? <Zap className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-white">{obj.label}</h4>
                                                <p className="text-xs text-slate-500">Confidence: {(obj.confidence * 100).toFixed(1)}%</p>
                                            </div>
                                            <div className="ml-auto text-xs font-mono text-slate-600">
                                                [{obj.bbox.map((n: number) => n.toFixed(0)).join(', ')}]
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <div className="p-4 bg-slate-800 rounded-lg text-sm text-slate-300">
                                <strong>AI Recommendation:</strong> {analysisResult.summary || "No specific issues found."}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 border-2 border-dashed border-white/5 rounded-2xl bg-slate-900/30">
                            <Zap className="w-16 h-16 opacity-20" />
                            <p>Analysis results will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
