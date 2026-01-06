import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface CreateProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    farmId: number;
}

export const AddAssetModal: React.FC<CreateProps> = ({ isOpen, onClose, onSuccess, farmId }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        asset_type: 'Tractor',
        purchase_date: new Date().toISOString().split('T')[0],
        cost: '',
        is_iot_enabled: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.farmManagement.addAsset({
                farm_id: farmId,
                name: formData.name,
                asset_type: formData.asset_type,
                purchase_date: formData.purchase_date,
                cost: parseFloat(formData.cost),
                is_iot_enabled: formData.is_iot_enabled
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to add asset", error);
            alert("Failed to add asset");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Asset">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Asset Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder="e.g. John Deere 5310, Kirloskar Pump"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                    <select
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.asset_type}
                        onChange={e => setFormData({ ...formData, asset_type: e.target.value })}
                    >
                        <option value="Tractor">Tractor</option>
                        <option value="Pump">Irrigation Pump</option>
                        <option value="DripSystem">Drip System</option>
                        <option value="Harvester">Harvester</option>
                        <option value="Sprayer">Sprayer</option>
                        <option value="IoT Device">IoT Sensor/Controller</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Purchase Date</label>
                        <input
                            type="date"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.purchase_date}
                            onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Cost (₹)</label>
                        <input
                            type="number"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.cost}
                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="iot_check"
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={formData.is_iot_enabled}
                        onChange={e => setFormData({ ...formData, is_iot_enabled: e.target.checked })}
                    />
                    <label htmlFor="iot_check" className="text-sm font-medium text-slate-300">This is an IoT Enabled Device</label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Asset'}
                </button>
            </form>
        </Modal>
    );
};
