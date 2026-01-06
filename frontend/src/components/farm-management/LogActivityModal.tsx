import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface LogActivityProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    farmId: number;
    cropCycleId?: number; // Optional linking to specific crop
}

export const LogActivityModal: React.FC<LogActivityProps> = ({ isOpen, onClose, onSuccess, farmId, cropCycleId }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        activity_type: 'Usage',
        description: '',
        date: new Date().toISOString().split('T')[0],
        cost: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.farmManagement.logActivity({
                farm_id: farmId,
                crop_cycle_id: cropCycleId,
                activity_type: formData.activity_type,
                description: formData.description,
                activity_date: new Date(formData.date).toISOString(),
                cost: parseFloat(formData.cost) || 0
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to log activity", error);
            alert("Failed to log activity");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Log Farm Activity">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Activity Type</label>
                    <select
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.activity_type}
                        onChange={e => setFormData({ ...formData, activity_type: e.target.value })}
                    >
                        <option value="Irrigation">Irrigation</option>
                        <option value="Fertilizer">Fertilizer Application</option>
                        <option value="Pesticide">Pesticide Application</option>
                        <option value="Harvesting">Harvesting</option>
                        <option value="Usage">General/Labor Usage</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                    <textarea
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white h-24"
                        placeholder="Details about the activity..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                        <input
                            type="date"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Cost (₹)</label>
                        <input
                            type="number"
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder="Optional"
                            value={formData.cost}
                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Activity'}
                </button>
            </form>
        </Modal>
    );
};
