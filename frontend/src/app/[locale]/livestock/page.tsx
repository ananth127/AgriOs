'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { RegisterAnimalModal } from '@/components/livestock/RegisterAnimalModal';
import { EditAnimalModal } from '@/components/livestock/EditAnimalModal';
import { Trash2, Pencil } from 'lucide-react';

import { LivestockMainDashboard } from '@/components/livestock/LivestockMainDashboard';
import { LivestockCategoryDashboard } from '@/components/livestock/LivestockCategoryDashboard';

export default function LivestockPage() {
    const [animals, setAnimals] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState<any>(null);
    const farmId = 1; // Default

    const fetchAnimals = () => {
        api.livestock.list(farmId)
            .then((data: any) => {
                // Mocking species data if missing (because backend GET might not be joining Registry name yet)
                // In a real scenario, the backend GET /livestock/farm/{id} should return the species name.
                // Assuming backend 'registry_id' is foreign key but we need 'species' string.
                // Let's patch it for now if needed or assume data has it. 
                // Actually, Frontend can guess species from Tag ID prefix (COW-...) if backend doesn't send it.
                // Or better, update backend List endpoint to include Registry info. 

                // For now, I will let the data pass through.
                setAnimals(data);
            })
            .catch(err => console.error("Failed to fetch livestock", err));
    };

    useEffect(() => {
        fetchAnimals();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Smart Herd</h1>
                    <p className="text-slate-400">Monitor health, vaccination cycles, and productivity.</p>
                </div>
                {!selectedCategory && (
                    <button
                        onClick={() => setIsRegisterOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                    >
                        + Register Animal
                    </button>
                )}
            </header>

            {selectedCategory ? (
                <LivestockCategoryDashboard
                    category={selectedCategory}
                    animals={animals}
                    onBack={() => setSelectedCategory(null)}
                    onRegister={() => setIsRegisterOpen(true)}
                />
            ) : (
                <LivestockMainDashboard
                    animals={animals}
                    onSelectCategory={setSelectedCategory}
                    onSelectAnimal={(a) => { }}
                />
            )}

            <RegisterAnimalModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onSuccess={fetchAnimals}
                farmId={farmId}
            />

            {editingAnimal && (
                <EditAnimalModal
                    isOpen={!!editingAnimal}
                    onClose={() => setEditingAnimal(null)}
                    onSuccess={fetchAnimals}
                    animal={editingAnimal}
                />
            )}
        </div>
    );
}
