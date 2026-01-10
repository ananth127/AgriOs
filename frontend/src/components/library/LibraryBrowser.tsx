'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Loader2, Bug, ShoppingCart, ExternalLink, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';

interface Chemical {
    name: string;
    description: string;
}

interface Pest {
    id: number;
    name: string;
    symptoms: string;
    chemicals: Chemical[];
}

interface CommercialProduct {
    id: number;
    brand_name: string;
    manufacturer: string;
    active_ingredient_name: string;
    unit_price: number;
    image_url: string;
}

export default function LibraryBrowser() {
    const t = useTranslations('Library');
    const [pests, setPests] = useState<Pest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Product Modal State
    const [selectedChemical, setSelectedChemical] = useState<string | null>(null);
    const [products, setProducts] = useState<CommercialProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        const fetchPests = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/library/pests?search=${search}`);
                if (res.ok) {
                    const data = await res.json();
                    setPests(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchPests, 500);
        return () => clearTimeout(debounce);
    }, [search]);

    const handleChemicalClick = async (chemName: string) => {
        setSelectedChemical(chemName);
        setLoadingProducts(true);
        setProducts([]);
        try {
            // strip dosage info if present locally for search e.g. "Mancozeb 75%" -> "Mancozeb"
            const queryName = chemName.split(' ')[0];
            const res = await fetch(`${API_BASE_URL}/marketplace/commercial-products?ingredient=${queryName}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingProducts(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-green-500/50"
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pests.map((pest) => (
                        <div key={pest.id} className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden hover:border-green-500/30 transition-all group flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-red-500/10 text-red-400 rounded-lg group-hover:bg-red-500/20 transition-colors">
                                        <Bug className="w-6 h-6" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{pest.name}</h3>
                                <p className="text-slate-400 text-sm line-clamp-3 mb-4">{pest.symptoms}</p>

                                <div className="space-y-3">
                                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('treatments')}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {pest.chemicals.map((chem, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleChemicalClick(chem.name)}
                                                className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-md border border-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/30 transition-colors flex items-center gap-1"
                                            >
                                                {chem.name}
                                                <ShoppingCart className="w-3 h-3" />
                                            </button>
                                        ))}
                                        {pest.chemicals.length === 0 && (
                                            <span className="text-slate-600 text-xs italic">No data</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {pests.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-500">
                            No diseases found matching "{search}"
                        </div>
                    )}
                </div>
            )}

            {/* Product Sheet / Modal */}
            {selectedChemical && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                        onClick={() => setSelectedChemical(null)}
                    />
                    <div className="bg-slate-900 border border-white/10 w-full max-w-lg sm:rounded-2xl rounded-t-2xl p-6 relative pointer-events-auto shadow-2xl animate-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">Buy {selectedChemical}</h3>
                                <p className="text-slate-400 text-sm">Recommended products matching this ingredient</p>
                            </div>
                            <button onClick={() => setSelectedChemical(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {loadingProducts ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {products.length > 0 ? (
                                    products.map((product) => (
                                        <div key={product.id} className="flex gap-4 p-4 bg-slate-950/50 border border-white/5 rounded-xl hover:border-green-500/30 transition-colors">
                                            <div className="w-20 h-20 bg-white rounded-lg p-2 flex items-center justify-center">
                                                {/* Placeholder for real images */}
                                                <img src="/icons/icon-192x192.png" alt={product.brand_name} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-white text-lg">{product.brand_name}</h4>
                                                        <p className="text-sm text-slate-400">{product.manufacturer}</p>
                                                    </div>
                                                    <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-bold">
                                                        ₹{product.unit_price}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex justify-end">
                                                    <button className="text-sm bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                                                        Add to Cart <ExternalLink className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-500">
                                        No commercial products found for this chemical near you.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
