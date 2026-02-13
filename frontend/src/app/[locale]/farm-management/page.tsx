"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/navigation';
import { useTranslations } from 'next-intl';
import { FinancialDashboard } from '@/components/farm-management/FinancialDashboard';
import { CropTimeline } from '@/components/farm-management/CropTimeline';
import { LoanManager } from '@/components/farm-management/LoanManager';
import { LaborManager } from '@/components/farm-management/LaborManager';
import { IoTControl } from '@/components/farm-management/IoTControl';
import { LogActivityModal } from '@/components/farm-management/LogActivityModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ContentLoader } from '@/components/ui/ContentLoader';
import { api } from '@/lib/api';
import { getUserFarmId } from '@/lib/userFarm';
import { InventoryManager } from '@/components/farm-management/InventoryManager';
import { MachineryManager } from '@/components/farm-management/MachineryManager';

export default function FarmManagementPage() {
    const t = useTranslations('FarmManagement');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize tab from URL or default to 'overview'
    // Initialize tab from URL or default to 'overview'
    // Normalize 'irrigation' -> 'iot'
    const initialTab = searchParams.get('tab') || 'overview';
    const [activeTab, setActiveTab] = useState(initialTab === 'irrigation' ? 'iot' : initialTab);

    // Sync state if URL changes (e.g. back button)
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'irrigation') {
            // Alias for iot
            setActiveTab('iot');
        } else if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        // Update URL without full reload (using shallow replacement if possible, or just push)
        router.push(`${pathname}?tab=${tab}`);
    };

    // Real Data States
    const [farmId, setFarmId] = useState<number | null>(null); // Will be fetched dynamically
    const [financialStats, setFinancialStats] = useState({
        totalInvestment: 0,
        totalRevenue: 0,
        netProfit: 0,
        projectedProfit: 0
    });
    const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch user's farm ID on mount (cached after first call)
    useEffect(() => {
        getUserFarmId()
            .then(id => setFarmId(id))
            .catch(() => setFarmId(1));
    }, []);

    // Fetch initial data
    const refreshData = useCallback(async () => {
        if (!farmId) return;

        setLoading(true);
        try {
            // Parallel fetch: financials, timeline, and crops all at once
            const [financials, timeline, activeCrops] = await Promise.all([
                api.farmManagement.getFinancials(farmId) as Promise<any>,
                api.farmManagement.getTimeline(farmId) as Promise<any>,
                api.crops.list(farmId) as Promise<any[]>,
            ]);

            setFinancialStats({
                totalInvestment: financials.total_investment,
                totalRevenue: financials.estimated_revenue,
                netProfit: financials.net_profit,
                projectedProfit: 0
            });

            setTimelineEvents(timeline);

            // Fetch one fertilizer + one pesticide suggestion in parallel (not per-crop loop)
            const cropName = Array.isArray(activeCrops) && activeCrops.length > 0
                ? (activeCrops[0] as any).name || "Wheat"
                : "Wheat";

            const [fertSuggestion, pestSuggestion] = await Promise.all([
                api.farmManagement.getFertilizerSuggestion(farmId, cropName) as Promise<any>,
                api.farmManagement.getPesticideSuggestion(farmId, cropName, "Aphids") as Promise<any>,
            ]);

            const newSuggestions = [
                { ...fertSuggestion, type: 'Fertilizer' },
                { ...pestSuggestion, type: 'Pesticide' },
            ];
            setSuggestions(newSuggestions);

        } catch (e) {
            console.error("Failed to load farm data", e);
        } finally {
            setLoading(false);
        }
    }, [farmId]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // Show loading while farmId is being fetched
    if (farmId === null) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">{t('loading_farm')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('description')}</p>
                </div>

                {/* Tabs */}
                <div className="mt-4 md:mt-0 inline-flex flex-wrap rounded-md shadow-sm" role="group">
                    {['overview', 'timeline', 'loans', 'inventory', 'machinery', 'labor', 'iot'].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => handleTabChange(tab)}
                            className={`px-4 py-2 text-sm font-medium border first:rounded-l-lg last:rounded-r-lg capitalize mb-1 md:mb-0
                                ${activeTab === tab
                                    ? 'z-10 ring-2 ring-green-500 text-green-700 bg-white dark:bg-gray-700 dark:text-white dark:border-white'
                                    : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700'
                                }`}
                        >
                            {tab === 'iot' ? "IoT Devices" : t(`tabs.${tab}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Areas */}
            {activeTab === 'overview' && (
                <ContentLoader loading={loading} text={t('overview_loader')}>
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <FinancialDashboard stats={financialStats} />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Quick Actions / Suggestions */}
                            <Card>
                                <CardHeader><CardTitle>{t('smart_suggestions')}</CardTitle></CardHeader>
                                <CardContent>
                                    {suggestions.length > 0 ? (
                                        <ul className="space-y-3">
                                            {suggestions.map((suggestion, idx) => (
                                                <li key={idx} className={`flex items-start space-x-3 p-3 rounded-lg ${suggestion.type === 'Pesticide' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                                                    <span className={`font-bold ${suggestion.type === 'Pesticide' ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        {suggestion.type === 'Pesticide' ? '⚠️' : '💧'}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {suggestion.type === 'Pesticide' ? t('pest_alert') : t('fert_logic')}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {suggestion.reason} <br />
                                                            <strong>{t('suggestion_use', { item: suggestion.suggested_item || suggestion.suggested_pesticide })}</strong>
                                                            ({suggestion.quantity_per_acre_kg ? `${suggestion.quantity_per_acre_kg} kg/acre` : suggestion.dosage_per_acre})
                                                        </p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>{t('no_suggestions')}</p>
                                            <p className="text-xs mt-1">{t('add_crops_hint')}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card>
                                <CardHeader className="flex flex-row justify-between items-center">
                                    <CardTitle>{t('recent_activity')}</CardTitle>
                                    <button
                                        onClick={() => setIsActivityModalOpen(true)}
                                        className="text-sm text-green-400 hover:text-green-300 font-medium"
                                    >
                                        {t('btn_log_activity')}
                                    </button>
                                </CardHeader>
                                <CardContent>
                                    <div className="flow-root max-h-[300px] overflow-y-auto pr-2">
                                        <ul className="mb-0">
                                            {timelineEvents.slice(0, 5).map((item, idx) => (
                                                <li key={idx} className="py-3 sm:py-4 border-b last:border-0 dark:border-gray-700">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                                                                {item.title}
                                                            </p>
                                                            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                                                {item.details}
                                                            </p>
                                                        </div>
                                                        <div className="inline-flex items-center text-xs font-semibold text-gray-900 dark:text-gray-500">
                                                            {new Date(item.date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                            {timelineEvents.length === 0 && (
                                                <p className="text-center text-gray-500 py-4">{t('no_activity')}</p>
                                            )}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </ContentLoader>
            )}

            {activeTab === 'timeline' && (
                <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setIsActivityModalOpen(true)}
                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            {t('btn_add_event')}
                        </button>
                    </div>
                    <CropTimeline cropName="Current Crop Cycle" events={timelineEvents} />
                </div>
            )}

            {activeTab === 'loans' && (
                <div className="animate-in fade-in duration-500">
                    <LoanManager farmId={farmId} />
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="animate-in fade-in duration-500">
                    <InventoryManager farmId={farmId} />
                </div>
            )}

            {activeTab === 'machinery' && (
                <div className="animate-in fade-in duration-500">
                    <MachineryManager farmId={farmId} category="machinery" />
                </div>
            )}

            {activeTab === 'labor' && (
                <div className="animate-in fade-in duration-500">
                    <LaborManager />
                </div>
            )}

            {activeTab === 'iot' && (
                <div className="animate-in fade-in duration-500">
                    <MachineryManager farmId={farmId} category="iot" />
                </div>
            )}

            {/* Modals */}
            <LogActivityModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                onSuccess={refreshData}
                farmId={farmId}
                cropCycleId={1} // Defaulting to 1 for demo
            />
        </div>
    );
}
