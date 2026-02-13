import React, { useState } from 'react';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RegisterAnimalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    farmId: number;
}

export const RegisterAnimalModal: React.FC<RegisterAnimalProps> = ({ isOpen, onClose, onSuccess, farmId }) => {
    const t = useTranslations('Livestock');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        tag_id: '',
        species: 'Cow',
        breed: '',
        gender: 'Female',
        purpose: 'Dairy',
        origin: 'BORN',
        source_details: '',
        birth_date: new Date().toISOString().split('T')[0],
        weight_kg: '',
        health_status: 'Healthy',
        last_vaccination_date: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.livestock.register({
                farm_id: farmId,
                name: formData.name,
                tag_id: formData.tag_id, // Optional, backend will generate if empty
                species: formData.species,
                breed: formData.breed || 'Unknown',
                gender: formData.gender,
                purpose: formData.purpose,
                origin: formData.origin,
                source_details: formData.origin === 'PURCHASED' ? formData.source_details : null,
                birth_date: formData.birth_date,
                weight_kg: parseFloat(formData.weight_kg) || 0,
                health_status: formData.health_status,
                last_vaccination_date: formData.last_vaccination_date || null
            });
            onSuccess();
            trackEvent("Livestock", "Register Animal", formData.species);
            onClose();
        } catch (error) {
            console.error("Failed to register animal", error);
            alert(t('failed_register_animal'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('register_animal_title', { species: formData.species })}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('species_label')}</label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.species}
                            onChange={e => setFormData({ ...formData, species: e.target.value })}
                        >
                            <option value="Cow">{t('cow')}</option>
                            <option value="Buffalo">{t('buffalo')}</option>
                            <option value="Goat">{t('goat')}</option>
                            <option value="Sheep">{t('sheep')}</option>
                            <option value="Poultry">{t('poultry')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('name_optional')}</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder={t('name_placeholder')}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('tag_id_auto')}</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder={t('auto_generated')}
                            value={formData.tag_id}
                            onChange={e => setFormData({ ...formData, tag_id: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('breed')}</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder={t('breed_placeholder')}
                            value={formData.breed}
                            onChange={e => setFormData({ ...formData, breed: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('gender')}</label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.gender}
                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <option value="Female">{t('female')}</option>
                            <option value="Male">{t('male')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('purpose_label')}</label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.purpose}
                            onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                        >
                            <option value="Dairy">{t('dairy_milk')}</option>
                            <option value="Meat">{t('meat')}</option>
                            <option value="Breeding">{t('breeding')}</option>
                            <option value="Work">{t('farm_work')}</option>
                            <option value="Sale">{t('for_sale')}</option>
                        </select>
                    </div>
                </div>

                {/* Origin Section */}
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <label className="block text-sm font-medium text-slate-300 mb-2">{t('origin_label')}</label>
                    <div className="flex bg-slate-900 rounded-lg p-1 mb-3">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, origin: 'BORN' })}
                            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${formData.origin === 'BORN' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t('born_on_farm')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, origin: 'PURCHASED' })}
                            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${formData.origin === 'PURCHASED' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {t('purchased_from')}
                        </button>
                    </div>

                    {formData.origin === 'PURCHASED' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">{t('seller_details')}</label>
                            <textarea
                                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white text-sm"
                                placeholder={t('seller_placeholder')}
                                value={formData.source_details}
                                onChange={e => setFormData({ ...formData, source_details: e.target.value })}
                                rows={2}
                            />
                        </div>
                    )}
                    {formData.origin === 'BORN' && (
                        <div className="text-xs text-slate-400 italic">
                            * You can link parent details later from the animal profile.
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('date_of_birth')}</label>
                        <input
                            type="date"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.birth_date}
                            onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('weight_kg')}</label>
                        <input
                            type="number"
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.weight_kg}
                            onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('register_animal_button')}
                </button>
            </form>
        </Modal>
    );
};
