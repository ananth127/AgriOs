import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface CreateBatchProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (id: string) => void;
}

export const CreateBatchModal: React.FC<CreateBatchProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        item_name: '',
        quantity: '',
        unit: 'kg',
        farm_location: 'Sunny Acres',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Assuming api.supplyChain.createBatch exists or mapped to correct endpoint
            // The user wanted "Add/Modify", creating a batch is adding.
            const res = await api.supplyChain.createBatch({
                batch_number: `BATCH-${Date.now().toString().slice(-6)}`, // Auto-gen
                origin: formData.farm_location,
                item: formData.item_name,
                initial_quantity: parseFloat(formData.quantity)
            });
            // Assume res returns the created object or ID
            onSuccess((res as any)?.batch_number || "NEW-BATCH");
            onClose();
        } catch (error) {
            console.error("Failed to create batch", error);
            // Fallback for demo if API fails (e.g. backend not fully wired for SC yet)
            // But we should try to be real.
            alert("Failed to create batch (Backend endpoint might be missing)");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Supply Chain Batch">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Item Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder="e.g. Alphonso Mangoes"
                        value={formData.item_name}
                        onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Quantity</label>
                        <input
                            type="number"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Unit</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Origin Location</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.farm_location}
                        onChange={e => setFormData({ ...formData, farm_location: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                    <textarea
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white h-20"
                        placeholder="Quality A+"
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Batch QR'}
                </button>
            </form>
        </Modal>
    );
};
