'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function NewDevicePage() {
    // const t = useTranslations('IoT');
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [hardwareId, setHardwareId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Smart Options
    const [assetType, setAssetType] = useState('Device'); // Device, Pump, Valve, Sensor
    const [parentPumpId, setParentPumpId] = useState<string>('');
    const [pumps, setPumps] = useState<any[]>([]);

    useEffect(() => {
        api.iot.getDevices().then((data: any) => {
            if (Array.isArray(data)) {
                setPumps(data.filter((d: any) => d.asset_type === 'Pump'));
            }
        }).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.iot.registerDevice({
                name,
                hardware_id: hardwareId,
                phone_number: phoneNumber || null,
                asset_type: assetType,
                parent_device_id: (assetType === 'Valve' && parentPumpId) ? parseInt(parentPumpId) : null
            });

            router.push('/devices');
        } catch (e: any) {
            console.error(e);
            const msg = e.response?.data?.detail || "Failed to register device";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-lg">
            <Link href="/devices" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Devices</span>
            </Link>

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-xl">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Register New Device</h1>
                <p className="text-slate-500 mb-6 text-sm">Use the Hardware ID printed on the back of your Agri-Controller.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Device Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. North Field Pump"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Hardware ID (MAC/UUID)</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. ESP32_A1B2C3D4"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 font-mono"
                            value={hardwareId}
                            onChange={(e) => setHardwareId(e.target.value.toUpperCase())}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                                value={assetType}
                                onChange={e => setAssetType(e.target.value)}
                            >
                                <option value="Device">Generic</option>
                                <option value="Pump">Pump</option>
                                <option value="Valve">Valve</option>
                                <option value="Sensor">Sensor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Device SIM (Optional)</label>
                            <input
                                type="text"
                                placeholder="+91..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Conditional: Parent Pump for Valves */}
                    {assetType === 'Valve' && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
                            <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Link directly to a Pump?</label>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                                Associates this valve with a pump. The system will prevent the pump from running if no valves are open.
                            </p>
                            <select
                                className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                value={parentPumpId}
                                onChange={e => setParentPumpId(e.target.value)}
                            >
                                <option value="">-- No Linked Pump --</option>
                                {pumps.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.hardware_id})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {loading ? 'Registering...' : 'Register Device'}
                    </button>
                </form>
            </div>
        </div>
    );
}
