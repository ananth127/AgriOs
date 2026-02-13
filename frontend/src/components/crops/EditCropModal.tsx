import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface EditCropProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    crop: any;
}

export const EditCropModal: React.FC<EditCropProps> = ({ isOpen, onClose, onSuccess, crop }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        current_stage: '',
        harvest_date_estimated: '',
        health_score: ''
    });

    useEffect(() => {
        if (crop) {
            setFormData({
                current_stage: crop.current_stage || 'Germination',
                harvest_date_estimated: crop.harvest_date_estimated || '',
                health_score: crop.health_score ? crop.health_score.toString() : '100' // Default to 100 if missing
            });
        }
    }, [crop]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.crops.update(crop.id, {
                ...formData,
                health_score: parseFloat(formData.health_score)
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update crop cycle", error);
            alert("Failed to update crop status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Update Crop Status">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Current Stage</label>
                    <select
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.current_stage}
                        onChange={e => setFormData({ ...formData, current_stage: e.target.value })}
                    >
                        <option value="Sowing">Sowing</option>
                        <option value="Germination">Germination</option>
                        <option value="Vegetative">Vegetative Growth</option>
                        <option value="Flowering">Flowering</option>
                        <option value="Fruiting">Fruiting</option>
                        <option value="Maturation">Maturation</option>
                        <option value="HarvestReady">Harvest Ready</option>
                        <option value="Harvested">Harvested</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Est. Harvest Date</label>
                    <input
                        type="date"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.harvest_date_estimated}
                        onChange={e => setFormData({ ...formData, harvest_date_estimated: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Health Score (0-100)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.health_score}
                        onChange={e => setFormData({ ...formData, health_score: e.target.value })}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Autofilled by Drone/Satellite analysis if available.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Cycle'}
                </button>
            </form>
        </Modal>
    );
};
