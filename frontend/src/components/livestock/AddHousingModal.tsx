import React, { useState } from 'react';
import { api } from '@/lib/api';
import { X, Home, Save, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AddHousingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    farmId: number;
}

export const AddHousingModal: React.FC<AddHousingModalProps> = ({ isOpen, onClose, onSuccess, farmId }) => {
    const t = useTranslations('Livestock');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Barn',
        capacity: 10,
        auto_cleaning_enabled: false
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.livestock.createHousing({
                ...formData,
                farm_id: farmId
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create housing", error);
            alert(t('failed_create_shelter'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-400" />
                        {t('add_new_shelter_modal')}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('structure_name')}</label>
                        <input
                            type="text"
                            required
                            placeholder={t('structure_name_placeholder')}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{t('type')}</label>
                            <select
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="Barn">{t('barn')}</option>
                                <option value="Stable">{t('stable')}</option>
                                <option value="Coop">{t('coop')}</option>
                                <option value="Pasture">Pasture</option>
                                <option value="Aquarium">Aquarium</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">{t('capacity')}</label>
                            <input
                                type="number"
                                min="1"
                                required
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                value={formData.capacity}
                                onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-white text-sm">Auto-Cleaning Agent</p>
                            <p className="text-xs text-slate-400">Connect to IoT cleaning systems</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, auto_cleaning_enabled: !prev.auto_cleaning_enabled }))}
                            className={`w-12 h-6 rounded-full relative transition-colors ${formData.auto_cleaning_enabled ? 'bg-green-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.auto_cleaning_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-400 hover:bg-white/5 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? t('creating') : <><Save className="w-4 h-4" /> {t('create_shelter')}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
