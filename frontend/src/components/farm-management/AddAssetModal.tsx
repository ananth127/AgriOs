import React, { useState, useEffect } from 'react';
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
    const [pumps, setPumps] = useState<any[]>([]);
    const [parentDeviceId, setParentDeviceId] = useState<string>('');

    const [formData, setFormData] = useState({
        name: '',
        asset_type: category === 'irrigation' ? 'Valve' : 'Tractor',
        purchase_date: new Date().toISOString().split('T')[0],
        cost: '',
        is_iot_enabled: category === 'irrigation',
        iot_device_id: '',
        sensors: [] as string[]
    });

    // Fetch Pumps when adding a Valve
    useEffect(() => {
        if (isOpen && formData.asset_type === 'Valve') {
            api.iot.getDevices().then(devices => {
                const pumpList = Array.isArray(devices) ? devices.filter((d: any) => d.asset_type === 'Pump') : [];
                setPumps(pumpList);
            }).catch(console.error);
        }
    }, [isOpen, formData.asset_type]);

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
                cost: formData.cost ? parseFloat(formData.cost) : 0,
                is_iot_enabled: formData.is_iot_enabled,
                iot_device_id: formData.is_iot_enabled ? formData.iot_device_id : undefined,
                config: {
                    sensors: formData.sensors,
                    parent_device_id: parentDeviceId ? parseInt(parentDeviceId) : undefined,
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

                        {(category === 'all') && (
                            <>
                                <option value="Camera">CCTV / IP Camera</option>
                                <option value="IoT Device">{t('type_iot_device') || "Generic IoT Device"}</option>
                            </>
                        )}
                    </select>
                </div>

                {/* Valve -> Pump Connector */}
                {formData.asset_type === 'Valve' && (
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">Connect to Pump (Source)</label>
                        <select
                            className="w-full bg-black border border-blue-500/30 rounded p-2 text-white text-sm"
                            value={parentDeviceId}
                            onChange={e => setParentDeviceId(e.target.value)}
                        >
                            <option value="">-- No Direct Pump Connection --</option>
                            {pumps.map(pump => (
                                <option key={pump.id} value={pump.id}>
                                    {pump.name} ({pump.hardware_id})
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">Select the main pump this valve controls flow from.</p>
                    </div>
                )}

                {/* Stream URL for Cameras */}
                {formData.asset_type === 'Camera' && (
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">Stream URL (RTSP / HTTP)</label>
                        <input
                            type="text"
                            className="w-full bg-black border border-blue-500/30 rounded p-2 text-white font-mono text-sm"
                            placeholder="http://192.168.1.50:8080/video"
                            value={formData.is_iot_enabled ? formData.iot_device_id : ''}
                            onChange={e => setFormData({
                                ...formData,
                                is_iot_enabled: true, // Auto-enable IoT for cameras
                                iot_device_id: e.target.value // Store URL in device ID for now, or config
                            })}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Enter the local IP stream URL. (e.g. http://... or rtsp://...)</p>
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
