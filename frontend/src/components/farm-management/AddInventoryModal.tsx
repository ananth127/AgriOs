import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CreateProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    farmId: number;
}

export const AddInventoryModal: React.FC<CreateProps> = ({ isOpen, onClose, onSuccess, farmId }) => {
    const t = useTranslations('FarmManagement');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        item_type: 'Fertilizer',
        name: '',
        quantity: '',
        unit: 'kg',
        cost_per_unit: '',
        purchase_date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.farmManagement.addInventory({
                farm_id: farmId,
                item_type: formData.item_type,
                name: formData.name,
                quantity: parseFloat(formData.quantity),
                unit: formData.unit,
                cost_per_unit: parseFloat(formData.cost_per_unit),
                purchase_date: formData.purchase_date
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to add inventory", error);
            alert(t('error_add_inventory'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('modal_add_inventory_title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_type')}</label>
                    <select
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.item_type}
                        onChange={e => setFormData({ ...formData, item_type: e.target.value })}
                    >
                        <option value="Fertilizer">{t('type_fertilizer')}</option>
                        <option value="Pesticide">{t('type_pesticide')}</option>
                        <option value="Seed">{t('type_seeds')}</option>
                        <option value="Fuel">{t('type_fuel')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_item_name')}</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder={t('ph_item_name')}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_quantity')}</label>
                        <input
                            type="number"
                            required
                            step="0.1"
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
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_cost_per_unit_rs')}</label>
                    <input
                        type="number"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.cost_per_unit}
                        onChange={e => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('btn_add_stock')}
                </button>
            </form>
        </Modal>
    );
};
