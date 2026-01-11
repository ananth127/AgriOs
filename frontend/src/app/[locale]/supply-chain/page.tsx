'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Search, Truck, Package, CheckCircle, Clock } from 'lucide-react';
import { CreateBatchModal } from '@/components/supply-chain/CreateBatchModal';

export default function SupplyChainPage() {
    const [batchId, setBatchId] = useState('');
    const [batchData, setBatchData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recentBatches, setRecentBatches] = useState<any[]>([]);

    // Load recent batches on mount
    useEffect(() => {
        let mounted = true;
        const loadRecent = async () => {
            try {
                const data = await api.supplyChain.getAllBatches();
                if (mounted && Array.isArray(data)) setRecentBatches(data);
            } catch (e) {
                console.error("Failed to load batches", e);
            }
        };
        loadRecent();
        return () => { mounted = false; };
    }, []);

    const handleTrack = async (searchId?: string) => {
        const idToSearch = searchId || batchId;
        if (!idToSearch) return;
        setLoading(true);
        setError('');
        setBatchData(null);
        try {
            const data = await api.supplyChain.getBatch(idToSearch);
            setBatchData(data);
            setBatchId(idToSearch); // Update input if tracked from tracking modal success
        } catch (err) {
            setError('Batch not found or invalid ID');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">Supply Chain</h1>
                    <p className="text-slate-400">Track your produce from farm to fork with immutable transparency.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white"
                >
                    + Create Batch
                </button>
            </header>

            {/* Search Box */}
            <div className="max-w-xl">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Enter Batch ID (e.g., 202401-WHT)"
                        className="w-full bg-slate-900 border border-white/10 rounded-lg pl-4 pr-12 py-4 shadow-xl focus:outline-none focus:border-teal-500 transition-colors"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                    />
                    <button
                        onClick={() => handleTrack()}
                        className="absolute right-2 top-2 bottom-2 bg-teal-600 hover:bg-teal-500 rounded-md px-4 font-bold transition-colors"
                    >
                        Track
                    </button>
                </div>
                {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
            </div>

            {/* Single Track Result */}
            {batchData ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center">
                        <button onClick={() => { setBatchData(null); setBatchId(''); }} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                            ← Back to Dashboard
                        </button>
                    </div>

                    {/* Header Info */}
                    <Card className="border-t-4 border-t-teal-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold">{batchData.batch_number || `Batch #${batchData.id}`}</h2>
                                <p className="text-slate-400">Product: {batchData.product_name}</p>
                            </div>
                            <div className="text-right">
                                <span className="bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-sm font-bold uppercase">
                                    {batchData.status || 'Created'}
                                </span>
                                <p className="text-xs text-slate-500 mt-1">Qty: {batchData.quantity} {batchData.unit}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Timeline */}
                    <div className="relative border-l-2 border-white/10 ml-4 space-y-12 pb-4">
                        {/* Current/Latest Status */}
                        <div className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5 hover:border-teal-500/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-teal-400" />
                                    <span className="text-sm text-slate-400">Current Location</span>
                                </div>
                                <h3 className="font-bold text-lg mb-1">{batchData.current_location || 'Unknown'}</h3>
                                <p className="text-slate-400">Status: {batchData.status}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Dashboard / recent List */
                <div className="space-y-4 animate-in fade-in duration-500">
                    <h2 className="text-xl font-bold text-white">Recent Batches</h2>

                    {recentBatches.length === 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 mt-8">
                            {/* Empty State Placeholders */}
                            <div className="bg-slate-900 p-6 rounded-xl border border-white/5">
                                <Package className="w-8 h-8 mb-4 text-purple-400" />
                                <h3 className="font-bold">Harvest</h3>
                                <p className="text-sm text-slate-500 mt-2">Logged at source with geolocation.</p>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-xl border border-white/5">
                                <div className="text-center py-12">
                                    <p className="text-slate-400 mb-4">No batches found.</p>
                                    <p className="text-sm text-slate-500">Generate a &quot;New Batch&quot; to start tracing.</p>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-xl border border-white/5">
                                <CheckCircle className="w-8 h-8 mb-4 text-green-400" />
                                <h3 className="font-bold">Retail</h3>
                                <p className="text-sm text-slate-500 mt-2">Customer scans QR to verify.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentBatches.map((batch) => (
                                <div
                                    key={batch.id}
                                    onClick={() => handleTrack(batch.id)}
                                    className="bg-slate-900/50 border border-white/5 hover:border-teal-500/50 p-4 rounded-xl cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="bg-teal-500/10 text-teal-400 p-2 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-mono text-slate-500">#{batch.id}</span>
                                    </div>
                                    <h3 className="font-bold text-lg text-white mb-1">{batch.product_name}</h3>
                                    <p className="text-sm text-slate-400 mb-4">{batch.quantity} {batch.unit}</p>

                                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-white/5">
                                        <Truck className="w-3 h-3" />
                                        {batch.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <CreateBatchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={(id) => {
                    // Refresh recent list
                    api.supplyChain.getAllBatches().then(res => {
                        if (Array.isArray(res)) setRecentBatches(res);
                    });
                    // Optional: auto track new batch
                    // handleTrack(id);
                }}
            />
        </div>
    );
}
