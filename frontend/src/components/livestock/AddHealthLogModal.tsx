import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Save, Syringe, Activity, AlertCircle, FileText, Loader2 } from 'lucide-react';

interface AddHealthLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    animal: any;
}

export const AddHealthLogModal: React.FC<AddHealthLogModalProps> = ({ isOpen, onClose, onSuccess, animal }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        event_type: 'Checkup',
        description: '',
        cost: 0,
        next_due_date: '',
        date: new Date().toISOString().split('T')[0]
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.livestock.addHealthLog(animal.id, {
                ...formData,
                cost: Number(formData.cost),
                next_due_date: formData.next_due_date || null
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to add log", error);
            alert("Failed to add health log.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Health Record">
            <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Event Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Checkup', 'Vaccination', 'Treatment', 'Injury', 'Sickness'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData({ ...formData, event_type: type })}
                                className={`p-2 rounded-lg text-sm border transition-colors flex items-center justify-center gap-2 ${formData.event_type === type
                                        ? 'bg-blue-600 border-blue-500 text-white'
                                        : 'bg-slate-950 border-white/10 text-slate-400 hover:bg-slate-800'
                                    }`}
                            >
                                {type === 'Vaccination' && <Syringe className="w-3 h-3" />}
                                {type === 'Checkup' && <Activity className="w-3 h-3" />}
                                {(type === 'Injury' || type === 'Sickness') && <AlertCircle className="w-3 h-3" />}
                                {type === 'Treatment' && <FileText className="w-3 h-3" />}
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                    <input
                        type="date"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Details / Notes</label>
                    <textarea
                        required
                        placeholder="Describe observations, medicines used, or symptoms..."
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Cost ($)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            value={formData.cost}
                            onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Next Due (Optional)</label>
                        <input
                            type="date"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            value={formData.next_due_date}
                            onChange={e => setFormData({ ...formData, next_due_date: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-4 flex justify-center items-center gap-2 transition-colors"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Record</>}
                </button>
            </form>
        </Modal>
    );
};
