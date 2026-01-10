'use client';

import { useState } from 'react';
import { Search, Loader2, Sprout, Mic, ChevronRight, Droplets, Sun, Thermometer, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { API_BASE_URL } from '@/lib/constants';

// Types based on the AI-generated JSON structure
interface CropProfile {
    id: number;
    name: string;
    category: string;
    definition: {
        scientific_name: string;
        difficulty: string;
        lifetime_days: number;
        season: string[];
        growing_requirements: {
            water_needs: string;
            sun_exposure: string;
            soil_type: string;
            ph_level: string;
            temperature_range: { min: number, max: number };
        };
        process_stages: Array<{
            stage_name: string;
            days_start: number;
            days_end: number;
            description: string;
        }>;
        uses: string[];
    };
}

export default function CropLibrary() {
    const t = useTranslations('Library'); // You might need to add keys later
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [cropData, setCropData] = useState<CropProfile | null>(null);
    const [error, setError] = useState('');

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!search.trim()) return;

        setLoading(true);
        setError('');
        setCropData(null);

        try {
            const res = await fetch(`${API_BASE_URL}/registry/search?query=${encodeURIComponent(search)}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error("Crop not found. AI couldn't generate it.");
                throw new Error("Search failed");
            }
            const data = await res.json();
            setCropData(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to fetch crop data");
        } finally {
            setLoading(false);
        }
    };

    const startVoiceSearch = () => {
        // Simple mock for now or use browser API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.start();
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setSearch(transcript);
                // Auto search after voice
                setTimeout(() => {
                    // Trigger search manually since state update is async
                    fetch(`${API_BASE_URL}/registry/search?query=${encodeURIComponent(transcript)}`)
                        .then(res => res.json())
                        .then(data => setCropData(data))
                        .catch(err => setError("Voice search failed"));
                }, 100);
            };
        } else {
            alert("Voice search not supported in this browser.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Section */}
            <div className="relative max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search any crop (e.g. 'Quinoa', 'Dragon Fruit')..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white focus:outline-none focus:border-green-500/50 shadow-xl"
                    />
                    <button
                        type="button"
                        onClick={startVoiceSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-green-400 transition-colors"
                    >
                        <Mic className="w-5 h-5" />
                    </button>
                </form>
                <p className="text-center text-slate-500 text-xs mt-2">
                    Start typing or use voice. Our AI will generate a guide if it doesn't exist.
                </p>
            </div>

            {/* Content Area */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 min-h-[400px]">
                    <Loader2 className="w-10 h-10 animate-spin text-green-500 mb-4" />
                    <p className="animate-pulse">Consulting the global agricultural database...</p>
                    <p className="text-xs text-slate-600 mt-2">This may take up to 20 seconds for new crops.</p>
                </div>
            )}

            {error && (
                <div className="text-center py-20 text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
                    <p>{error}</p>
                </div>
            )}

            {cropData && !loading && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                    {/* Header Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <Sprout className="w-64 h-64 text-green-500" />
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                            <div className="w-24 h-24 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 shadow-lg shadow-green-900/20">
                                <Sprout className="w-12 h-12" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-3xl font-bold text-white">{cropData.name}</h2>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-mono text-slate-400 border border-white/5">
                                        {cropData.category}
                                    </span>
                                </div>
                                <p className="text-xl text-green-400 italic mb-4 font-serif">{cropData.definition.scientific_name}</p>

                                <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                                        <Info className="w-4 h-4 text-blue-400" />
                                        Difficulty: <span className="text-white font-medium">{cropData.definition.difficulty}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                                        <Sun className="w-4 h-4 text-orange-400" />
                                        Duration: <span className="text-white font-medium">{cropData.definition.lifetime_days} Days</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                                        <Thermometer className="w-4 h-4 text-red-400" />
                                        Season: <span className="text-white font-medium">{cropData.definition.season?.join(', ')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Requirements Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <RequirementCard
                            icon={<Droplets className="w-5 h-5 text-blue-400" />}
                            label="Water Needs"
                            value={cropData.definition.growing_requirements.water_needs}
                        />
                        <RequirementCard
                            icon={<Sun className="w-5 h-5 text-orange-400" />}
                            label="Sun Exposure"
                            value={cropData.definition.growing_requirements.sun_exposure}
                        />
                        <RequirementCard
                            icon={<Info className="w-5 h-5 text-purple-400" />}
                            label="Soil Type"
                            value={cropData.definition.growing_requirements.soil_type}
                        />
                        <RequirementCard
                            icon={<Thermometer className="w-5 h-5 text-red-400" />}
                            label="Temp Range"
                            value={`${cropData.definition.growing_requirements.temperature_range.min}°C - ${cropData.definition.growing_requirements.temperature_range.max}°C`}
                        />
                    </div>

                    {/* Timeline */}
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 md:p-8">
                        <h3 className="text-xl font-bold text-white mb-6">Growth Process</h3>
                        <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                            {cropData.definition.process_stages.map((stage, idx) => (
                                <div key={idx} className="relative pl-12">
                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 border-2 border-green-500/50 flex items-center justify-center text-xs font-bold text-green-500 z-10">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                            <h4 className="text-lg font-bold text-white">{stage.stage_name}</h4>
                                            <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400 border border-white/5">
                                                Day {stage.days_start} - {stage.days_end}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 leading-relaxed text-sm md:text-base">
                                            {stage.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RequirementCard({ icon, label, value }: any) {
    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover:bg-slate-900 transition-colors">
            <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
            <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</div>
                <div className="text-white font-medium">{value}</div>
            </div>
        </div>
    );
}
