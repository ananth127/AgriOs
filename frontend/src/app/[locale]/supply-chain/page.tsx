'use client';

import { useState } from 'react';
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

            {/* Results */}
            {batchData && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Header Info */}
                    <Card className="border-t-4 border-t-teal-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold">{batchData.batch_number}</h2>
                                <p className="text-slate-400">Origin: Sunny Acres (Nasik)</p>
                            </div>
                            <div className="text-right">
                                <span className="bg-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-sm font-bold uppercase">
                                    {batchData.events?.[batchData.events.length - 1]?.status || 'In Transit'}
                                </span>
                                <p className="text-xs text-slate-500 mt-1">Last Update: Just now</p>
                            </div>
                        </div>
                    </Card>

                    {/* Timeline */}
                    <div className="relative border-l-2 border-white/10 ml-4 space-y-12 pb-4">
                        {batchData.events?.map((event: any, i: number) => (
                            <div key={i} className="relative pl-8">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5 hover:border-teal-500/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-teal-400" />
                                        <span className="text-sm text-slate-400">{event.timestamp}</span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">{event.status}</h3>
                                    <p className="text-slate-400">{event.location}</p>
                                    {event.notes && <p className="text-sm text-slate-500 mt-2 italic">"{event.notes}"</p>}
                                </div>
                            </div>
                        ))}

                        {/* Placeholder Start */}
                        <div className="relative pl-8 opacity-50">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700"></div>
                            <div>
                                <h3 className="font-bold text-lg">Batch Created</h3>
                                <p className="text-slate-500">Farm: Sunny Acres</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Demo State if no data found yet (Empty State) */}
            {!batchData && !loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30">
                    <div className="bg-slate-900 p-6 rounded-xl border border-white/5">
                        <Package className="w-8 h-8 mb-4 text-purple-400" />
                        <h3 className="font-bold">Harvest</h3>
                        <p className="text-sm text-slate-500 mt-2">Logged at source with geolocation.</p>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-white/5">
                        <Truck className="w-8 h-8 mb-4 text-blue-400" />
                        <h3 className="font-bold">Transit</h3>
                        <p className="text-sm text-slate-500 mt-2">IoT verified temperature logs.</p>
                    </div>
                    <div className="bg-slate-900 p-6 rounded-xl border border-white/5">
                        <CheckCircle className="w-8 h-8 mb-4 text-green-400" />
                        <h3 className="font-bold">Retail</h3>
                        <p className="text-sm text-slate-500 mt-2">Customer scans QR to verify.</p>
                    </div>
                </div>
            )}

            <CreateBatchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={(id) => handleTrack(id)} // Auto track created batch
            />
        </div>
    );
}
