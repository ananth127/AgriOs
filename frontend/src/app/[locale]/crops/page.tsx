'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { ContentLoader } from '@/components/ui/ContentLoader';
import { Search, Trash2, Pencil, BarChart3 } from 'lucide-react';
import { EditCropModal } from '@/components/crops/EditCropModal';
import { CropAnalyticsDashboard } from '@/components/crops/CropAnalyticsDashboard';
import { useTranslations } from 'next-intl';

export default function CropsPage() {
    const t = useTranslations('Crops');
    const [registry, setRegistry] = useState<any[]>([]);
    const [myCrops, setMyCrops] = useState<any[]>([]);

    // State for Farms (Grouping Logic)
    const [allFarms, setAllFarms] = useState<any[]>([]); // Raw list containing duplicates/zones
    const [uniqueFarms, setUniqueFarms] = useState<string[]>([]); // Unique Farm Names (cleaned)
    const [selectedFarmKey, setSelectedFarmKey] = useState<string>(""); // Currently selected Clean Name

    const [activeTab, setActiveTab] = useState<'registry' | 'my-crops'>('registry');
    const [showPlantModal, setShowPlantModal] = useState(false);
    const [isPlanting, setIsPlanting] = useState(false);

    // Edit & Analytics State
    const [editingCrop, setEditingCrop] = useState<any>(null);
    const [viewingAnalytics, setViewingAnalytics] = useState<any>(null);

    // Plant Form State
    const [plantFormFarmKey, setPlantFormFarmKey] = useState<string>(""); // Selection in Modal
    const [selectedCropId, setSelectedCropId] = useState<string>("");
    const [sowingDate, setSowingDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [modalMetrics, setModalMetrics] = useState<string[]>(['Water Usage', 'Financials', 'Harvest Projections', 'Timeline']);
    const [dashboardConfigs, setDashboardConfigs] = useState<Record<number, string[]>>({});
    const [loading, setLoading] = useState(true);

    const fetchMyCrops = useCallback(async () => {
        if (!selectedFarmKey || allFarms.length === 0) return;

        try {
            const targetFarms = allFarms.filter(f => {
                const cleanName = f.name.replace(/^Land-\d+\s*-\s*/i, '').trim();
                return cleanName === selectedFarmKey;
            });

            const promises = targetFarms.map(f => api.crops.list(f.id));
            const results = await Promise.all(promises);
            const allCrops = results.flat();
            setMyCrops(allCrops);
        } catch (error) {
            console.error("Failed to fetch my crops", error);
        }
    }, [allFarms, selectedFarmKey]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [registryRes, farmsRes] = await Promise.all([
                    api.registry.list(),
                    api.farms.list()
                ]) as [any[], any[]];

                setRegistry(registryRes);
                setAllFarms(farmsRes);

                // Process Unique Farms
                const names = new Set<string>();
                farmsRes.forEach((f: any) => {
                    const cleanName = f.name.replace(/^Land-\d+\s*-\s*/i, '').trim();
                    names.add(cleanName);
                });
                const sortedNames = Array.from(names).sort();
                setUniqueFarms(sortedNames);

                if (sortedNames.length > 0) {
                    setSelectedFarmKey(sortedNames[0]);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedFarmKey) {
            fetchMyCrops();
        }
    }, [selectedFarmKey, fetchMyCrops]);

    const handlePlant = async () => {
        // Resolve selected Key in modal to a specific Farm ID
        const targetFarm = allFarms.find(f => {
            const cleanName = f.name.replace(/^Land-\d+\s*-\s*/i, '').trim();
            return cleanName === plantFormFarmKey;
        });

        if (!targetFarm || !selectedCropId) return;

        setIsPlanting(true);
        try {
            await api.crops.plant({
                farm_id: targetFarm.id,
                registry_id: parseInt(selectedCropId),
                sowing_date: sowingDate
            });
            setShowPlantModal(false);

            // Fetch updated list to find the new crop and assign config
            // Since we don't get ID back, we'll assign this config to the "latest" one for this farm in a real app.
            // For now, we'll just persist the toggle selection so when they open any dashboard,
            // we might default to this or allow them to set it.
            // Ideally: backend stores this.
            // Client-side hack: We will assign these metrics to ALL new crops viewed until page reload,
            // or better, just allow the dashboard to be configurable.

            // Just refresh
            if (plantFormFarmKey === selectedFarmKey) {
                fetchMyCrops();
            }
            setActiveTab('my-crops');
        } catch (error) {
            console.error("Planting failed", error);
            alert("Failed to plant crop. Check console.");
        } finally {
            setIsPlanting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this crop?")) return;
        try {
            await api.crops.delete(id);
            fetchMyCrops();
        } catch (error) {
            console.error("Failed to delete crop", error);
        }
    };

    const getCropName = (id: number) => {
        const found = registry.find(r => r.id === id);
        return found ? found.name : `Crop #${id}`;
    };

    const getStageName = (stage: string) => {
        if (!stage) return 'Unknown';
        return stage.replace(/_/g, ' ');
    };

    if (viewingAnalytics) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <CropAnalyticsDashboard
                    cropCycle={viewingAnalytics}
                    onClose={() => setViewingAnalytics(null)}
                    visibleMetrics={dashboardConfigs[viewingAnalytics.id] || modalMetrics}
                    onUpdateMetrics={(metrics: string[]) => setDashboardConfigs(prev => ({ ...prev, [viewingAnalytics.id]: metrics }))}
                />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6 relative">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">{t('page_title')}</h1>
                    <p className="text-slate-400">{t('page_subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowPlantModal(true)}
                    className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <Search className="w-4 h-4" />
                    {t('button_plant_new')}
                </button>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('registry')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'registry' ? 'border-green-500 text-green-400' : 'border-transparent text-slate-400'}`}
                >
                    {t('tab_registry')}
                </button>
                <button
                    onClick={() => setActiveTab('my-crops')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my-crops' ? 'border-green-500 text-green-400' : 'border-transparent text-slate-400'}`}
                >
                    {t('tab_my_crops')}
                </button>
            </div>

            {activeTab === 'registry' && (
                <ContentLoader loading={loading} text="Loading crop registry...">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                <input type="text" placeholder={t('search_registry_placeholder')} className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-green-500/50" />
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
                                            <p>{t('card_duration_days', { days: crop.definition.duration_days })}</p>
                                            <p>{t('card_water_needs', { water: crop.definition.water_needs })}</p>
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
                                        {t('button_plant_this')}
                                    </button>
                                </Card>
                            ))}
                        </div>
                    </div>
                </ContentLoader>
            )}

            {activeTab === 'my-crops' && (
                <ContentLoader loading={loading} text="Loading your crops...">
                    <div className="space-y-4">
                        {uniqueFarms.length > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-sm text-slate-400">{t('label_viewing_farm')}:</span>
                                <select
                                    value={selectedFarmKey}
                                    onChange={(e) => setSelectedFarmKey(e.target.value)}
                                    className="bg-slate-900 border border-white/10 rounded px-3 py-1 text-sm focus:outline-none"
                                >
                                    {uniqueFarms.map(name => <option key={name} value={name}>{name}</option>)}
                                </select>
                            </div>
                        )}

                        {myCrops.length === 0 ? (
                            <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-white/10">
                                <span className="text-4xl block mb-4">🌱</span>
                                <h3 className="text-xl font-semibold text-slate-300">{t('empty_state_title')}</h3>
                                <p className="text-slate-500 mt-2">{t('empty_state_desc')}</p>
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
                                                <p className="text-xs text-slate-400">{t('crop_sown_on', { date: cycle.sowing_date })}</p>
                                            </div>
                                            <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold uppercase border border-green-500/20">
                                                {getStageName(cycle.current_stage || 'Germination')}
                                            </span>
                                        </div>
                                        <div className="mt-4 bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-green-500 h-full transition-all duration-1000"
                                                style={{ width: `${Math.min(cycle.health_score || 10, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                                            <span className="flex items-center gap-1">{t('label_health')}: <strong className="text-white">{cycle.health_score ?? 'N/A'}%</strong></span>
                                            <span>{t('label_est_harvest')}: {cycle.harvest_date_estimated || 'Calculating...'}</span>
                                        </div>

                                        <button
                                            onClick={() => setViewingAnalytics({ ...cycle, registry_name: getCropName(cycle.registry_id) })}
                                            className="w-full mt-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2"
                                        >
                                            <BarChart3 className="w-3 h-3" /> {t('button_view_analytics')}
                                        </button>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </ContentLoader>
            )}

            {/* Modals */}
            {showPlantModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md bg-slate-950 border-slate-800 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{t('modal_plant_title')}</h2>
                            <button onClick={() => setShowPlantModal(false)} className="text-slate-500 hover:text-white">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">{t('modal_label_farm')}</label>
                                <select
                                    className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm"
                                    value={plantFormFarmKey}
                                    onChange={(e) => setPlantFormFarmKey(e.target.value)}
                                >
                                    <option value="">{t('modal_select_default')}</option>
                                    {uniqueFarms.map(name => <option key={name} value={name}>{name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">{t('modal_label_crop')}</label>
                                <select
                                    className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm"
                                    value={selectedCropId}
                                    onChange={(e) => setSelectedCropId(e.target.value)}
                                >
                                    <option value="">{t('modal_select_default')}</option>
                                    {registry.map(r => <option key={r.id} value={r.id}>{r.name} ({r.category})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">{t('modal_label_sowing_date')}</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-900 border border-white/10 rounded p-2 text-sm text-white"
                                    value={sowingDate}
                                    onChange={(e) => setSowingDate(e.target.value)}
                                />
                            </div>

                            {/* Dashboard Configuration */}
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dashboard Metrics to Track</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Water Usage', 'Financials', 'Soil Health', 'Machinery', 'Timeline', 'Harvest Projections'].map((metric) => (
                                        <label key={metric} className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={modalMetrics.includes(metric)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setModalMetrics([...modalMetrics, metric]);
                                                        else setModalMetrics(modalMetrics.filter(m => m !== metric));
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-4 h-4 border border-slate-600 rounded peer-checked:bg-green-500 peer-checked:border-green-500 transition-colors"></div>
                                                <svg className="absolute top-0.5 left-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{metric}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handlePlant}
                                disabled={isPlanting}
                                className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-lg font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPlanting ? t('modal_button_planting') : t('modal_button_confirm')}
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

            {viewingAnalytics && null /* Handled above */}
        </div>
    );
}
