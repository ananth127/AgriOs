"use client";
import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FinancialDashboard } from '@/components/farm-management/FinancialDashboard';
import { CropTimeline } from '@/components/farm-management/CropTimeline';
import { LoanManager } from '@/components/farm-management/LoanManager';
import { LaborManager } from '@/components/farm-management/LaborManager';
import { IoTControl } from '@/components/farm-management/IoTControl';
import { LogActivityModal } from '@/components/farm-management/LogActivityModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { InventoryManager } from '@/components/farm-management/InventoryManager';
import { MachineryManager } from '@/components/farm-management/MachineryManager';

export default function FarmManagementPage() {
    const t = useTranslations('FarmManagement');
    const [activeTab, setActiveTab] = useState('overview');

    // Real Data States
    const [farmId, setFarmId] = useState(1); // Default to farm 1 for demo
    const [financialStats, setFinancialStats] = useState({
        totalInvestment: 0,
        totalRevenue: 0,
        netProfit: 0,
        projectedProfit: 0
    });
    const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    // Fetch initial data
    const refreshData = async () => {
        try {
            // 1. Fetch Financials
            const financials = await api.farmManagement.getFinancials(farmId);
            setFinancialStats({
                totalInvestment: financials.total_investment,
                totalRevenue: financials.estimated_revenue,
                netProfit: financials.net_profit,
                projectedProfit: 0
            });

            // 2. Fetch Timeline (Using crop cycle 1 for demo)
            const timeline = await api.farmManagement.getTimeline(1);
            setTimelineEvents(timeline);

            // 3. Fetch Suggestions based on Active Crops
            const activeCrops = await api.crops.list(farmId);
            const newSuggestions = [];

            // Mocking a Registry lookup or reusing if available. For now assuming we have names.
            // In a real scenario, we'd map registry_id to names.
            // Using a hardcoded list of potential diseases for demo variety
            const potentialDiseases = ["Aphids", "Rust", "Blight"];

            if (Array.isArray(activeCrops)) {
                // Fetch registry to map IDs to names if needed, or just guess for demo
                // Ideally activeCrops items should return crop name joined.
                // Assuming activeCrops returns simple objects, let's just make one call per crop

                // Note: The previous api.crops.list returns raw DB objects. 
                // We'll rely on the backend potentially returning names or just use a placeholder
                // if we don't want to fetch the registry here.
                // Or better: The backend service for suggestions takes a string.

                for (const crop of activeCrops.slice(0, 3)) { // Limit to 3 calls
                    // Fetch Fertilizer Suggestion
                    const fertParams = await api.farmManagement.getFertilizerSuggestion(farmId, "Wheat"); // Mock Name if not in object
                    newSuggestions.push({ ...fertParams, type: 'Fertilizer' });

                    // Randomly add a pesticide suggestion
                    if (Math.random() > 0.5) {
                        const pestParams = await api.farmManagement.getPesticideSuggestion(farmId, "Wheat", potentialDiseases[Math.floor(Math.random() * potentialDiseases.length)]);
                        newSuggestions.push({ ...pestParams, type: 'Pesticide' });
                    }
                }
            }
            // Remove duplicates or empties
            setSuggestions(newSuggestions);

        } catch (e) {
            console.error("Failed to load farm data", e);
        }
    };

    useEffect(() => {
        refreshData();
    }, [farmId]);

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
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium border first:rounded-l-lg last:rounded-r-lg capitalize mb-1 md:mb-0
                                ${activeTab === tab
                                    ? 'z-10 ring-2 ring-green-500 text-green-700 bg-white dark:bg-gray-700 dark:text-white dark:border-white'
                                    : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700'
                                }`}
                        >
                            {t(`tabs.${tab}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Areas */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <FinancialDashboard stats={financialStats} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Quick Actions / Suggestions */}
                        <Card>
                            <CardHeader><CardTitle>Smart Suggestions</CardTitle></CardHeader>
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
                                                        {suggestion.type === 'Pesticide' ? 'Pest Alert' : 'Fertilizer Logic'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {suggestion.reason} <br />
                                                        <strong>Use: {suggestion.suggested_item || suggestion.suggested_pesticide}</strong>
                                                        ({suggestion.quantity_per_acre_kg ? `${suggestion.quantity_per_acre_kg} kg/acre` : suggestion.dosage_per_acre})
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No immediate actions required.</p>
                                        <p className="text-xs mt-1">Add crops to generate AI suggestions.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle>Recent Activity</CardTitle>
                                <button
                                    onClick={() => setIsActivityModalOpen(true)}
                                    className="text-sm text-green-400 hover:text-green-300 font-medium"
                                >
                                    + Log Activity
                                </button>
                            </CardHeader>
                            <CardContent>
                                <div className="flow-root max-h-[300px] overflow-y-auto pr-2">
                                    <ul className="mb-0">
                                        {timelineEvents.slice().reverse().slice(0, 5).map((item, idx) => (
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
                                            <p className="text-center text-gray-500 py-4">No activities logged yet.</p>
                                        )}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'timeline' && (
                <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setIsActivityModalOpen(true)}
                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            + Add Event
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
                    <MachineryManager farmId={farmId} />
                </div>
            )}

            {activeTab === 'labor' && (
                <div className="animate-in fade-in duration-500">
                    <LaborManager />
                </div>
            )}

            {activeTab === 'iot' && (
                <div className="animate-in fade-in duration-500">
                    <IoTControl />
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
