import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface EditProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    animal: any;
}

export const EditAnimalModal: React.FC<EditProps> = ({ isOpen, onClose, onSuccess, animal }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        weight_kg: '',
        health_status: '',
        last_vaccination_date: ''
    });

    useEffect(() => {
        if (animal) {
            setFormData({
                weight_kg: animal.weight_kg.toString(),
                health_status: animal.health_status,
                last_vaccination_date: animal.last_vaccination_date || ''
            });
        }
    }, [animal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.livestock.update(animal.id, {
                ...formData,
                weight_kg: parseFloat(formData.weight_kg)
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update animal", error);
            alert("Failed to update animal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${animal?.tag_id || 'Animal'}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Health Status</label>
                    <select
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.health_status}
                        onChange={e => setFormData({ ...formData, health_status: e.target.value })}
                    >
                        <option value="Healthy">Healthy</option>
                        <option value="Sick">Sick</option>
                        <option value="Injured">Injured</option>
                        <option value="Critical">Critical</option>
                        <option value="Pregnant">Pregnant</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Weight (kg)</label>
                    <input
                        type="number"
                        step="0.1"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.weight_kg}
                        onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Last Vaccination</label>
                    <input
                        type="date"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.last_vaccination_date}
                        onChange={e => setFormData({ ...formData, last_vaccination_date: e.target.value })}
                    />
                </div>

                <div className="p-3 bg-blue-500/10 rounded text-xs text-blue-300">
                    Update health metrics regularly for better AI insights.
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Record'}
                </button>
            </form>
        </Modal>
    );
};
