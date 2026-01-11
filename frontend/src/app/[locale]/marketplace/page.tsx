'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { ContentLoader } from '@/components/ui/ContentLoader';
import { ShoppingBag, Search, Filter, Pencil, Trash2, Tag, Tractor, Sprout, Wheat, ShoppingCart, RefreshCw } from 'lucide-react';
import { CreateListingModal } from '@/components/marketplace/CreateListingModal';
import { EditListingModal } from '@/components/marketplace/EditListingModal';

/* Types */
type ViewMode = 'market' | 'store'; // Market = P2P, Store = Commercial (B2B)
type ListingType = 'SELL' | 'BUY' | 'RENT' | 'ALL';

export default function MarketplacePage() {
    const t = useTranslations('Marketplace');
    /* State: View & Data */
    const [viewMode, setViewMode] = useState<ViewMode>('market');
    const [listings, setListings] = useState<any[]>([]);
    const [commercialProducts, setCommercialProducts] = useState<any[]>([]);

    /* State: Filters */
    const [activeTab, setActiveTab] = useState<'browse' | 'my-listings'>('browse');
    const [listingType, setListingType] = useState<ListingType>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');

    /* State: Modals */
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingListing, setEditingListing] = useState<any>(null);

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
            .then((data: any) => setListings(data))
            .catch(err => console.error("Failed to fetch listings", err))
            .finally(() => setLoading(false));
    }, [listingType, categoryFilter, searchQuery]);

    const fetchCommercialProducts = useCallback(() => {
        setLoading(true);
        const filters: any = {};
        if (categoryFilter) filters.category = categoryFilter;

        // Map common terms to backend categories if needed, or rely on UI
        api.marketplace.commercial.list(filters)
            .then((data: any) => setCommercialProducts(data))
            .catch(err => console.error("Failed to fetch commercial products", err))
            .finally(() => setLoading(false));
    }, [categoryFilter]);

    useEffect(() => {
        if (viewMode === 'market') {
            fetchListings();
        } else {
            fetchCommercialProducts();
        }
    }, [viewMode, fetchListings, fetchCommercialProducts]);

    /* Accessors */
    const displayedListings = activeTab === 'browse'
        ? listings
        : listings.filter(l => l.seller_id === myUserId);

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

    const handleBuy = async (item: any) => {
        if (!confirm(t('confirm_order', { product: item.product_name, price: `₹${item.price}` }))) return;
        try {
            await api.marketplace.orders.create({
                listing_id: item.id,
                quantity: 1 // Default 1 unit for now
            });
            alert(t('success_order'));
        } catch (error) {
            console.error("Order failed", error);
            alert(t('error_order'));
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                        {t('title')}
                    </h1>
                    <p className="text-slate-400">
                        {viewMode === 'market'
                            ? t('subtitle_market')
                            : t('subtitle_store')}
                    </p>
                </div>

                {/* View Switcher */}
                <div className="bg-slate-900 border border-white/10 p-1 rounded-lg flex gap-1">
                    <button
                        onClick={() => setViewMode('market')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'market' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t('view_market')}
                    </button>
                    <button
                        onClick={() => setViewMode('store')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'store' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t('view_store')}
                    </button>
                </div>
            </div>

            {/* --- MARKET MODE --- */}
            {viewMode === 'market' && (
                <>
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">

                        {/* Tabs (Browse / Mine) */}
                        <div className="flex gap-4 border-b md:border-b-0 border-white/10 w-full md:w-auto pb-2 md:pb-0 items-center">
                            <button onClick={() => setActiveTab('browse')} className={`text-sm font-medium transition-colors ${activeTab === 'browse' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}>
                                {t('tab_browse')}
                            </button>
                            <button onClick={() => setActiveTab('my-listings')} className={`text-sm font-medium transition-colors ${activeTab === 'my-listings' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}>
                                {t('tab_my_listings')}
                            </button>
                            <div className="h-4 w-px bg-white/10 mx-2 hidden md:block"></div>
                            <button
                                onClick={() => fetchListings(true)}
                                className="text-slate-400 hover:text-white transition-colors p-1"
                                title={t('refresh_tooltip')}
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder={t('search_placeholder')}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="bg-slate-950 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm w-40 focus:w-60 transition-all focus:outline-none focus:border-emerald-500/50"
                                />
                            </div>

                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            >
                                <option value="">{t('filter_category_all')}</option>
                                <option value="Crop Grown">{t('cat_crops')}</option>
                                <option value="Fruit">{t('cat_fruits')}</option>
                                <option value="Vegetable">{t('cat_veg')}</option>
                                <option value="Livestock">{t('cat_livestock')}</option>
                                <option value="Meat">{t('cat_meat')}</option>
                                <option value="Dairy">{t('cat_dairy')}</option>
                                <option value="Machinery">{t('cat_machinery')}</option>
                            </select>

                            <select
                                value={listingType}
                                onChange={e => setListingType(e.target.value as ListingType)}
                                className="bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                            >
                                <option value="ALL">{t('filter_type_all')}</option>
                                <option value="SELL">{t('type_sell')}</option>
                                <option value="BUY">{t('type_buy')}</option>
                                <option value="RENT">{t('type_rent')}</option>
                            </select>
                        </div>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            {t('btn_post_ad')}
                        </button>
                    </div>

                    {/* Listings Grid */}
                    <ContentLoader loading={loading} text={t('loading_listings')}>
                        {displayedListings.length === 0 ? (
                            <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-xl border border-white/5 border-dashed">
                                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-lg">{t('no_listings_title')}</p>
                                <p className="text-sm">{t('no_listings_desc')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {displayedListings.map((item, i) => (
                                    <Card key={i} className="group overflow-hidden border-white/5 bg-slate-900/40 hover:bg-slate-900/80 transition-all hover:-translate-y-1 hover:border-emerald-500/30">
                                        {/* Image Area */}
                                        <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden">
                                            {item.image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">📦</div>
                                            )}

                                            {/* Badge: Type */}
                                            <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-sm
                                                ${item.listing_type === 'SELL' ? 'bg-emerald-600' :
                                                    item.listing_type === 'BUY' ? 'bg-blue-600' : 'bg-orange-600'}`}>
                                                {item.listing_type}
                                            </div>

                                            {/* Edit Controls */}
                                            {activeTab === 'my-listings' && (
                                                <div className="absolute top-2 right-2 flex gap-1 transform translate-x-10 group-hover:translate-x-0 transition-transform">
                                                    <button onClick={() => setEditingListing(item)} className="bg-slate-900/90 p-1.5 rounded-md text-blue-400 hover:text-white hover:bg-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="bg-slate-900/90 p-1.5 rounded-md text-red-400 hover:text-white hover:bg-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
                                                        <Tag className="w-3 h-3" /> {item.category}
                                                    </span>
                                                    <h3 className="font-bold text-lg text-white leading-tight mt-0.5">{item.product_name}</h3>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-400 line-clamp-2 min-h-[2.5em]">{item.description || t('no_description')}</p>

                                            <div className="pt-3 mt-2 border-t border-white/5 flex justify-between items-end">
                                                <div>
                                                    <p className="text-emerald-400 font-bold text-lg">₹{item.price}</p>
                                                    <p className="text-[10px] text-slate-500">per {item.price_unit.replace('per_', '')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400">{t('available', { qty: item.quantity, unit: item.unit })}</p>
                                                    {item.seller_id !== myUserId && (
                                                        <button
                                                            onClick={() => handleBuy(item)}
                                                            className="mt-1 bg-white/5 hover:bg-emerald-600 text-slate-300 hover:text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1"
                                                        >
                                                            {t('btn_details')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ContentLoader>
                </>
            )}

            {/* --- STORE MODE (Commercial) --- */}
            {viewMode === 'store' && (
                <>
                    {/* Store Toolbar */}
                    <div className="flex gap-4 items-center mb-6 overflow-x-auto pb-2">
                        <button
                            onClick={() => setCategoryFilter('')}
                            className={`px-4 py-2 rounded-full border border-white/10 text-sm whitespace-nowrap transition-colors ${!categoryFilter ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                        >
                            {t('store_cat_all')}
                        </button>
                        <button
                            onClick={() => setCategoryFilter('Seeds')}
                            className={`px-4 py-2 rounded-full border border-white/10 text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${categoryFilter === 'Seeds' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                        >
                            <Sprout className="w-4 h-4" /> {t('store_cat_seeds')}
                        </button>
                        <button
                            onClick={() => setCategoryFilter('Pesticides')}
                            className={`px-4 py-2 rounded-full border border-white/10 text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${categoryFilter === 'Pesticides' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                        >
                            <Tag className="w-4 h-4" /> {t('store_cat_pesticides')}
                        </button>
                        <button
                            onClick={() => setCategoryFilter('Fertilizers')}
                            className={`px-4 py-2 rounded-full border border-white/10 text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${categoryFilter === 'Fertilizers' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                        >
                            <Wheat className="w-4 h-4" /> {t('store_cat_fertilizers')}
                        </button>
                    </div>

                    <ContentLoader loading={loading} text={t('loading_store')}>
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
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-white/10">
                                                {prod.active_ingredient_name}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-4 h-[2.5em]">{prod.description}</p>

                                        <div className="flex items-center justify-between">
                                            <div className="text-xl font-bold text-white">₹{prod.unit_price}</div>
                                            <button className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors">
                                                <ShoppingCart className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </ContentLoader>
                </>
            )}

            {/* Create Modal */}
            <CreateListingModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchListings}
            />

            {/* Edit Modal */}
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
