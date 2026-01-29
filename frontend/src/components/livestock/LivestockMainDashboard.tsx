import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { TrendingUp, Activity, AlertTriangle, Milk, QrCode, ShoppingBag } from 'lucide-react';

interface LivestockDashboardProps {
    animals: any[];
    onSelectCategory: (category: string) => void;
    onSelectAnimal: (animal: any) => void;
    onLog: (animal: any) => void;
    onScanQr: (animal: any) => void;
    onSell: (animal: any) => void;
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

export const LivestockMainDashboard: React.FC<LivestockDashboardProps> = ({ animals, onSelectCategory, onSelectAnimal, onLog, onScanQr, onSell }) => {

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

    const recentAnimals = [...animals].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);

    return (
        <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="p-6 bg-gradient-to-br from-indigo-600/20 to-blue-600/10 border border-indigo-500/20 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-indigo-300 uppercase">Herd Size</p>
                        <p className="text-3xl font-bold text-white mt-1">{animals.length}</p>
                    </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-emerald-600/20 to-green-600/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                        <Milk className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-emerald-300 uppercase">Avg Production</p>
                        <p className="text-3xl font-bold text-white mt-1">-- L</p>
                    </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-rose-600/20 to-red-600/10 border border-rose-500/20 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-rose-300 uppercase">Health Issues</p>
                        <p className="text-3xl font-bold text-white mt-1">{stats.totalHealthIssues}</p>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Livestock Categories</h3>
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
                            <p className="text-xs text-slate-500">{count > 1 ? 'Animals' : 'Animal'}</p>
                        </div>
                    ))}
                    <div
                        onClick={() => { /* Trigger Add generic? or just empty filler */ }}
                        className="border-2 border-dashed border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-600 gap-2 cursor-pointer hover:border-slate-600 hover:text-slate-400 transition-colors"
                    >
                        <span className="text-2xl opacity-50">+</span>
                        <span className="text-xs font-bold">Add New Type</span>
                    </div>
                </div>
            </div>

            {/* Recent Animals Table */}
            <div>
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-bold text-white">Recent Registrations</h3>
                </div>
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400 min-w-[600px]">
                            <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="p-4">Tag ID</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Species</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentAnimals.map(animal => (
                                    <tr key={animal.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => onSelectAnimal(animal)}>
                                        <td className="p-4 font-mono text-blue-400 font-medium">{animal.tag_id}</td>
                                        <td className="p-4 font-bold text-white">{animal.name || 'Unnamed'}</td>
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
                                                + Log
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
                                                <ShoppingBag className="w-4 h-4" /> Sell
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {recentAnimals.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">
                                            No recent animals found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};
