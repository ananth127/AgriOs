

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Plus, Ruler, QrCode, ShoppingBag } from 'lucide-react';
import QRCode from 'react-qr-code';
import { LogProductionModal } from './LogProductionModal';
import { QrPrintModal } from './QrPrintModal';

interface CategoryDashboardProps {
    category: string;
    animals: any[];
    onBack: () => void;
    onRegister: () => void;
    onSelectAnimal: (animal: any) => void;
    onLog: (animal: any) => void;
    onScanQr: (animal: any) => void;
    onSell: (animal: any) => void;
}

export const LivestockCategoryDashboard: React.FC<CategoryDashboardProps> = ({ category, animals, onBack, onRegister, onSelectAnimal, onLog, onScanQr, onSell }) => {
    // Local state for modals REMOVED - lifted to parent page

    // Filter logic
    const categoryAnimals = useMemo(() => animals.filter(a => (a.species || 'Other') === category), [animals, category]);

    const stats = useMemo(() => {
        let adults = 0;
        let young = 0;
        let males = 0;
        let females = 0;
        let production = 0;

        categoryAnimals.forEach(a => {
            const dob = new Date(a.date_of_birth);
            const ageInDays = (new Date().getTime() - dob.getTime()) / (1000 * 3600 * 24);
            if (ageInDays < 365) young++; else adults++;
            if (a.gender === 'Male') males++; else females++;
        });

        return { adults, young, males, females, production };
    }, [categoryAnimals]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Overview
                </button>
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{category} Dashboard</h2>
                    <button
                        onClick={onRegister}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add {category}
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-900 border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-bold">Total {category}s</p>
                    <p className="text-3xl font-bold text-white mt-1">{categoryAnimals.length}</p>
                </Card>
                <Card className="p-4 bg-slate-900 border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-bold">Adults / Young</p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <p className="text-3xl font-bold text-white">{stats.adults}</p>
                        <span className="text-slate-500">/</span>
                        <p className="text-xl font-medium text-slate-400">{stats.young}</p>
                    </div>
                </Card>
                <Card className="p-4 bg-slate-900 border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-bold">Male / Female</p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <p className="text-3xl font-bold text-blue-400">{stats.males}</p>
                        <span className="text-slate-500">/</span>
                        <p className="text-xl font-medium text-pink-400">{stats.females}</p>
                    </div>
                </Card>
            </div>

            {/* Detailed List */}
            <Card className="overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300 min-w-[700px]">
                            <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 font-medium">Identity</th>
                                    <th className="p-4 font-medium">Details</th>
                                    <th className="p-4 font-medium">Origin</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">QR / Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {categoryAnimals.map(animal => (
                                    <tr key={animal.id} className="hover:bg-white/5 group cursor-pointer" onClick={() => onSelectAnimal(animal)}>
                                        <td className="p-4">
                                            <div className="font-bold text-white">{animal.name || 'Unnamed'}</div>
                                            <div className="text-xs text-slate-500 font-mono">{animal.tag_id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${animal.gender === 'Male' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                                <span>{animal.breed}</span>
                                            </div>
                                            <div className="text-xs text-slate-500">{animal.weight_kg} kg • {calculateAge(animal.date_of_birth)}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs px-2 py-1 rounded bg-slate-800 w-fit">
                                                {animal.origin === 'BORN' ? 'Born Here' : 'Purchased'}
                                            </div>
                                            {animal.origin === 'PURCHASED' && (
                                                <div className="text-[10px] text-slate-500 mt-1 max-w-[150px] truncate" title={animal.source_details}>
                                                    {animal.source_details}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${animal.health_status === 'Healthy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {animal.health_status}
                                            </span>
                                            <div className="text-xs text-slate-500 mt-1">Purpose: {animal.purpose}</div>
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
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};

function calculateAge(dobStr: string) {
    if (!dobStr) return 'Unknown';
    const dob = new Date(dobStr);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();

    if (years > 0) return `${years}y ${months}m`;
    return `${months}m`;
}
