'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';

export default function LivestockPage() {
    const [animals, setAnimals] = useState<any[]>([]);

    useEffect(() => {
        // Fetching for Farm ID 1 (Sunny Acres) for demo
        api.livestock.list(1)
            .then((data: any) => setAnimals(data))
            .catch(err => console.error("Failed to fetch livestock", err));
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Smart Herd</h1>
                    <p className="text-slate-400">Monitor health, vaccination cycles, and productivity.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    + Register Animal
                </button>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                    <h3 className="text-blue-400 text-sm font-bold uppercase">Total Headcount</h3>
                    <p className="text-3xl font-bold mt-1">42</p>
                </Card>
                <Card className="p-4 bg-red-500/10 border-red-500/20">
                    <h3 className="text-red-400 text-sm font-bold uppercase">Critical Alert</h3>
                    <p className="text-3xl font-bold mt-1">1</p>
                    <p className="text-xs text-red-300 mt-1">Cow #102 - High Temp</p>
                </Card>
            </div>

            {/* List */}
            <Card className="overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800 text-slate-400">
                        <tr>
                            <th className="p-4">Tag ID</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Health Status</th>
                            <th className="p-4">Last Vaccination</th>
                            <th className="p-4">Weight</th>
                            <th className="p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {animals.map((anim) => (
                            <tr key={anim.id} className="hover:bg-white/5">
                                <td className="p-4 font-mono">{anim.tag_id}</td>
                                <td className="p-4">Gir Cow (Reg #{anim.registry_id})</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${anim.health_status === 'Healthy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {anim.health_status}
                                    </span>
                                </td>
                                <td className="p-4">{anim.last_vaccination_date || 'N/A'}</td>
                                <td className="p-4">{anim.weight_kg} kg</td>
                                <td className="p-4 text-right text-blue-400 cursor-pointer">View</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
