import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface EditProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    item: any;
}

export const EditInventoryModal: React.FC<EditProps> = ({ isOpen, onClose, onSuccess, item }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        item_type: '',
        name: '',
        quantity: '',
        unit: '',
        cost_per_unit: '',
    });

    useEffect(() => {
        if (item) {
            setFormData({
                item_type: item.item_type,
                name: item.name,
                quantity: item.quantity.toString(),
                unit: item.unit,
                cost_per_unit: item.cost_per_unit.toString(),
            });
        }
    }, [item]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.farmManagement.updateInventory(item.id, {
                ...formData,
                quantity: parseFloat(formData.quantity),
                cost_per_unit: parseFloat(formData.cost_per_unit),
                purchase_date: item.purchase_date // Keep original date
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update inventory", error);
            alert("Failed to update inventory");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Inventory">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                    <select
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.item_type}
                        onChange={e => setFormData({ ...formData, item_type: e.target.value })}
                    >
                        <option value="Fertilizer">Fertilizer</option>
                        <option value="Pesticide">Pesticide</option>
                        <option value="Seed">Seeds</option>
                        <option value="Fuel">Fuel</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Item Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Quantity</label>
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
                        <label className="block text-sm font-medium text-slate-400 mb-1">Unit</label>
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
                    <label className="block text-sm font-medium text-slate-400 mb-1">Cost per Unit (₹)</label>
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
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
            </form>
        </Modal>
    );
};
