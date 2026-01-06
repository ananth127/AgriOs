'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { RegisterAnimalModal } from '@/components/livestock/RegisterAnimalModal';
import { EditAnimalModal } from '@/components/livestock/EditAnimalModal';
import { Trash2, Pencil } from 'lucide-react';

export default function LivestockPage() {
    const [animals, setAnimals] = useState<any[]>([]);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState<any>(null);
    const farmId = 1; // Default

    const fetchAnimals = () => {
        api.livestock.list(farmId)
            .then((data: any) => setAnimals(data as any[]))
            .catch(err => console.error("Failed to fetch livestock", err));
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Remove this animal from the herd registry?")) return;
        try {
            await api.livestock.delete(id);
            fetchAnimals();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete animal");
        }
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
                <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                >
                    + Register Animal
                </button>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                    <h3 className="text-blue-400 text-sm font-bold uppercase">Total Headcount</h3>
                    <p className="text-3xl font-bold mt-1 text-white">{animals.length}</p>
                </Card>
                <Card className="p-4 bg-red-500/10 border-red-500/20">
                    <h3 className="text-red-400 text-sm font-bold uppercase">Critical Alert</h3>
                    <p className="text-3xl font-bold mt-1 text-white">{animals.filter(a => a.health_status === 'Critical').length}</p>
                    <p className="text-xs text-red-300 mt-1">Animals needing attention</p>
                </Card>
            </div>

            {/* List */}
            <Card className="overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800 text-slate-400">
                        <tr>
                            <th className="p-4">Tag ID</th>
                            <th className="p-4">Species/Breed</th>
                            <th className="p-4">Health Status</th>
                            <th className="p-4">Last Vaccination</th>
                            <th className="p-4">Weight</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {animals.map((anim) => (
                            <tr key={anim.id} className="hover:bg-white/5 group">
                                <td className="p-4 font-mono font-bold text-white">{anim.tag_id}</td>
                                <td className="p-4">{anim.species} - {anim.breed}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${anim.health_status === 'Healthy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {anim.health_status}
                                    </span>
                                </td>
                                <td className="p-4">{anim.last_vaccination_date || '-'}</td>
                                <td className="p-4">{anim.weight_kg} kg</td>
                                <td className="p-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingAnimal(anim)}
                                        className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-white/5"
                                        title="Edit"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(anim.id)}
                                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-white/5"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {animals.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500">
                                    No animals registered. Click &quot;+ Register Animal&quot; to add your herd.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

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
