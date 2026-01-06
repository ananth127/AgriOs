'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Search, Trash2, Pencil, BarChart3 } from 'lucide-react';
import { EditCropModal } from '@/components/crops/EditCropModal';
import { CropAnalyticsDashboard } from '@/components/crops/CropAnalyticsDashboard';

export default function CropsPage() {
    const [registry, setRegistry] = useState<any[]>([]);
    const [myCrops, setMyCrops] = useState<any[]>([]);
    const [farms, setFarms] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'registry' | 'my-crops'>('registry');
    const [showPlantModal, setShowPlantModal] = useState(false);
    const [isPlanting, setIsPlanting] = useState(false);

    // Edit & Analytics State
    const [editingCrop, setEditingCrop] = useState<any>(null);
    const [viewingAnalytics, setViewingAnalytics] = useState<any>(null);

    // Form State
    const [selectedFarmId, setSelectedFarmId] = useState<string>("");
    const [selectedCropId, setSelectedCropId] = useState<string>("");
    const [sowingDate, setSowingDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // ... (keep fetchMyCrops, useEffect, handlePlant, handleDelete, getCropName same) ...

    const fetchMyCrops = () => {
        if (farms.length > 0) {
            const farmId = selectedFarmId || farms[0].id;
            api.crops.list(farmId)
                .then((data: any) => {
                    if (Array.isArray(data)) setMyCrops(data);
                })
                .catch(err => console.error("Failed to fetch crops", err));
        }
    };

    useEffect(() => {
        api.registry.list().then((data: any) => { if (Array.isArray(data)) setRegistry(data); });
        api.farms.list().then((data: any) => {
            if (Array.isArray(data)) {
                setFarms(data);
                if (data.length > 0) setSelectedFarmId(data[0].id.toString());
            }
        });
    }, []);

    useEffect(() => {
        if (activeTab === 'my-crops') fetchMyCrops();
    }, [activeTab, selectedFarmId, farms]);

    const handlePlant = async () => {
        if (!selectedFarmId || !selectedCropId) return;
        setIsPlanting(true);
        try {
            await api.crops.plant({
                farm_id: parseInt(selectedFarmId),
                registry_id: parseInt(selectedCropId),
                sowing_date: sowingDate
            });
            setShowPlantModal(false);
            setActiveTab('my-crops');
            fetchMyCrops();
        } catch (error) {
            console.error("Planting failed", error);
            alert("Failed to plant crop. Check console.");
        } finally {
            setIsPlanting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this crop cycle?")) return;
        try {
            await api.crops.delete(id);
            fetchMyCrops();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete crop cycle");
        }
    };

    const getCropName = (regId: number) => {
        const item = registry.find(r => r.id === regId);
        return item ? item.name : `Unknown Crop #${regId}`;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6 relative">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">Crops</h1>
                    <p className="text-slate-400">Manage your planting schedules and browse the crop registry.</p>
                </div>
                <button
                    onClick={() => setShowPlantModal(true)}
                    className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <Search className="w-4 h-4" />
                    Plant New Crop
                </button>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('registry')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'registry' ? 'border-green-500 text-green-400' : 'border-transparent text-slate-400'}`}
                >
                    Crop Registry (Universal)
                </button>
                <button
                    onClick={() => setActiveTab('my-crops')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my-crops' ? 'border-green-500 text-green-400' : 'border-transparent text-slate-400'}`}
                >
                    My Active Crops
                </button>
            </div>

            {activeTab === 'registry' && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                            <input type="text" placeholder="Search registry..." className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-green-500/50" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {registry.map((crop, i) => (
                            <Card key={i} className="hover:border-green-500/20 cursor-pointer transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                        <span className="text-xl">🌾</span>
                                    </div>
                                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase">{crop.category}</span>
                                </div>
                                <h3 className="font-semibold text-lg">{crop.name}</h3>
                                {crop.definition && (
                                    <div className="mt-2 text-xs text-slate-400 space-y-1">
                                        <p>🕐 Duration: {crop.definition.duration_days} days</p>
                                        <p>💧 Water: {crop.definition.water_needs}</p>
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCropId(crop.id.toString());
                                        setShowPlantModal(true);
                                    }}
                                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-green-600 rounded text-sm font-medium transition-colors hidden group-hover:block animate-in fade-in"
                                >
                                    Plant This
                                </button>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'my-crops' && (
                <div className="space-y-4">
                    {farms.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm text-slate-400">Viewing Farm:</span>
                            <select
                                value={selectedFarmId}
                                onChange={(e) => setSelectedFarmId(e.target.value)}
                                className="bg-slate-900 border border-white/10 rounded px-3 py-1 text-sm focus:outline-none"
                            >
                                {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    )}

                    {myCrops.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-white/10">
                            <span className="text-4xl block mb-4">🌱</span>
                            <h3 className="text-xl font-semibold text-slate-300">No active crops</h3>
                            <p className="text-slate-500 mt-2">Start a new season by planting a crop.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myCrops.map((cycle, i) => (
                                <Card key={i} className="border-l-4 border-l-green-500 relative group overflow-visible">
                                    <div className="absolute -top-3 -right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={() => setViewingAnalytics({ ...cycle, registry_name: getCropName(cycle.registry_id) })}
                                            className="bg-slate-800 text-purple-400 hover:bg-purple-600 hover:text-white p-2 rounded-full shadow-lg border border-white/10 transition-all"
                                            title="View Analysis"
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingCrop(cycle)}
                                            className="bg-slate-800 text-blue-400 hover:bg-blue-600 hover:text-white p-2 rounded-full shadow-lg border border-white/10 transition-all"
                                            title="Edit"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cycle.id)}
                                            className="bg-slate-800 text-red-400 hover:bg-red-600 hover:text-white p-2 rounded-full shadow-lg border border-white/10 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">{getCropName(cycle.registry_id)}</h3>
                                            <p className="text-xs text-slate-400">Sown on: {cycle.sowing_date}</p>
                                        </div>
                                        <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold uppercase border border-green-500/20">
                                            {cycle.current_stage || 'Germination'}
                                        </span>
                                    </div>
                                    <div className="mt-4 bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-green-500 h-full transition-all duration-1000"
                                            style={{ width: `${Math.min(cycle.health_score || 10, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                                        <span className="flex items-center gap-1">Health: <strong className="text-white">{cycle.health_score ?? 'N/A'}%</strong></span>
                                        <span>Est. Harvest: {cycle.harvest_date_estimated || 'Calculating...'}</span>
                                    </div>

                                    <button
                                        onClick={() => setViewingAnalytics({ ...cycle, registry_name: getCropName(cycle.registry_id) })}
                                        className="w-full mt-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2"
                                    >
                                        <BarChart3 className="w-3 h-3" /> View Full Analytics
                                    </button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showPlantModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md bg-slate-950 border-slate-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Plant New Crop</h2>
                            <button onClick={() => setShowPlantModal(false)} className="text-slate-500 hover:text-white">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Select Farm</label>
                                <select
                                    className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm"
                                    value={selectedFarmId}
                                    onChange={(e) => setSelectedFarmId(e.target.value)}
                                >
                                    <option value="">-- Choose Farm --</option>
                                    {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Select Crop Type</label>
                                <select
                                    className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm"
                                    value={selectedCropId}
                                    onChange={(e) => setSelectedCropId(e.target.value)}
                                >
                                    <option value="">-- Choose Crop --</option>
                                    {registry.map(r => <option key={r.id} value={r.id}>{r.name} ({r.category})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Sowing Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm text-white"
                                    value={sowingDate}
                                    onChange={(e) => setSowingDate(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handlePlant}
                                disabled={isPlanting}
                                className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-lg font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPlanting ? 'Planting...' : 'Confirm Planting'}
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {editingCrop && (
                <EditCropModal
                    isOpen={!!editingCrop}
                    onClose={() => setEditingCrop(null)}
                    onSuccess={fetchMyCrops}
                    crop={editingCrop}
                />
            )}

            {viewingAnalytics && (
                <CropAnalyticsDashboard
                    cropCycle={viewingAnalytics}
                    onClose={() => setViewingAnalytics(null)}
                />
            )}
        </div>
    );
}
