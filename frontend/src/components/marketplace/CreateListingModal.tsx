import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
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
    const t = useTranslations('Marketplace');
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
            alert(t('error_create'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('create_title')}>
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
                            {type === 'SELL' ? t('radio_sell') : type === 'BUY' ? t('radio_buy') : t('radio_rent')}
                        </button>
                    ))}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_name')}</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder={t('ph_name')}
                            value={formData.product_name}
                            onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_category')}</label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Crop Grown">{t('cat_crops')}</option>
                            <option value="Fruit">{t('cat_fruits')}</option>
                            <option value="Vegetable">{t('cat_veg')}</option>
                            <option value="Livestock">{t('cat_livestock')}</option>
                            <option value="Livestock (Young)">{t('cat_livestock')} (Young)</option>
                            <option value="Meat">{t('cat_meat')}</option>
                            <option value="Dairy">{t('cat_dairy')}</option>
                            <option value="Seeds">{t('store_cat_seeds')}</option>
                            <option value="Machinery">{t('cat_machinery')}</option>
                            <option value="Pesticides">{t('store_cat_pesticides')}</option>
                            <option value="Fertilizers">{t('store_cat_fertilizers')}</option>
                        </select>
                    </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_qty')}</label>
                        <input
                            type="number"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_unit')}</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder={t('ph_unit')}
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        />
                    </div>
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_price')}</label>
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
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_desc')}</label>
                    <textarea
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white h-20"
                        placeholder={t('ph_desc')}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_image')}</label>
                    <input
                        type="text"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder={t('ph_image')}
                        value={formData.image_url}
                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('btn_submit')}
                </button>
            </form>
        </Modal>
    );
};
