import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';

interface CreateFarmProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateFarmModal: React.FC<CreateFarmProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location_lat: '',
        location_lon: '',
        area_acres: '',
        soil_type: 'Loam'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Check api.ts for farms.create signature. 
            // It expects { name, geometry: { type: "Point", coordinates: [lon, lat] }, soil_profile: { type: "..." } } usually
            // but let's check what the backend expects.
            // Backend `models.py` has `name`, `geometry`, `soil_profile`.

            const payload = {
                name: formData.name,
                geometry: {
                    type: "Point",
                    coordinates: [parseFloat(formData.location_lon), parseFloat(formData.location_lat)]
                },
                soil_profile: {
                    type: formData.soil_type,
                    ph: 7.0, // Default
                    nutrients: { N: "Medium", P: "Medium", K: "Medium" } // Default
                }
            };

            await api.farms.create(payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create farm", error);
            alert("Failed to create farm");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Farm">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Farm Name</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder="e.g. Green Valley Estate"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Latitude</label>
                        <input
                            type="number"
                            step="any"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder="e.g. 18.5204"
                            value={formData.location_lat}
                            onChange={e => setFormData({ ...formData, location_lat: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Longitude</label>
                        <input
                            type="number"
                            step="any"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            placeholder="e.g. 73.8567"
                            value={formData.location_lon}
                            onChange={e => setFormData({ ...formData, location_lon: e.target.value })}
                        />
                    </div>
                </div>

                <div className="text-xs text-slate-500">
                    * Tip: You can get coordinates from Google Maps (Right click > What's here?)
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Total Area (Acres)</label>
                        <input
                            type="number"
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.area_acres}
                            onChange={e => setFormData({ ...formData, area_acres: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Soil Type</label>
                        <select
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.soil_type}
                            onChange={e => setFormData({ ...formData, soil_type: e.target.value })}
                        >
                            <option value="Loam">Loam</option>
                            <option value="Clay">Clay</option>
                            <option value="Sandy">Sandy</option>
                            <option value="Silt">Silt</option>
                            <option value="Peat">Peat</option>
                            <option value="Chalk">Chalk</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Farm'}
                </button>
            </form>
        </Modal>
    );
};
