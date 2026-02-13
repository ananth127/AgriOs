import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EditProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    asset: any;
}

export const EditAssetModal: React.FC<EditProps> = ({ isOpen, onClose, onSuccess, asset }) => {
    const t = useTranslations('FarmManagement');
    const tGlobal = useTranslations('Global');
    const [loading, setLoading] = useState(false);
    const [pumps, setPumps] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        asset_type: '',
        cost: '',
        is_iot_enabled: false,
        parent_device_id: ''
    });

    useEffect(() => {
        if (asset) {
            setFormData({
                name: asset.name,
                asset_type: asset.asset_type,
                cost: asset.cost ? asset.cost.toString() : '',
                is_iot_enabled: asset.is_iot_enabled,
                parent_device_id: asset.iot_settings?.parent_device_id ? String(asset.iot_settings.parent_device_id) : ''
            });

            // Fetch pumps if it's a Valve
            if (asset.asset_type === 'Valve') {
                api.iot.getDevices().then(devices => {
                    const pumpList = Array.isArray(devices) ? devices.filter((d: any) => d.asset_type === 'Pump') : [];
                    setPumps(pumpList);
                }).catch(console.error);
            }
        }
    }, [asset]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.farmManagement.updateAsset(asset.id, {
                ...formData,
                cost: parseFloat(formData.cost) || 0,
                purchase_date: asset.purchase_date, // Keep original
                // Merge config updates
                config: {
                    ...(asset.iot_settings || {}),
                    parent_device_id: formData.parent_device_id ? parseInt(formData.parent_device_id) : undefined
                }
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to update asset", error);
            alert(t('error_update_asset'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('modal_edit_asset_title')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_asset_name')}</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
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
                        <option value="Tractor">{t('type_tractor') || "Tractor"}</option>
                        <option value="Harvester">{t('type_harvester') || "Harvester"}</option>
                        <option value="Drill">Seed Drill</option>
                        <option value="Valve">Smart Valve</option>
                        <option value="Pump">{t('type_pump') || "Pump"}</option>
                        <option value="Sprinkler">Sprinkler System</option>
                        <option value="DripSystem">{t('type_dripsystem') || "Drip Irrigation System"}</option>
                        <option value="Pipeline">Pipeline</option>
                        <option value="Sprayer">{t('type_sprayer') || "Sprayer"}</option>
                        <option value="FloodChannel">Flood Irrigation Channel</option>
                        <option value="Sensor">Soil Sensor / Weather Station</option>
                        <option value="Camera">CCTV / IP Camera</option>
                        <option value="IoT Device">{t('type_iot_device') || "Generic IoT Device"}</option>
                    </select>
                </div>

                {/* Valve -> Pump Connector */}
                {formData.asset_type === 'Valve' && (
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">Connect to Pump (Source)</label>
                        <select
                            className="w-full bg-black border border-blue-500/30 rounded p-2 text-white text-sm"
                            value={formData.parent_device_id}
                            onChange={e => setFormData({ ...formData, parent_device_id: e.target.value })}
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

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">{t('label_cost_rs')}</label>
                    <input
                        type="number"
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-white"
                        value={formData.cost}
                        onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="iot_check_edit"
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={formData.is_iot_enabled}
                        onChange={e => setFormData({ ...formData, is_iot_enabled: e.target.checked })}
                    />
                    <label htmlFor="iot_check_edit" className="text-sm font-medium text-slate-300">{t('label_iot_enabled_short')}</label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg mt-4 flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : tGlobal('save_changes')}
                </button>
            </form>
        </Modal>
    );
};
