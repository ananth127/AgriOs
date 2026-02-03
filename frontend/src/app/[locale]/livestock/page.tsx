'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { RegisterAnimalModal } from '@/components/livestock/RegisterAnimalModal';
import { EditAnimalModal } from '@/components/livestock/EditAnimalModal';
import { LivestockDetailModal } from '@/components/livestock/LivestockDetailModal';
import { LogProductionModal } from '@/components/livestock/LogProductionModal';
import { Trash2, Pencil, Leaf, Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { LivestockMainDashboard } from '@/components/livestock/LivestockMainDashboard';
import { LivestockCategoryDashboard } from '@/components/livestock/LivestockCategoryDashboard';

import { QrPrintModal } from '@/components/livestock/QrPrintModal';
import { SellLivestockModal } from '@/components/livestock/SellLivestockModal';
import { AddHousingModal } from '@/components/livestock/AddHousingModal';
import { AddFeedPlanModal } from '@/components/livestock/AddFeedPlanModal';

export default function LivestockPage() {
    const t = useTranslations('Livestock');
    const router = useRouter();
    const searchParams = useSearchParams();
    const animalIdParam = searchParams.get('animalId');

    const [animals, setAnimals] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState<any>(null);
    const [viewingAnimal, setViewingAnimal] = useState<any>(null); // For detail view
    const [loggingAnimal, setLoggingAnimal] = useState<any>(null); // For logging production
    const [qrModalAnimal, setQrModalAnimal] = useState<any>(null); // For QR printing
    const [sellingAnimal, setSellingAnimal] = useState<any>(null); // For selling
    const farmId = 1; // Default

    const [housing, setHousing] = useState<any[]>([]);
    const [feedPlans, setFeedPlans] = useState<any[]>([]);
    const [isAddHousingOpen, setIsAddHousingOpen] = useState(false);
    const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
    const [stats, setStats] = useState<any[]>([]);

    const fetchAnimals = async () => {
        try {
            // Concurrent fetching for better performance
            const [data, housingData, feedData, statsData]: [any, any, any, any] = await Promise.all([
                api.livestock.list(farmId),
                api.livestock.getHousing(farmId),
                api.livestock.getFeedPlans(),
                api.livestock.getStats(farmId)
            ]);

            // Onboarding Logic: If no animals found and never onboarded, create defaults
            if (Array.isArray(data) && data.length === 0) {
                const hasOnboarded = localStorage.getItem(`livestock_onboarded_${farmId}`);

                if (!hasOnboarded) {
                    console.log("🆕 New User Detected: Seeding default livestock...");

                    const defaultCow = {
                        tag_id: 'COW-DEMO-01',
                        name: 'Bella',
                        species: 'Cow',
                        breed: 'Holstein',
                        gender: 'Female',
                        date_of_birth: '2022-01-01',
                        weight_kg: 500,
                        health_status: 'Healthy',
                        purpose: 'Dairy',
                        origin: 'BORN',
                        farm_id: farmId
                    };

                    const defaultGoat = {
                        tag_id: 'GOAT-DEMO-01',
                        name: 'Billy',
                        species: 'Goat',
                        breed: 'Boer',
                        gender: 'Male',
                        date_of_birth: '2023-05-15',
                        weight_kg: 45,
                        health_status: 'Healthy',
                        purpose: 'Meat',
                        origin: 'PURCHASED',
                        source_details: 'Local Market',
                        farm_id: farmId
                    };

                    // Seed housing if none exists
                    if (housingData.length === 0) {
                        // We might want to seed housing here too, but simplest is to just proceed
                        // api.livestock.createHousing(...)
                    }

                    // Register them
                    try {
                        await Promise.all([
                            api.livestock.register(defaultCow),
                            api.livestock.register(defaultGoat)
                        ]);

                        localStorage.setItem(`livestock_onboarded_${farmId}`, 'true');
                        // Re-fetch after seeding
                        const seededData: any = await api.livestock.list(farmId);
                        setAnimals(seededData);
                    } catch (seedErr) {
                        console.error("Seeding failed, using mock state temporarily", seedErr);
                        setAnimals([
                            { ...defaultCow, id: 'temp-1' },
                            { ...defaultGoat, id: 'temp-2' }
                        ]);
                    }
                    return;
                }
            }

            setAnimals(data || []);
            setHousing(housingData || []);
            setFeedPlans(feedData || []);
            setStats(statsData || []);

        } catch (err) {
            console.error("Failed to fetch livestock data", err);
        }
    };

    useEffect(() => {
        fetchAnimals();
    }, []);

    // Handle URL param for direct access
    useEffect(() => {
        if (animalIdParam && animals.length > 0) {
            const found = animals.find(a => a.id.toString() === animalIdParam);
            if (found) {
                setViewingAnimal(found);
            }
        }
    }, [animalIdParam, animals]);

    const closeDetail = () => {
        setViewingAnimal(null);
        // clean up URL
        router.push('/livestock');
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-20 md:pb-20 pb-[calc(80px+env(safe-area-inset-bottom))]">
            {/* Header */}
            <div className="bg-slate-900 border-b border-white/5 px-4 py-6 md:px-8 md:py-8 mb-4 md:mb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="text-blue-400 font-bold uppercase tracking-wider text-xs">{t('farm_operations')}</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">{t('page_title')}</h1>
                        <p className="text-slate-400 max-w-xl text-sm md:text-base hidden md:block">
                            {t('page_subtitle')}
                        </p>
                    </div>

                    {!selectedCategory && (
                        <button
                            onClick={() => setIsRegisterOpen(true)}
                            className="w-full md:w-auto bg-green-500 hover:bg-green-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-green-900/20"
                        >
                            + {t('register_animal')}
                        </button>
                    )}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
                {selectedCategory ? (
                    <LivestockCategoryDashboard
                        category={selectedCategory}
                        animals={animals}
                        onBack={() => setSelectedCategory(null)}
                        onRegister={() => setIsRegisterOpen(true)}
                        onSelectAnimal={(a) => setViewingAnimal(a)}
                        onLog={(a) => setLoggingAnimal(a)}
                        onScanQr={(a) => setQrModalAnimal(a)}
                        onSell={(a) => setSellingAnimal(a)}
                    />
                ) : (
                    <LivestockMainDashboard
                        animals={animals}
                        housing={housing}
                        feedPlans={feedPlans}
                        stats={stats}
                        onSelectCategory={setSelectedCategory}
                        onSelectAnimal={(a) => setViewingAnimal(a)}
                        onLog={(a) => setLoggingAnimal(a)}
                        onScanQr={(a) => setQrModalAnimal(a)}
                        onSell={(a) => setSellingAnimal(a)}
                        onAddHousing={() => setIsAddHousingOpen(true)}
                        onAddFeedPlan={() => setIsAddFeedOpen(true)}
                        onDeleteHousing={async (id) => {
                            if (!confirm(t('confirm_delete_shelter'))) return;
                            try {
                                await api.livestock.deleteHousing(id);
                                fetchAnimals();
                            } catch (e) {
                                console.error(e);
                                alert(t('failed_delete_shelter'));
                            }
                        }}
                        onDeleteFeedPlan={async (id) => {
                            if (!confirm(t('confirm_delete_feed'))) return;
                            try {
                                await api.livestock.deleteFeedPlan(id);
                                fetchAnimals();
                            } catch (e) {
                                console.error(e);
                                alert(t('failed_delete_plan'));
                            }
                        }}
                    />
                )}
            </main>

            <RegisterAnimalModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onSuccess={fetchAnimals}
                farmId={farmId}
            />

            <AddHousingModal
                isOpen={isAddHousingOpen}
                onClose={() => setIsAddHousingOpen(false)}
                onSuccess={fetchAnimals}
                farmId={farmId}
            />

            <AddFeedPlanModal
                isOpen={isAddFeedOpen}
                onClose={() => setIsAddFeedOpen(false)}
                onSuccess={fetchAnimals}
                housingList={housing}
                animals={animals}
            />

            {editingAnimal && (
                <EditAnimalModal
                    isOpen={!!editingAnimal}
                    onClose={() => setEditingAnimal(null)}
                    onSuccess={fetchAnimals}
                    animal={editingAnimal}
                    housingList={housing}
                />
            )}

            {/* Detail Modal */}
            {viewingAnimal && (
                <LivestockDetailModal
                    animal={viewingAnimal}
                    onClose={closeDetail}
                    onEdit={() => {
                        setEditingAnimal(viewingAnimal);
                        setViewingAnimal(null); // Switch to edit mode
                    }}
                    onLogProduction={() => {
                        setLoggingAnimal(viewingAnimal);
                        setViewingAnimal(null);
                    }}
                    onDelete={async () => {
                        if (!confirm(t('confirm_delete_animal'))) return;
                        try {
                            await api.livestock.delete(viewingAnimal.id);
                            setViewingAnimal(null);
                            await fetchAnimals(); // Refresh list
                        } catch (e) {
                            console.error("Failed to delete", e);
                            alert(t('failed_delete_animal'));
                        }
                    }}
                    onPrintQr={(a) => setQrModalAnimal(a)}
                    onSell={(a) => {
                        setSellingAnimal(a); // Open sell modal
                        setViewingAnimal(null); // Close detail modal
                    }}
                />
            )}

            {/* Logging Modal */}
            {loggingAnimal && (
                <LogProductionModal
                    isOpen={!!loggingAnimal}
                    onClose={() => setLoggingAnimal(null)}
                    animal={loggingAnimal}
                    onSuccess={fetchAnimals}
                />
            )}

            {/* QR Print Modal */}
            {qrModalAnimal && (
                <QrPrintModal
                    isOpen={!!qrModalAnimal}
                    onClose={() => setQrModalAnimal(null)}
                    animal={qrModalAnimal}
                />
            )}

            {/* Sell Livestock Modal */}
            {sellingAnimal && (
                <SellLivestockModal
                    isOpen={!!sellingAnimal}
                    onClose={() => setSellingAnimal(null)}
                    animal={sellingAnimal}
                />
            )}
        </div>
    );
}
