'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';

export default function MarketplaceWidget() {
    const [listings, setListings] = useState<any[]>([]);

    useEffect(() => {
        api.marketplace.list()
            .then((data: any) => setListings(data.slice(0, 3))) // Show top 3
            .catch(err => console.error("Failed to fetch marketplace feed", err));
    }, []);

    return (
        <div className="col-span-1 md:col-span-2 row-span-1 rounded-2xl bg-slate-900 border border-white/10 p-6 overflow-hidden">
            <h2 className="text-lg font-semibold mb-4 text-orange-400">Marketplace Feed</h2>
            <div className="space-y-3">
                {listings.length > 0 ? (
                    listings.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors">
                            <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center text-orange-500">
                                {item.category === "Service" ? "🚜" : "🌾"}
                            </div>
                            <div>
                                <div className="text-sm font-medium">{item.title}</div>
                                <div className="text-xs text-slate-500">₹{item.price}/{item.price_unit} • Provider #{item.provider_id}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-slate-600 text-sm">No active listings nearby.</div>
                )}
            </div>
        </div>
    );
}
