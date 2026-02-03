import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EditProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    animal: any;
    housingList: any[];
}

export const EditAnimalModal: React.FC<EditProps> = ({ isOpen, onClose, onSuccess, animal, housingList = [] }) => {
    const t = useTranslations('Livestock');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        weight_kg: '',
        health_status: '',
        last_vaccination_date: '',
        housing_id: ''
    });

    useEffect(() => {
        if (animal) {
            setFormData({
                weight_kg: animal.weight_kg.toString(),
                health_status: animal.health_status,
                last_vaccination_date: animal.last_vaccination_date || '',
                housing_id: animal.housing_id ? animal.housing_id.toString() : ''
            });
        }
    }, [animal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.livestock.update(animal.id, {
                ...formData,
                weight_kg: parseFloat(formData.weight_kg),
                housing_id: formData.housing_id ? Number(formData.housing_id) : null
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update animal", error);
            alert(t('failed_update_animal'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('edit_animal_title', { tag: animal?.tag_id || t('animal') })}>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Housing Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('assigned_shelter')}</label>
                    <select
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.housing_id}
                        onChange={e => setFormData({ ...formData, housing_id: e.target.value })}
                    >
                        <option value="">-- No Shelter / Grazing --</option>
                        {housingList.map(h => (
                            <option key={h.id} value={h.id}>{h.name} ({h.type})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('health_status')}</label>
                    <select
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.health_status}
                        onChange={e => setFormData({ ...formData, health_status: e.target.value })}
                    >
                        <option value="Healthy">{t('healthy')}</option>
                        <option value="Sick">{t('sick')}</option>
                        <option value="Injured">{t('injured')}</option>
                        <option value="Critical">{t('critical')}</option>
                        <option value="Pregnant">{t('pregnant')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('weight_kg')}</label>
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
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('last_vaccination')}</label>
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
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save_changes')}
                </button>
            </form>
        </Modal>
    );
};
