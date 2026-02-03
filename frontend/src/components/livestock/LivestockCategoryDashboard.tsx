

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Plus, Ruler, QrCode, ShoppingBag } from 'lucide-react';
import QRCode from 'react-qr-code';
import { LogProductionModal } from './LogProductionModal';
import { QrPrintModal } from './QrPrintModal';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('Livestock');
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
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title={t('back_to_overview')}
                    >
                        <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" />
                        <span className="hidden md:inline ml-2 text-sm">{t('back_to_overview')}</span>
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-none">{category} <span className="hidden md:inline">{t('dashboard')}</span></h2>
                </div>

                <button
                    onClick={onRegister}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 md:px-4 md:py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    title={t('add_category', { category })}
                >
                    <Plus className="w-5 h-5 md:w-4 md:h-4" />
                    <span className="hidden md:inline">{t('add_category', { category })}</span>
                </button>
            </div>

            {/* Quick Stats - Compact Mobile Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Card className="p-3 md:p-4 bg-slate-900 border-slate-800 col-span-2 sm:col-span-1">
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase font-bold">{t('total_category', { category })}</p>
                    <p className="text-2xl md:text-3xl font-bold text-white mt-1">{categoryAnimals.length}</p>
                </Card>
                {/* Combined Stats Row for Mobile */}
                <Card className="p-3 md:p-4 bg-slate-900 border-slate-800">
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase font-bold truncate">{t('adults_young')}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <p className="text-xl md:text-3xl font-bold text-white">{stats.adults}</p>
                        <span className="text-slate-500 text-xs">/</span>
                        <p className="text-base md:text-xl font-medium text-slate-400">{stats.young}</p>
                    </div>
                </Card>
                <Card className="p-3 md:p-4 bg-slate-900 border-slate-800">
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase font-bold truncate">{t('male_female')}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <p className="text-xl md:text-3xl font-bold text-blue-400">{stats.males}</p>
                        <span className="text-slate-500 text-xs">/</span>
                        <p className="text-base md:text-xl font-medium text-pink-400">{stats.females}</p>
                    </div>
                </Card>
            </div>

            {/* Detailed List */}
            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-3">
                {categoryAnimals.map(animal => (
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
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${animal.gender === 'Male' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                                <span>{animal.breed}</span>
                            </div>
                            <span>{calculateAge(animal.date_of_birth)}</span>
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
            </div>

            {/* Desktop View: Table */}
            <Card className="hidden md:block overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300 min-w-[700px]">
                            <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 font-medium">{t('identity')}</th>
                                    <th className="p-4 font-medium">{t('details')}</th>
                                    <th className="p-4 font-medium">{t('origin')}</th>
                                    <th className="p-4 font-medium">{t('status')}</th>
                                    <th className="p-4 font-medium text-right">{t('qr_actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {categoryAnimals.map(animal => (
                                    <tr key={animal.id} className="hover:bg-white/5 group cursor-pointer" onClick={() => onSelectAnimal(animal)}>
                                        <td className="p-4">
                                            <div className="font-bold text-white">{animal.name || t('unnamed')}</div>
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
                                                {animal.origin === 'BORN' ? t('born_here') : t('purchased')}
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
                                            <div className="text-xs text-slate-500 mt-1">{t('purpose')}: {animal.purpose}</div>
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
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};

function calculateAge(dobStr: string) {
    if (!dobStr) return 'Unknown'; // Note: This is a utility function, translation would need to be passed as param
    const dob = new Date(dobStr);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();

    if (years > 0) return `${years}y ${months}m`;
    return `${months}m`;
}
