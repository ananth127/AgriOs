import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import dynamic from 'next/dynamic';

const LocationSelector = dynamic(() => import('@/components/LocationSelector'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black/50 z-[9999]" />
});

interface CreateFarmProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateFarmModal: React.FC<CreateFarmProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        location_lat: string;
        location_lon: string;
        area_acres: string;
        soil_type: string;
        survey_number?: string;
        boundary?: [number, number][]; // Array of [lat, lon]
    }>({
        name: '',
        location_lat: '',
        location_lon: '',
        area_acres: '',
        soil_type: 'Loam',
        survey_number: ''
    });

    const handleFetchBoundary = async () => {
        // MOCK API Call to Government Land Record Service
        setLoading(true);
        console.log(`Fetching boundary for Survey No: ${formData.survey_number}`);

        // Simulate network delay
        setTimeout(() => {
            // Mock logic: Create a small square around the current location or a default
            const centerLat = parseFloat(formData.location_lat) || 18.5204;
            const centerLon = parseFloat(formData.location_lon) || 73.8567;

            // Mock Polygon (approx 2 acres square)
            const mockBoundary: [number, number][] = [
                [centerLat - 0.001, centerLon - 0.001],
                [centerLat + 0.001, centerLon - 0.001],
                [centerLat + 0.001, centerLon + 0.001],
                [centerLat - 0.001, centerLon + 0.001],
            ];

            setFormData(prev => ({
                ...prev,
                boundary: mockBoundary,
                // Auto-fill lat/lon if empty
                location_lat: !prev.location_lat ? centerLat.toString() : prev.location_lat,
                location_lon: !prev.location_lon ? centerLon.toString() : prev.location_lon
            }));

            setLoading(false);
            alert("Government Record Found! Boundary imported successfully.");
        }, 1500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.id) {
            alert("User not authenticated.");
            return;
        }

        setLoading(true);
        try {
            const lat = parseFloat(formData.location_lat);
            const lon = parseFloat(formData.location_lon);

            // Construct WKT Polygon
            let points = formData.boundary;
            if (!points || points.length === 0) {
                const d = 0.001; // Default ~2 acre box
                points = [
                    [lat - d, lon - d],
                    [lat + d, lon - d],
                    [lat + d, lon + d],
                    [lat - d, lon + d]
                ];
            }

            // Format for WKT: POINT(lon lat) ... must close loop
            const wktPoints = [...points, points[0]].map(p => `${p[1]} ${p[0]}`).join(", ");
            const geometryWKT = `POLYGON((${wktPoints}))`;

            const payload = {
                name: formData.name,
                owner_id: user.id,
                geometry: geometryWKT,
                soil_profile: {
                    type: formData.soil_type,
                    ph: 7.0, // Default
                    nutrients: { N: "Medium", P: "Medium", K: "Medium" } // Default
                }
                // Note: boundary and survey_number are not currently stored in backend
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
        <>
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

                    {/* Survey Number Import Section */}
                    <div className="p-3 bg-slate-900 border border-white/5 rounded-lg mb-4">
                        <label className="block text-xs font-bold text-green-400 uppercase tracking-wider mb-2">Import Government Record</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-slate-950 border border-white/10 rounded-lg p-2 text-white text-sm"
                                placeholder="Enter Survey / Patta Number"
                                value={formData.survey_number || ''}
                                onChange={e => setFormData({ ...formData, survey_number: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={handleFetchBoundary}
                                disabled={!formData.survey_number}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Fetch
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-slate-400">Location</label>
                            <button
                                type="button"
                                onClick={() => setIsMapOpen(true)}
                                className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 font-bold"
                            >
                                <MapPin className="w-3 h-3" />
                                Pick on Map
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Latitude</label>
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
                                <label className="block text-xs text-slate-500 mb-1">Longitude</label>
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

            <LocationSelector
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                onSelect={(lat, lng) => {
                    setFormData(prev => ({
                        ...prev,
                        location_lat: lat.toString(),
                        location_lon: lng.toString()
                    }));
                }}
                simpleMode
            />
        </>
    );
};
