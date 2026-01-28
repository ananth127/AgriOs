import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { QrCode, ClipboardList, TrendingUp } from 'lucide-react';
import { LivestockCategoryDashboard } from './LivestockCategoryDashboard';

interface LivestockDashboardProps {
    animals: any[];
    onSelectCategory: (category: string) => void;
    onSelectAnimal: (animal: any) => void;
}

export const LivestockMainDashboard: React.FC<LivestockDashboardProps> = ({ animals, onSelectCategory, onSelectAnimal }) => {

    // Group animals by species
    const stats = useMemo(() => {
        const groups: Record<string, number> = {};
        animals.forEach(a => {
            // Mapping species if needed, or using registry category
            // Assuming 'species' field exists specifically or deriving it
            // Ideally backend schemas.py's AnimalCreate has 'species' passed to registry
            // But Animal models.py joined it via registry. Here we might need to rely on what List API returns.
            // Let's assume the List API returns 'species' because we handled it in Create, 
            // but wait, get_animals_by_farm returns Animal model which doesn't have 'species' directly on it (it's in registry).
            // This is a GAP. The API response for List needs to include species.

            // Temporary Workaround: relying on 'species' if available, else 'Unknown'
            const species = a.species || 'Other';
            groups[species] = (groups[species] || 0) + 1;
        });
        return groups;
    }, [animals]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(stats).map(([species, count]) => (
                    <Card
                        key={species}
                        className="p-6 hover:bg-white/5 cursor-pointer transition-colors border-l-4 border-l-blue-500"
                        onClick={() => onSelectCategory(species)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">{species}s</h3>
                                <p className="text-slate-400 text-sm">Manage {species} Herd</p>
                            </div>
                            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-mono text-sm">
                                {count}
                            </span>
                        </div>
                    </Card>
                ))}
                {animals.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                        No livestock categories found. Register your first animal to get started!
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-emerald-500/5 border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-emerald-400 font-bold uppercase text-xs">Total Production</h4>
                            <p className="text-2xl font-bold text-white mt-1">-- L</p>
                            <p className="text-xs text-slate-400">Daily Average</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
