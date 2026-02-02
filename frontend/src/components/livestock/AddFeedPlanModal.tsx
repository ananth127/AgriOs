import React, { useState } from 'react';
import { api } from '@/lib/api';
import { X, Wheat, Save } from 'lucide-react';

interface AddFeedPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    housingList: any[];
    animals: any[];
}

export const AddFeedPlanModal: React.FC<AddFeedPlanModalProps> = ({ isOpen, onClose, onSuccess, housingList, animals = [] }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [targetType, setTargetType] = useState<'housing' | 'animal'>('housing');

    const [formData, setFormData] = useState({
        target_id: '',
        feed_item_name: '',
        quantity_per_day: 50,
        schedule_times: '08:00, 18:00',
        auto_feeder_enabled: false
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Convert schedule string to array
            const scheduleArray = formData.schedule_times.split(',').map(s => s.trim());

            const payload: any = {
                feed_item_name: formData.feed_item_name,
                quantity_per_day: formData.quantity_per_day,
                schedule_times: scheduleArray,
                auto_feeder_enabled: formData.auto_feeder_enabled,
                auto_water_enabled: false // Default
            };

            if (targetType === 'housing') {
                payload.housing_id = Number(formData.target_id);
            } else {
                payload.animal_id = Number(formData.target_id);
            }

            await api.livestock.createFeedPlan(payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create feed plan", error);
            alert("Failed to save plan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Wheat className="w-5 h-5 text-amber-400" />
                        Setup Feeding Plan
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Target Selector Switch */}
                    <div className="flex bg-slate-800 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => { setTargetType('housing'); setFormData(prev => ({ ...prev, target_id: housingList[0]?.id || '' })); }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${targetType === 'housing' ? 'bg-amber-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Group (Housing)
                        </button>
                        <button
                            type="button"
                            onClick={() => { setTargetType('animal'); setFormData(prev => ({ ...prev, target_id: animals[0]?.id || '' })); }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${targetType === 'animal' ? 'bg-amber-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Individual Animal
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                            {targetType === 'housing' ? 'Select Shelter' : 'Select Animal'}
                        </label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                            value={formData.target_id}
                            onChange={e => setFormData({ ...formData, target_id: e.target.value })}
                            required
                        >
                            <option value="">-- Select Target --</option>
                            {targetType === 'housing' ? (
                                housingList.map(h => (
                                    <option key={h.id} value={h.id}>{h.name} ({h.type})</option>
                                ))
                            ) : (
                                animals.map(a => (
                                    <option key={a.id} value={a.id}>{a.tag_id} - {a.name || 'Unnamed'}</option>
                                ))
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Feed / Nutrition Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Silage, Poultry Mix, Calcium"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                            value={formData.feed_item_name}
                            onChange={e => setFormData({ ...formData, feed_item_name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Total Daily Qty (kg)</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                                value={formData.quantity_per_day}
                                onChange={e => setFormData({ ...formData, quantity_per_day: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Schedule (HH:MM)</label>
                            <input
                                type="text"
                                placeholder="08:00, 18:00"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                                value={formData.schedule_times}
                                onChange={e => setFormData({ ...formData, schedule_times: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-white text-sm">Enable Auto-Feeder</p>
                            <p className="text-xs text-slate-400">Trigger IoT dispensers</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, auto_feeder_enabled: !prev.auto_feeder_enabled }))}
                            className={`w-12 h-6 rounded-full relative transition-colors ${formData.auto_feeder_enabled ? 'bg-green-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.auto_feeder_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-400 hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Plan</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
