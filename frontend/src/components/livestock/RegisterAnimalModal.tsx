import React, { useState } from 'react';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface RegisterAnimalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    farmId: number;
}

export const RegisterAnimalModal: React.FC<RegisterAnimalProps> = ({ isOpen, onClose, onSuccess, farmId }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tag_id: '',
        species: 'Cow',
        breed: '',
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
                tag_id: formData.tag_id,
                species: formData.species,
                breed: formData.breed,
                birth_date: formData.birth_date,
                weight_kg: parseFloat(formData.weight_kg),
                health_status: formData.health_status,
                last_vaccination_date: formData.last_vaccination_date || null
            });
            onSuccess();
            trackEvent("Livestock", "Register Animal", formData.tag_id);
            onClose();
        } catch (error) {
            console.error("Failed to register animal", error);
            alert("Failed to register animal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Register New Animal">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Tag ID</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder="e.g. COW-1001"
                        value={formData.tag_id}
                        onChange={e => setFormData({ ...formData, tag_id: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Species</label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.species}
                            onChange={e => setFormData({ ...formData, species: e.target.value })}
                        >
                            <option value="Cow">Cow</option>
                            <option value="Buffalo">Buffalo</option>
                            <option value="Goat">Goat</option>
                            <option value="Sheep">Sheep</option>
                            <option value="Poultry">Poultry</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Breed</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder="e.g. Gir, Murrah"
                            value={formData.breed}
                            onChange={e => setFormData({ ...formData, breed: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Weight (kg)</label>
                        <input
                            type="number"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.weight_kg}
                            onChange={e => setFormData({ ...formData, weight_kg: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.birth_date}
                            onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                        />
                    </div>
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

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Animal'}
                </button>
            </form>
        </Modal>
    );
};
