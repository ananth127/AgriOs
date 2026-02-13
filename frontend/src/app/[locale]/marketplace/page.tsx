
'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { ContentLoader } from '@/components/ui/ContentLoader';
import { ShoppingBag, Search, Filter, Pencil, Trash2, Tag, Tractor, Sprout, Wheat, ShoppingCart, RefreshCw, Briefcase, MapPin, DollarSign, Clock, User } from 'lucide-react';
import { CreateListingModal } from '@/components/marketplace/CreateListingModal';
import { EditListingModal } from '@/components/marketplace/EditListingModal';
import { CreateJobModal } from '@/components/marketplace/CreateJobModal';
import { PurchaseModal } from '@/components/marketplace/PurchaseModal';

/* Types */
type ViewMode = 'market' | 'jobs' | 'store'; // Market (P2P), Jobs, Store (B2B)
type ListingType = 'SELL' | 'BUY' | 'RENT' | 'ALL';

export default function MarketplacePage() {
    const t = useTranslations('Marketplace');
    /* State: View & Data */
    const [viewMode, setViewMode] = useState<ViewMode>('market');
    const [listings, setListings] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [commercialProducts, setCommercialProducts] = useState<any[]>([]);

    /* State: Filters */
    const [activeTab, setActiveTab] = useState<'browse' | 'my-listings'>('browse');
    const [listingType, setListingType] = useState<ListingType>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    /* State: Modals */
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<any>(null);
    const [purchasingItem, setPurchasingItem] = useState<any>(null);

    const myUserId = 1; // Default for demo

    const [loading, setLoading] = useState(false);

    /* Fetch Data */
    const fetchListings = useCallback((force = false) => {
        setLoading(true);
        const filters: any = {};
        if (listingType !== 'ALL') filters.listing_type = listingType;
        if (categoryFilter) filters.category = categoryFilter;
        if (searchQuery) filters.search = searchQuery;

        api.marketplace.products.list(filters, { forceRefresh: force })
            .then((data: any) => setListings(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error("Failed to fetch listings", err);
                setListings([]);
            })
            .finally(() => setLoading(false));
    }, [listingType, categoryFilter, searchQuery]);

    const fetchCommercialProducts = useCallback(() => {
        setLoading(true);
        const filters: any = {};
        if (categoryFilter) filters.category = categoryFilter;

        api.marketplace.commercial.list(filters)
            .then((data: any) => setCommercialProducts(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error("Failed to fetch commercial products", err);
                setCommercialProducts([]);
            })
            .finally(() => setLoading(false));
    }, [categoryFilter]);

    // Fetch Jobs (Real)
    const fetchJobs = useCallback(() => {
        setLoading(true);
        api.marketplace.jobs.list()
            .then((data: any) => setJobs(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error("Failed to fetch jobs", err);
                setJobs([]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (viewMode === 'market') {
            fetchListings();
        } else if (viewMode === 'store') {
            fetchCommercialProducts();
        } else if (viewMode === 'jobs') {
            fetchJobs();
        }
    }, [viewMode, fetchListings, fetchCommercialProducts, fetchJobs]);

    /* Accessors */
    /* Accessors */
    const displayedListings = listings.filter(l => {
        if (activeTab === 'my-listings') {
            return l.seller_id === myUserId;
        } else {
            // Browse: Show everything EXCEPT my non-default listings? 
            // Actually standard marketplace browse is "Everything that isn't mine".
            // But if I want to see my default demo data, I should look in "My Listings".
            return l.seller_id !== myUserId;
        }
    });

    /* Handlers */
    const handleDelete = async (id: number) => {
        if (!confirm(t('confirm_delete'))) return;
        try {
            await api.marketplace.products.delete(id);
            fetchListings();
        } catch (error) {
            console.error("Delete failed", error);
            alert(t('error_delete'));
        }
    };

    const handleBuy = (item: any) => {
        setPurchasingItem(item);
    };

    const handleApplyJob = (job: any) => {
        alert(`Application sent for ${job.title}! You can track this in 'Track & Trace'.`);
    };

    const renderViewTab = (mode: ViewMode, label: string, icon: any) => (
        <button
            onClick={() => {
                setViewMode(mode);
                setCategoryFilter(''); // Reset filters on switch
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm border ${viewMode === mode
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-emerald-900/20'
                : 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
            {/* Header & Navigation */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                            {t('title')}
                        </h1>
                        <p className="text-slate-400 text-sm md:text-base">
                            Discover products, supplies, and opportunities.
                        </p>
                    </div>
                </div>

                {/* Mobile Scrollable Navigation */}
                <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex gap-3 min-w-max">
                        {renderViewTab('market', 'Marketplace', <ShoppingBag className="w-4 h-4" />)}
                        {renderViewTab('jobs', 'Job Board', <Briefcase className="w-4 h-4" />)}
                        {renderViewTab('store', 'Commercial Store', <ShoppingCart className="w-4 h-4" />)}
                    </div>
                </div>
            </div>

            {/* --- MARKET MODE (P2P) --- */}
            {viewMode === 'market' && (
                <>
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm sticky top-0 z-10 transition-all">

                        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                            {/* Tabs: Browse vs My Listings */}
                            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 mr-2">
                                <button
                                    onClick={() => setActiveTab('browse')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'browse' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                                >
                                    Browse Market
                                </button>
                                <button
                                    onClick={() => setActiveTab('my-listings')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'my-listings' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                                >
                                    My Listings
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative flex-grow md:flex-grow-0 w-full md:w-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                                />
                            </div>

                            <select
                                value={listingType}
                                onChange={e => setListingType(e.target.value as ListingType)}
                                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none flex-grow md:flex-grow-0"
                            >
                                <option value="ALL">All Types</option>
                                <option value="SELL">For Sale</option>
                                <option value="BUY">Wanted</option>
                                <option value="RENT">Rentals</option>
                            </select>

                            <button
                                onClick={() => fetchListings(true)}
                                className="p-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-400 hover:text-white"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <span>+</span> Post Listing
                        </button>
                    </div>

                    {/* Listings Grid */}
                    <ContentLoader loading={loading} text={t('loading_listings')}>
                        {displayedListings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
                                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-3xl opacity-50">
                                    📦
                                </div>
                                <p className="text-slate-400 font-bold">No active listings found</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {activeTab === 'my-listings' ? "You haven't posted anything yet." : "Be the first to post something!"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {displayedListings.map((item, i) => (
                                    <Card
                                        key={i}
                                        className={`group overflow-hidden border-white/5 bg-slate-900/80 hover:border-emerald-500/30 transition-all ${item.is_default ? 'opacity-90 border-dashed border-slate-700' : ''}`}
                                    >
                                        {/* Image Area */}
                                        <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden">
                                            {item.image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">
                                                    {item.category === 'Livestock' ? '🐮' : '🥦'}
                                                </div>
                                            )}

                                            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm border border-black/10
                                                ${item.listing_type === 'SELL' ? 'bg-emerald-600' :
                                                    item.listing_type === 'BUY' ? 'bg-blue-600' : 'bg-orange-600'}`}>
                                                {item.listing_type}
                                            </div>

                                            {/* Default/Demo Badge */}
                                            {item.is_default && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-500 text-black shadow-sm" title="This is a demo listing. Create your own to remove it.">
                                                    Demo Data
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <div className="mb-2">
                                                <h3 className="font-bold text-white text-lg line-clamp-1">{item.product_name}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {item.seller_id ? `Seller #${item.seller_id}` : 'Anonymous'}
                                                    {item.seller_id === myUserId && " (You)"}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                                <div className="font-mono text-emerald-400 font-bold text-lg">
                                                    ₹{item.price} <span className="text-[10px] text-slate-500 font-sans font-normal">/ {item.unit}</span>
                                                </div>

                                                {item.seller_id === myUserId ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setEditingListing(item)}
                                                            className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-1.5 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleBuy(item)}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/20 transition-colors"
                                                    >
                                                        {item.listing_type === 'SELL' ? 'Buy Now' : 'Contact'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ContentLoader>
                </>
            )}

            {/* --- JOBS MODE --- */}
            {viewMode === 'jobs' && (
                <div className="animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Briefcase className="w-4 h-4" />
                            <span>Find work or hire help</span>
                        </div>
                        <button
                            onClick={() => setIsJobModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                        >
                            <span>+</span> Post Job
                        </button>
                    </div>

                    <ContentLoader loading={loading} text="Loading opportunities...">
                        {jobs.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
                                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-3xl opacity-50">
                                    👷
                                </div>
                                <p className="text-slate-400 font-bold">No active job listings found</p>
                                <p className="text-xs text-slate-500 mt-1">Be the first to post a job!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {jobs.map((job) => (
                                    <div key={job.id} className="bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all group relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center font-bold text-xl">
                                                {job.title ? job.title.charAt(0) : 'J'}
                                            </div>
                                            <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Contract</span>
                                        </div>

                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{job.title}</h3>
                                        <p className="text-sm text-slate-400 mb-4">Farm #{job.farm_id}</p>

                                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
                                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> On Site</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Start: {new Date(job.start_date).toLocaleDateString()}</span>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <span className="font-bold text-white">₹{job.wage_per_day}/day</span>
                                            <button
                                                onClick={() => handleApplyJob(job)}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20"
                                            >
                                                Apply Now
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ContentLoader>
                </div>
            )}

            {/* --- STORE MODE (Commercial) --- */}
            {viewMode === 'store' && (
                <div className="animate-in fade-in duration-300">
                    <div className="flex gap-2 items-center mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {['', 'Seeds', 'Pesticides', 'Fertilizers'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === cat
                                    ? 'bg-blue-600 text-white border-transparent shadow-lg shadow-blue-900/20'
                                    : 'bg-slate-900 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                {cat || 'All Products'}
                            </button>
                        ))}
                    </div>

                    <ContentLoader loading={loading} text={t('loading_store')}>
                        {commercialProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 rounded-3xl border border-white/5 border-dashed">
                                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-3xl opacity-50">
                                    🏪
                                </div>
                                <p className="text-slate-400 font-bold">No products found</p>
                                <p className="text-xs text-slate-500 mt-1">Try selecting a different category or check back later.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {commercialProducts.map((prod, i) => (
                                    <Card key={i} className="group overflow-hidden border-white/5 bg-slate-900/40 hover:bg-slate-900/80 transition-all hover:border-blue-500/30">
                                        <div className="aspect-square bg-white p-4 flex items-center justify-center relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={prod.image_url} alt={prod.brand_name} className="max-w-full max-h-full object-contain" />
                                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded">
                                                {prod.category}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="text-xs text-blue-400 font-bold uppercase mb-1">{prod.manufacturer}</div>
                                            <h3 className="text-lg font-bold text-white leading-tight mb-2">{prod.brand_name}</h3>
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="text-xl font-bold text-white">₹{prod.unit_price}</div>
                                                <button className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                                                    <ShoppingCart className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ContentLoader>
                </div>
            )}

            {/* Create Modal */}
            <CreateListingModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => fetchListings(true)}
            />

            <CreateJobModal
                isOpen={isJobModalOpen}
                onClose={() => setIsJobModalOpen(false)}
                onSuccess={fetchJobs}
            />

            {/* Edit Modal Logic (Simplified for this version) */}
            {editingListing && (
                <EditListingModal
                    isOpen={!!editingListing}
                    onClose={() => setEditingListing(null)}
                    onSuccess={() => fetchListings(true)}
                    listing={editingListing}
                />
            )}

            {/* Purchase Modal */}
            {purchasingItem && (
                <PurchaseModal
                    isOpen={!!purchasingItem}
                    item={purchasingItem}
                    onClose={() => setPurchasingItem(null)}
                    onSuccess={() => {
                        // Maybe move to "My Orders" or refresh
                        setPurchasingItem(null);
                    }}
                />
            )}
        </div>
    );
}
