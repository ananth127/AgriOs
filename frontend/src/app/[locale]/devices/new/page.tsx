'use client';

import React, { useState } from 'react';
import { useRouter } from '@/navigation';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/lib/constants';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/iot/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    hardware_id: hardwareId,
                    phone_number: phoneNumber || null
                })
            });

            if (res.ok) {
                router.push('/devices');
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to register device");
            }
        } catch (e) {
            console.error(e);
            alert("Network Error");
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

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Device SIM Number (Optional)</label>
                        <input
                            type="tel"
                            placeholder="+91..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <p className="text-xs text-slate-400 mt-1">Required only if you want the server to send SMS *to* the device.</p>
                    </div>

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
