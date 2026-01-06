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
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Product Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.product_name}
                        onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Quantity</label>
                        <input
                            type="number"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Unit</label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Price</label>
                        <input
                            type="number"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Per Unit</label>
                        <p className="p-2 text-slate-400">/{formData.unit}</p>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
            </form>
        </Modal>
    );
};
