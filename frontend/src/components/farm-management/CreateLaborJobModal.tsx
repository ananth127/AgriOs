import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CreateJobProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateLaborJobModal: React.FC<CreateJobProps> = ({ isOpen, onClose, onSuccess }) => {
    const t = useTranslations('FarmManagement');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        required_count: '1',
        wage_per_day: '',
        start_date: new Date().toISOString().split('T')[0],
        duration_days: '1'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.farmManagement.postJob({
                title: formData.title,
                description: formData.description,
                required_count: parseInt(formData.required_count),
                wage_per_day: parseFloat(formData.wage_per_day),
                start_date: formData.start_date,
                duration_days: parseInt(formData.duration_days),
                provides_food: false,
                provides_travel: false
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to post job", error);
            alert(t('error_post_job'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('modal_post_job_title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_job_title')}</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder={t('ph_job_title')}
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_workers_needed')}</label>
                        <input
                            type="number"
                            required
                            min="1"
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.required_count}
                            onChange={e => setFormData({ ...formData, required_count: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_daily_wage_rs')}</label>
                        <input
                            type="number"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.wage_per_day}
                            onChange={e => setFormData({ ...formData, wage_per_day: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_start_date')}</label>
                    <input
                        type="date"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.start_date}
                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_desc')}</label>
                    <textarea
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white h-20"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('btn_post_new_job')}
                </button>
            </form>
        </Modal>
    );
};
