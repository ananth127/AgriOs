import React, { useState } from 'react';
import { X, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from '@/navigation';

interface SellLivestockModalProps {
    isOpen: boolean;
    onClose: () => void;
    animal: any;
}

export const SellLivestockModal: React.FC<SellLivestockModalProps> = ({ isOpen, onClose, animal }) => {
    const router = useRouter();
    const [price, setPrice] = useState('');
    const [availabilityType, setAvailabilityType] = useState('immediate'); // immediate, scheduled
    const [availableFrom, setAvailableFrom] = useState('');
    const [availableTo, setAvailableTo] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !animal) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                // Must match ProductListingCreate schema
                listing_type: "SELL",
                product_name: animal.name || `Livestock-${animal.tag_id}`,
                category: 'Livestock',
                description: `Breed: ${animal.breed}, Age: ${animal.age || 'N/A'}, Weight: ${animal.weight_kg}kg, Tag: ${animal.tag_id}`,
                price: parseFloat(price),
                price_unit: 'INR', // Default currency
                quantity: 1,
                unit: 'Unit',
                available_date: availableFrom || new Date().toISOString().split('T')[0], // Default to today if immediate
                // Optional fields
                image_url: null,
                latitude: null,
                longitude: null
            };

            // Assuming a generic product create endpoint or specific marketplace endpoint
            await api.marketplace.products.create(payload);

            // Redirect to Track & Trace (Sell Tab) as requested
            onClose();
            router.push('/supply-chain?tab=sell'); // We will implement query param handling in SupplyChainPage later

        } catch (error) {
            console.error("Failed to list for sale", error);
            alert("Failed to create listing. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-slate-950/50">
                    <h2 className="text-xl font-bold text-white">Sell {animal.name || 'Animal'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Animal Summary */}
                    <div className="flex items-center gap-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">
                            {animal.species === 'Cow' ? '🐮' : '🐾'}
                        </div>
                        <div>
                            <p className="font-bold text-blue-100">{animal.tag_id}</p>
                            <p className="text-xs text-blue-300">{animal.breed} • {animal.weight_kg}kg</p>
                        </div>
                    </div>

                    {/* Price Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Expected Denomination (Price)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                            <input
                                type="number"
                                required
                                min="0"
                                placeholder="0.00"
                                className="w-full bg-slate-950 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="space-y-4">
                        <label className="text-sm font-medium text-slate-400">Availability</label>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setAvailabilityType('immediate')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${availabilityType === 'immediate' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-white/5 text-slate-500 hover:bg-slate-900'}`}
                            >
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Immediate</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAvailabilityType('scheduled')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${availabilityType === 'scheduled' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-950 border-white/5 text-slate-500 hover:bg-slate-900'}`}
                            >
                                <Calendar className="w-5 h-5" />
                                <span className="text-sm font-medium">Scheduled</span>
                            </button>
                        </div>

                        {availabilityType === 'scheduled' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Available From</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        value={availableFrom}
                                        onChange={(e) => setAvailableFrom(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">Available To</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                        value={availableTo}
                                        onChange={(e) => setAvailableTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : 'List for Sale'}
                    </button>
                </form>
            </div>
        </div>
    );
};
