'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { ShoppingBag, Search, Filter } from 'lucide-react';

export default function MarketplacePage() {
    const [listings, setListings] = useState<any[]>([]);

    useEffect(() => {
        api.marketplace.list()
            .then((data: any) => setListings(data))
            .catch(err => console.error("Failed to fetch listings", err));
    }, []);


    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Marketplace</h1>
                    <p className="text-slate-400">Buy inputs, rent services, or sell your waste-to-wealth outputs.</p>
                </div>
                <button className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    + Create Listing
                </button>
            </header>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search services, items..."
                        className="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50"
                    />
                </div>
                <button className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 flex items-center gap-2 text-sm text-slate-300 hover:bg-slate-800">
                    <Filter className="w-4 h-4" /> Filters
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {listings.map((item, i) => (
                    <Card key={i} className="group cursor-pointer hover:border-orange-500/30 transition-all hover:translate-y-[-2px]">
                        <div className="aspect-video bg-slate-800 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                            <span className="text-4xl opacity-50">📦</span>
                            <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white">
                                {item.category}
                            </div>
                        </div>
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-orange-400 font-mono font-bold">₹{item.price}/{item.price_unit}</span>
                            <span className="text-xs text-slate-500">Provider #{item.provider_id}</span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
