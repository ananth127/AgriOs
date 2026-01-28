import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface LogProductionProps {
    isOpen: boolean;
    onClose: () => void;
    animal: any;
    onSuccess: () => void;
}

export const LogProductionModal: React.FC<LogProductionProps> = ({ isOpen, onClose, animal, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        product_type: animal?.species === 'Poultry' ? 'Eggs' : 'Milk', 
        quantity: '',
        unit: animal?.species === 'Poultry' ? 'Count' : 'Liters'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.livestock.logProduction(animal.id, {
                date: formData.date,
                product_type: formData.product_type,
                quantity: parseFloat(formData.quantity),
                unit: formData.unit
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to log production", error);
            alert("Failed to save log");
        } finally {
            setLoading(false);
        }
    };

    if (!animal) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Log Production: ${animal.tag_id}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Product</label>
                        <select
                             className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                             value={formData.product_type}
                             onChange={e => setFormData({ ...formData, product_type: e.target.value })}
                        >
                            <option value="Milk">Milk</option>
                            <option value="Eggs">Eggs</option>
                            <option value="Wool">Wool</option>
                            <option value="Meat">Meat</option>
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-400 mb-1">Quantity ({formData.unit})</label>
                         <div className="flex gap-2">
                            <input
                                type="number"
                                step="0.1"
                                required
                                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                            />
                         </div>
                    </div>
                </div>

                <div className="flex gap-2 justify-end mt-2">
                     {['Morning', 'Evening'].map(time => (
                         <button 
                            key={time}
                            type="button" 
                            className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded hover:bg-slate-700"
                            onClick={() => console.log('Tagging session not implemented yet')}
                         >
                            {time}
                         </button>
                     ))}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Log'}
                </button>
            </form>
        </Modal>
    );
};
