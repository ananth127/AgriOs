'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { ShoppingBag, Search, Filter, Pencil, Trash2 } from 'lucide-react';
import { CreateListingModal } from '@/components/marketplace/CreateListingModal';
import { EditListingModal } from '@/components/marketplace/EditListingModal';

export default function MarketplacePage() {
    const [listings, setListings] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'browse' | 'my-listings'>('browse');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<any>(null);
    const myUserId = 1; // Default for demo

    const fetchListings = () => {
        api.marketplace.products.list()
            .then((data: any) => setListings(data as any))
            .catch(err => console.error("Failed to fetch listings", err));
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Remove this listing from the marketplace?")) return;
        try {
            await api.marketplace.products.delete(id);
            fetchListings();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete listing");
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const displayedListings = activeTab === 'browse'
        ? listings
        : listings.filter(l => l.seller_id === myUserId);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Marketplace</h1>
                    <p className="text-slate-400">Buy inputs, rent services, or sell your waste-to-wealth outputs.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                >
                    + Create Listing
                </button>
            </header>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('browse')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'browse' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400'}`}
                >
                    Browse Listings
                </button>
                <button
                    onClick={() => setActiveTab('my-listings')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my-listings' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400'}`}
                >
                    My Listings {displayedListings.length > 0 && activeTab !== 'my-listings' && listings.filter(l => l.seller_id === myUserId).length > 0 && `(${listings.filter(l => l.seller_id === myUserId).length})`}
                </button>
            </div>

            {/* Filters (Only for Browse) */}
            {activeTab === 'browse' && (
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
            )}

            {displayedListings.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-lg border border-white/5 border-dashed">
                    <p className="text-lg">No listings found.</p>
                    {activeTab === 'my-listings' && <p className="text-sm">You haven&apos;t posted anything yet.</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {displayedListings.map((item, i) => (
                        <Card key={i} className="group cursor-pointer hover:border-orange-500/30 transition-all hover:translate-y-[-2px] relative">
                            {/* Edit/Delete Controls for My Listings */}
                            {activeTab === 'my-listings' && (
                                <div className="absolute top-2 right-2 z-10 flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingListing(item); }}
                                        className="bg-slate-900/80 text-blue-400 hover:bg-blue-600 hover:text-white p-1.5 rounded-md backdrop-blur transition-all"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                        className="bg-slate-900/80 text-red-400 hover:bg-red-600 hover:text-white p-1.5 rounded-md backdrop-blur transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <div className="aspect-video bg-slate-800 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                                <span className="text-4xl opacity-50">📦</span>
                                <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white">
                                    {item.category}
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-white truncate">{item.product_name}</h3>
                            <p className="text-xs text-slate-400 pb-2">{item.location || 'Unknown Location'}</p>
                            <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-2">
                                <span className="text-orange-400 font-mono font-bold">₹{item.price}/{item.unit}</span>
                                <span className="text-xs text-slate-500">{item.quantity} {item.unit} left</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <CreateListingModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchListings}
            />

            {editingListing && (
                <EditListingModal
                    isOpen={!!editingListing}
                    onClose={() => setEditingListing(null)}
                    onSuccess={fetchListings}
                    listing={editingListing}
                />
            )}
        </div>
    );
}
