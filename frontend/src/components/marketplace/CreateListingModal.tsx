import React, { useState } from 'react';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface CreateListingProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateListingModal: React.FC<CreateListingProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        listing_type: 'SELL',
        product_name: '',
        category: 'Crop Grown',
        quantity: '',
        unit: 'kg',
        price: '',
        price_unit: 'total', // or per_kg
        availability_date: new Date().toISOString().split('T')[0],
        description: '',
        image_url: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.marketplace.products.create({
                ...formData,
                quantity: parseFloat(formData.quantity),
                price: parseFloat(formData.price),
                price_unit: `per_${formData.unit}`, // Simple helper
            });
            onSuccess();
            trackEvent("Marketplace", "Create Listing", formData.product_name);
            onClose();
        } catch (error) {
            console.error("Failed to create listing", error);
            alert("Failed to create listing");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Post a Listing">
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Type Selection */}
                <div className="flex gap-4 p-1 bg-slate-900 rounded-lg">
                    {['SELL', 'BUY', 'RENT'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({ ...formData, listing_type: type })}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${formData.listing_type === type ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            {type === 'SELL' ? 'Sell Item' : type === 'BUY' ? 'Want to Buy' : 'Rent Out'}
                        </button>
                    ))}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Product Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder="e.g. Wheat, Tractor..."
                            value={formData.product_name}
                            onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Crop Grown">Crop / Produce</option>
                            <option value="Fruit">Fruit</option>
                            <option value="Vegetable">Vegetable</option>
                            <option value="Livestock">Livestock (Adult)</option>
                            <option value="Livestock (Young)">Livestock (Young)</option>
                            <option value="Meat">Meat / Poultry</option>
                            <option value="Dairy">Dairy Products</option>
                            <option value="Seeds">Seeds</option>
                            <option value="Machinery">Machinery & Tools</option>
                            <option value="Pesticides">Pesticides (Resale)</option>
                            <option value="Fertilizers">Fertilizers (Resale)</option>
                        </select>
                    </div>
                </div>

                {/* Specs */}
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
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder="kg, tons, units..."
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        />
                    </div>
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Price per unit (₹)</label>
                    <input
                        type="number"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                    />
                </div>

                {/* Details */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                    <textarea
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white h-20"
                        placeholder="Describe condition, quality, location..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Image URL (Optional)</label>
                    <input
                        type="text"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder="https://..."
                        value={formData.image_url}
                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Listing'}
                </button>
            </form>
        </Modal>
    );
};
