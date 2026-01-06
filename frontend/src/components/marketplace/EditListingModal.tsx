import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface EditListingProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    listing: any;
}

export const EditListingModal: React.FC<EditListingProps> = ({ isOpen, onClose, onSuccess, listing }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        product_name: '',
        category: '',
        quantity: '',
        unit: '',
        price: '',
        price_unit: '',
    });

    useEffect(() => {
        if (listing) {
            setFormData({
                product_name: listing.product_name,
                category: listing.category,
                quantity: listing.quantity.toString(),
                unit: listing.unit,
                price: listing.price.toString(),
                price_unit: listing.price_unit
            });
        }
    }, [listing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.marketplace.products.update(listing.id, {
                ...formData,
                quantity: parseFloat(formData.quantity),
                price: parseFloat(formData.price)
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update listing", error);
            alert("Failed to update listing");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Listing">
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Product Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all duration-200"
                        placeholder="e.g. Organic Tomatoes"
                        value={formData.product_name}
                        onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 ml-1">Quantity</label>
                        <input
                            type="number"
                            required
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all duration-200"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 ml-1">Unit</label>
                        <select
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all duration-200"
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        >
                            <option value="kg">kg</option>
                            <option value="ton">ton</option>
                            <option value="quintal">quintal</option>
                            <option value="pcs">pcs</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 ml-1">Price</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <input
                                type="number"
                                required
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/10 transition-all duration-200"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 ml-1">Per Unit</label>
                        <div className="w-full px-4 py-3 bg-slate-900/30 rounded-xl border border-white/5 text-slate-400">
                            /{formData.unit}
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full mt-3 text-slate-500 hover:text-slate-300 font-medium text-sm py-2 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};
