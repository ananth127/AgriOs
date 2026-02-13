import React, { useMemo } from 'react';
import { useRouter } from '@/navigation';
import { Card } from '@/components/ui/Card';
import { TrendingUp, Activity, AlertTriangle, Milk, QrCode, ShoppingBag, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LivestockDashboardProps {
    animals: any[];
    housing?: any[];
    feedPlans?: any[];
    onSelectCategory: (category: string) => void;
    onSelectAnimal: (animal: any) => void;
    onLog: (animal: any) => void;
    onScanQr: (animal: any) => void;
    onSell: (animal: any) => void;
    onAddHousing: () => void;
    onAddFeedPlan: () => void;
    onDeleteHousing: (id: number) => void;
    onDeleteFeedPlan: (id: number) => void;
    stats?: any[];
}

const SPECIES_ICONS: Record<string, string> = {
    'Cow': '🐮',
    'Buffalo': '🐃',
    'Goat': '🐐',
    'Sheep': '🐑',
    'Chicken': '🐔',
    'Pig': '🐷',
    'Horse': '🐴'
};

export const LivestockMainDashboard: React.FC<LivestockDashboardProps> = ({
    animals, housing = [], feedPlans = [], stats: productionStats = [],
    onSelectCategory, onSelectAnimal, onLog, onScanQr, onSell,
    onAddHousing, onAddFeedPlan, onDeleteHousing, onDeleteFeedPlan
}) => {
    const t = useTranslations('Livestock');
    const router = useRouter();

    const stats = useMemo(() => {
        const groups: Record<string, number> = {};
        let totalHealthIssues = 0;

        animals.forEach(a => {
            const species = a.species || 'Other';
            groups[species] = (groups[species] || 0) + 1;
            if (a.health_status !== 'Healthy') totalHealthIssues++;
        });
        return { groups, totalHealthIssues };
    }, [animals]);

    const avgProduction = useMemo(() => {
        const milkStats = productionStats.find(s => s.product_type === 'Milk');
        return milkStats ? `${milkStats.avg_daily.toFixed(1)} ${milkStats.unit}` : '-- L';
    }, [productionStats]);

    const recentAnimals = [...animals].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);

    return (
        <div className="space-y-8">
            {/* Overview Stats */}
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6">
                <div className="p-3 md:p-6 bg-gradient-to-br from-indigo-600/20 to-blue-600/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                        <Activity className="w-5 h-5 md:w-8 md:h-8" />
                    </div>

                    <div>
                        <p className="text-[10px] md:text-sm font-bold text-indigo-300 uppercase leading-tight">{t('herd_size')}</p>
                        <p className="text-xl md:text-3xl font-bold text-white mt-0.5 md:mt-1">{animals.length}</p>
                    </div>
                </div>

                <div className="p-3 md:p-6 bg-gradient-to-br from-emerald-600/20 to-green-600/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                        <Milk className="w-5 h-5 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-sm font-bold text-emerald-300 uppercase leading-tight">{t('avg_prod')}</p>
                        <p className="text-xl md:text-3xl font-bold text-white mt-0.5 md:mt-1">{avgProduction}</p>
                    </div>
                </div>

                <div className="p-3 md:p-6 bg-gradient-to-br from-rose-600/20 to-red-600/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 md:gap-4 col-span-2 sm:col-span-1">
                    <div className="p-2 md:p-3 bg-rose-500/20 rounded-xl text-rose-400">
                        <AlertTriangle className="w-5 h-5 md:w-8 md:h-8" />
                    </div>
                    <div>
                        <p className="text-[10px] md:text-sm font-bold text-rose-300 uppercase leading-tight">{t('health_issues')}</p>
                        <p className="text-xl md:text-3xl font-bold text-white mt-0.5 md:mt-1">{stats.totalHealthIssues}</p>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">{t('categories_title')}</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {Object.entries(stats.groups).map(([species, count]) => (
                        <div
                            key={species}
                            onClick={() => onSelectCategory(species)}
                            className="group relative cursor-pointer bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-blue-500/50 rounded-2xl p-4 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/20"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform">{SPECIES_ICONS[species] || '🐾'}</span>
                                <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded-md">{count}</span>
                            </div>
                            <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{species}</h4>
                            <p className="text-xs text-slate-500">{count > 1 ? t('animals') : t('animal')}</p>
                        </div>
                    ))}
                    <div
                        onClick={() => { /* Trigger Add generic? or just empty filler */ }}
                        className="border-2 border-dashed border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-600 gap-2 cursor-pointer hover:border-slate-600 hover:text-slate-400 transition-colors"
                    >
                        <span className="text-2xl opacity-50">+</span>
                        <span className="text-xs font-bold">{t('add_new_type')}</span>
                    </div>
                </div>
            </div>

            {/* Housing & Operations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Housing & Shelter Management */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>🏠</span> {t('housing_shelter')}
                    </h3>
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-4">
                        {/* Dynamic Housing List */}
                        {housing.length > 0 ? (
                            housing.map((h) => {
                                const occupancyPercent = h.capacity > 0 ? (h.current_occupancy / h.capacity) * 100 : 0;
                                return (
                                    <div key={h.id} className="p-3 bg-slate-800/50 rounded-xl border border-white/5 flex flex-col gap-2 group relative">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-white text-sm">{h.name} <span className="text-slate-500 font-normal">({h.type})</span></h4>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/smart-monitor?type=LIVESTOCK&id=${h.id}`); }}
                                                    className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                                                >
                                                    <Activity className="w-3 h-3" /> {t('smart_monitor')}
                                                </button>
                                                {h.auto_cleaning_enabled ? (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">{t('auto_clean_on')}</span>
                                                ) : (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{t('manual_clean')}</span>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteHousing(h.id); }}
                                                    className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    title={t('delete_shelter_title')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${occupancyPercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>{t('occupancy')}: {h.current_occupancy}/{h.capacity}</span>
                                            <span>{t('temp')}: --°C</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                                <p className="text-sm mb-2">{t('no_shelters')}</p>
                                <p className="text-xs">{t('add_shelter_hint')}</p>
                            </div>
                        )}

                        <button
                            onClick={onAddHousing}
                            className="w-full py-2 text-xs text-slate-400 hover:text-white border border-dashed border-slate-700 rounded-lg hover:border-slate-500 transition-colors"
                        >
                            + {t('add_new_shelter')}
                        </button>
                    </div>
                </div>

                {/* 2. Feed Inventory & Automation */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>🌾</span> {t('feed_stocks')}
                    </h3>
                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Dynamic Feed Plans */}
                            {feedPlans.length > 0 ? (
                                feedPlans.map((plan) => (
                                    <div key={plan.id} className="p-3 bg-slate-800/50 rounded-xl border border-white/5 text-center relative group">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteFeedPlan(plan.id); }}
                                            className="absolute top-2 right-2 p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            title={t('delete_plan_title')}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                        <p className="text-xs text-slate-500 uppercase font-bold">{plan.feed_item_name}</p>
                                        <p className="text-2xl font-bold text-white mt-1">{plan.quantity_per_day} <span className="text-sm font-normal text-slate-400">{t('kg_day')}</span></p>
                                        {plan.auto_feeder_enabled && (
                                            <div className="mt-2 text-[10px] text-green-400 flex items-center justify-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                {t('auto_feeder_active')}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                                    <p className="text-sm">{t('no_feed_plans')}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onAddFeedPlan}
                            className="w-full py-2 text-xs text-slate-400 hover:text-white border border-dashed border-slate-700 rounded-lg hover:border-slate-500 transition-colors"
                        >
                            + {t('setup_feeding')}
                        </button>
                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mt-4">
                            <h4 className="font-bold text-indigo-300 text-sm mb-2">{t('feeding_automation')}</h4>
                            <div className="flex justify-between items-center text-xs text-indigo-200/80 mb-1">
                                <span>{t('next_cycle')}:</span>
                                <span>
                                    {feedPlans.length > 0
                                        ? `${t('today')}, ${feedPlans[0].schedule_times?.[0] || '18:00'}`
                                        : t('not_configured')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-indigo-200/80">
                                <span>{t('machinery')}:</span>
                                <span>{feedPlans.some(p => p.auto_feeder_enabled) ? t('auto_mixer') : t('manual_control')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Animals Table */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <h3 className="text-lg font-bold text-white">{t('recent_registrations')}</h3>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden space-y-3">
                    {recentAnimals.map(animal => (
                        <div key={animal.id} onClick={() => onSelectAnimal(animal)} className="bg-slate-900 border border-white/5 rounded-xl p-4 active:scale-[0.98] transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-white">{animal.name || t('unnamed')}</h4>
                                    <span className="text-xs font-mono text-blue-400">{animal.tag_id}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${animal.health_status === 'Healthy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {animal.health_status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                                <span>{animal.species}</span>

                            </div>
                            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onLog(animal); }}
                                    className="px-2 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium text-center"
                                >
                                    {t('log')}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onScanQr(animal); }}
                                    className="px-2 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium text-center flex items-center justify-center"
                                >
                                    <QrCode className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSell(animal); }}
                                    className="px-2 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium text-center"
                                >
                                    {t('sell')}
                                </button>
                            </div>
                        </div>
                    ))}
                    {recentAnimals.length === 0 && (
                        <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                            {t('no_recent_animals_mobile')}
                        </div>
                    )}
                </div>

                {/* Desktop View: Table */}
                <Card className="hidden md:block overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400 min-w-[600px]">
                            <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="p-4">{t('tag_id')}</th>
                                    <th className="p-4">{t('name')}</th>
                                    <th className="p-4">{t('species')}</th>
                                    <th className="p-4">{t('status')}</th>
                                    <th className="p-4 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentAnimals.map(animal => (
                                    <tr key={animal.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => onSelectAnimal(animal)}>
                                        <td className="p-4 font-mono text-blue-400 font-medium">{animal.tag_id}</td>
                                        <td className="p-4 font-bold text-white">{animal.name || t('unnamed')}</td>
                                        <td className="p-4">{animal.species}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${animal.health_status === 'Healthy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {animal.health_status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onLog(animal); }}
                                                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium whitespace-nowrap"
                                            >
                                                + {t('log')}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onScanQr(animal); }}
                                                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                            >
                                                <QrCode className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSell(animal); }}
                                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1"
                                            >
                                                <ShoppingBag className="w-4 h-4" /> {t('sell')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {recentAnimals.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">
                                            {t('no_recent_animals')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div >
    );
};
