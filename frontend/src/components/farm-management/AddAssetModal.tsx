import React, { useState } from 'react';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CreateProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    farmId: number;
    category?: 'all' | 'machinery' | 'irrigation';
}

export const AddAssetModal: React.FC<CreateProps> = ({ isOpen, onClose, onSuccess, farmId, category = 'all' }) => {
    const t = useTranslations('FarmManagement');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        asset_type: category === 'irrigation' ? 'Valve' : 'Tractor',
        purchase_date: new Date().toISOString().split('T')[0],
        cost: '',
        is_iot_enabled: category === 'irrigation', // Default to true if context is irrigation
        iot_device_id: '',
        sensors: [] as string[]
    });

    const toggleSensor = (sensor: string) => {
        setFormData(prev => ({
            ...prev,
            sensors: prev.sensors.includes(sensor)
                ? prev.sensors.filter(s => s !== sensor)
                : [...prev.sensors, sensor]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.farmManagement.addAsset({
                farm_id: farmId,
                name: formData.name,
                asset_type: formData.asset_type,
                purchase_date: formData.purchase_date,
                cost: parseFloat(formData.cost),
                is_iot_enabled: formData.is_iot_enabled,
                iot_device_id: formData.is_iot_enabled ? formData.iot_device_id : undefined,
                config: {
                    sensors: formData.sensors,
                    // Auto-generate capabilities based on settings
                    capabilities: formData.sensors
                }
            });
            onSuccess();
            trackEvent("Farm Management", "Add Asset", formData.name);
            onClose();
        } catch (error) {
            console.error("Failed to add asset", error);
            alert(t('error_add_asset'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('modal_new_asset_title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_asset_name')}</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        placeholder={t('ph_asset_name')}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_type')}</label>
                    <select
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.asset_type}
                        onChange={e => setFormData({ ...formData, asset_type: e.target.value })}
                    >
                        {(category === 'all' || category === 'machinery') && (
                            <>
                                <option value="Tractor">{t('type_tractor') || "Tractor"}</option>
                                <option value="Harvester">{t('type_harvester') || "Harvester"}</option>
                                <option value="Drill">Seed Drill</option>
                            </>
                        )}

                        {(category === 'all' || category === 'irrigation') && (
                            <>
                                <option value="Valve">Smart Valve</option>
                                <option value="Pump">{t('type_pump') || "Pump"}</option>
                                <option value="Sprinkler">Sprinkler System</option>
                                <option value="DripSystem">{t('type_dripsystem') || "Drip Irrigation System"}</option>
                                <option value="Pipeline">Pipeline</option>
                                <option value="Sprayer">{t('type_sprayer') || "Sprayer"}</option>
                                <option value="FloodChannel">Flood Irrigation Channel</option>
                                <option value="Sensor">Soil Sensor / Weather Station</option>
                            </>
                        )}

                        {(category === 'all') && <option value="IoT Device">{t('type_iot_device') || "Generic IoT Device"}</option>}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_purchase_date')}</label>
                        <input
                            type="date"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.purchase_date}
                            onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_cost_rs')}</label>
                        <input
                            type="number"
                            required
                            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                            value={formData.cost}
                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="iot_check"
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={formData.is_iot_enabled}
                        onChange={e => setFormData({ ...formData, is_iot_enabled: e.target.checked })}
                    />
                    <label htmlFor="iot_check" className="text-sm font-medium text-slate-300">{t('label_iot_enabled_long')}</label>
                </div>

                {formData.is_iot_enabled && (
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-green-400 mb-1 uppercase tracking-wider">Hardware ID / MAC Address</label>
                        <input
                            type="text"
                            className="w-full bg-black border border-green-500/30 rounded p-2 text-white font-mono text-sm"
                            placeholder="e.g. A1:B2:C3:D4"
                            value={formData.iot_device_id}
                            onChange={e => setFormData({ ...formData, iot_device_id: e.target.value })}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">This ID is required to sync controls with the physical device.</p>
                    </div>
                )}

                {/* Sensors Configuration (Only for Smart Irrigation) */}
                {category === 'irrigation' && formData.is_iot_enabled && (
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                        <label className="block text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">Integrated Capabilities / Sensors</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Flow Meter', 'Pressure Gauge', 'Soil Moisture', 'Rain Sensor', 'Voltage Monitor'].map(sensor => (
                                <label key={sensor} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.sensors.includes(sensor)}
                                        onChange={() => toggleSensor(sensor)}
                                        className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-300">{sensor}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('btn_add_asset')}
                </button>
            </form>
        </Modal >
    );
};
