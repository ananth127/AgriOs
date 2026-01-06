import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface EditProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    asset: any;
}

export const EditAssetModal: React.FC<EditProps> = ({ isOpen, onClose, onSuccess, asset }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        asset_type: '',
        cost: '',
        is_iot_enabled: false
    });

    useEffect(() => {
        if (asset) {
            setFormData({
                name: asset.name,
                asset_type: asset.asset_type,
                cost: asset.cost.toString(),
                is_iot_enabled: asset.is_iot_enabled
            });
        }
    }, [asset]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.farmManagement.updateAsset(asset.id, {
                ...formData,
                cost: parseFloat(formData.cost),
                purchase_date: asset.purchase_date // Keep original
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update asset", error);
            alert("Failed to update asset");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Asset">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Asset Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
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

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="iot_check_edit"
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={formData.is_iot_enabled}
                        onChange={e => setFormData({ ...formData, is_iot_enabled: e.target.checked })}
                    />
                    <label htmlFor="iot_check_edit" className="text-sm font-medium text-slate-300">IoT Enabled</label>
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
