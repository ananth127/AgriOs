'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import {
    Loader2, ArrowRight, CloudSun, Droplets, Thermometer,
    Calculator, BookOpen, ShoppingBag, Users, ScanLine, Sprout,
    Leaf, Tractor
} from 'lucide-react';

import { FarmEcosystem } from '@/components/dashboard/FarmEcosystem';

// Dynamic Imports with SSR disabled for heavy widgets
const ProphetWidget = dynamic(() => import('@/components/dashboard/ProphetWidget'), { ssr: false });
const WeatherWidget = dynamic(() => import('@/components/dashboard/WeatherWidget'), { ssr: false });
const QrScannerModal = dynamic(() => import('@/components/dashboard/QrScannerModal').then(mod => mod.QrScannerModal), { ssr: false });
const LocationSelector = dynamic(() => import('@/components/LocationSelector'), { ssr: false });
import { API_BASE_URL } from '@/lib/constants';

export default function DashboardView({ locale }: { locale: string }) {
    const tDashboard = useTranslations('Dashboard');
    const { user, updateUser, token, logout } = useAuth();
    const [isQrOpen, setIsQrOpen] = React.useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = React.useState(false);
    const [isUpdatingLocation, setIsUpdatingLocation] = React.useState(false);
    const [farms, setFarms] = React.useState<any[]>([]);

    const fetchFarms = React.useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/farms/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFarms(data);
            } else if (res.status === 401) {
                console.error("Unauthorized - logging out");
                logout();
            }
        } catch (e) {
            console.error("Failed to fetch farms", e);
        }
    }, [token, logout]);

    React.useEffect(() => {
        fetchFarms();
    }, [fetchFarms]);

    const handleUpdateLocation = async (lat: number, lng: number, name: string) => {
        setIsUpdatingLocation(true);
        try {
            // 1. Update User Profile (Current Location)
            const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    latitude: lat,
                    longitude: lng,
                    location_name: name
                })
            });

            if (userRes.ok) {
                const updatedUser = await userRes.json();
                updateUser(updatedUser);
            }

            // 2. Create a Farm Record (Server-side Zones will be generated)
            // Use a simple buffer for geometry simulation (WKT Polygon)
            // Approx 0.01 degrees box ~1km
            const d = 0.005;
            const wkt = `POLYGON((${lng - d} ${lat - d}, ${lng + d} ${lat - d}, ${lng + d} ${lat + d}, ${lng - d} ${lat + d}, ${lng - d} ${lat - d}))`;

            await fetch(`${API_BASE_URL}/farms/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name || "New Farm",
                    owner_id: (user as any)?.id, // Ensure user.id is checked at runtime
                    geometry: wkt,
                    soil_profile: { type: "Loamy", ph: 6.5 }
                })
            });

            // 3. Refresh Farms List
            await fetchFarms();

        } catch (error) {
            console.error("Error updating location/farm:", error);
        } finally {
            setIsUpdatingLocation(false);
            setIsLocationModalOpen(false);
        }
    };

    const handleUpdateZone = async (zoneId: number | string, data: any) => {
        try {
            await fetch(`${API_BASE_URL}/farms/zones/${zoneId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            await fetchFarms();
        } catch (error) {
            console.error("Error updating zone:", error);
        }
    };

    // Real-time Data Fetching
    const [realtime, setRealtime] = React.useState<any>(null);

    React.useEffect(() => {
        if (!token) return;

        const fetchRealtime = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/dashboard/realtime`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const newData = await res.json();
                    setRealtime((prev: any) => {
                        // Simple check to avoid re-renders if data is identical
                        if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
                        return newData;
                    });
                }
            } catch (e) { console.error("RT Fetch Error", e); }
        };

        fetchRealtime();
        const interval = setInterval(fetchRealtime, 4000); // Poll every 4s
        return () => clearInterval(interval);
    }, [token]);


    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-green-500/30 font-sans pb-20 transition-colors duration-300">

            {/* Top Header Section */}
            <header className="px-6 pt-8 pb-6 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-colors duration-300">
                <div className="max-w-5xl mx-auto flex justify-between items-end">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 uppercase tracking-wider font-medium">{dateFormat(new Date(), locale)}</p>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {tDashboard('greeting_hello')} <span className="text-green-600 dark:text-green-400">{user?.full_name?.split(' ')[0] || tDashboard('greeting_farmer')}!</span>
                        </h1>
                        <button
                            onClick={() => setIsLocationModalOpen(true)}
                            className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mt-1 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer group/loc"
                        >
                            <Leaf className="w-3 h-3 text-green-600 dark:text-green-500 group-hover/loc:scale-110 transition-transform" />
                            <span className="border-b border-transparent group-hover/loc:border-green-600 dark:group-hover/loc:border-green-400 border-dashed">
                                {user?.location_name || tDashboard('location_not_set')}
                            </span>
                        </button>
                    </div>

                    <button
                        onClick={() => setIsQrOpen(true)}
                        className="group flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-white/5 hover:bg-green-50 dark:hover:bg-green-500/20 border border-slate-200 dark:border-white/10 hover:border-green-500/50 rounded-xl transition-all active:scale-95 shadow-lg hover:shadow-green-900/20"
                    >
                        <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg text-green-600 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white dark:group-hover:text-black transition-colors">
                            <ScanLine className="w-5 h-5" />
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quick Action</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Scan Tag</p>
                        </div>
                    </button>
                </div>
            </header>

            <QrScannerModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
            <LocationSelector
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
                onSelect={(lat, lng, name) => handleUpdateLocation(lat, lng, name)}
                zones={farms.length > 0 ? farms[farms.length - 1].zones : []}
                onUpdateZone={handleUpdateZone}
            />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 mt-6">

                {/* 0. Real-time Status & Suggestions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Active Operations */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                {tDashboard('live_operations') || "Live Operations"}
                            </h3>
                            <Link href="/farm-management?tab=iot" className="text-xs font-bold text-blue-500 hover:text-blue-400">Manage Devices</Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Dynamic Real-time Cards */}
                            {realtime?.active_operations?.length > 0 ? (
                                realtime.active_operations.map((op: any) => (
                                    <div key={op.id} className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-between hover:border-blue-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                                <Droplets className="w-5 h-5 animate-pulse" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{op.name}</p>
                                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Running • {op.details}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-slate-400">Duration</span>
                                            <p className="font-mono text-sm dark:text-white">{op.duration}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                                    <p className="text-sm">No active machinery or irrigation systems.</p>
                                    <Link href="/farm-management?tab=iot" className="text-blue-500 text-xs mt-1 block hover:underline">Start a device</Link>
                                </div>
                            )}

                            {/* Recent Log (Static for now, could be dynamic later) */}
                            {(!realtime?.active_operations?.length) && (
                                <Link href="/farm-management" className="block hover:scale-[1.02] transition-transform col-span-2 sm:col-span-1">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-white/5 cursor-pointer hover:border-green-500/30">
                                        <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Recent Activity</p>
                                        <ul className="space-y-2">
                                            <li className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-300">✅ Zone 2 Irrigation</span>
                                                <span className="text-slate-400 text-xs">10m ago</span>
                                            </li>
                                        </ul>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Suggested Actions */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5">
                        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400 mb-3 flex items-center gap-2">
                            <span className="text-amber-500">⚡</span> {tDashboard('suggested_actions') || "Suggested"}
                        </h3>
                        <div className="space-y-3">
                            {realtime?.suggestions?.map((sugg: any) => (
                                <Link key={sugg.id} href={sugg.action_link} className="block w-full text-left p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-white/5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-slate-800 dark:text-slate-200 text-sm group-hover:text-amber-600 transition-colors">{sugg.title}</span>
                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">{sugg.reason}</p>
                                    <span className={`inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded border ${sugg.severity === 'High' ? 'text-red-500 bg-red-50 border-red-200' : 'text-slate-400 border-slate-200'}`}>
                                        {sugg.severity} Priority
                                    </span>
                                </Link>
                            ))}
                            {(!realtime?.suggestions?.length) && (
                                <p className="text-sm text-slate-500 italic">No urgent suggestions.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 0.5 Farm Ecosystem Monitor (Chain Mechanism) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                    <FarmEcosystem />
                </div>

                {/* 1. Hero Cards: Weather & Crop Doctor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Weather Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                            <CloudSun className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <WeatherWidget lat={user?.latitude} lng={user?.longitude} locationName={user?.location_name} />
                        </div>
                    </div>

                    {/* Crop Doctor Hero */}
                    <Link href="/crop-doctor" className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between overflow-hidden hover:border-green-500/50 transition-all shadow-lg hover:shadow-green-900/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent dark:from-green-500/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{tDashboard('crop_doctor_title')}</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[200px]">{tDashboard('crop_doctor_desc')}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white dark:group-hover:text-black transition-all">
                                <ScanLine className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <div className="inline-flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform">
                                {tDashboard('start_diagnosis')} <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* 2. Quick Services Grid */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-1">{tDashboard('services_title')}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <ServiceCard
                            href="/farm-management"
                            icon={<Tractor className="w-6 h-6" />}
                            label={tDashboard('service_farm_ops')}
                            desc={tDashboard('service_farm_ops_desc') || "Machinery & Labor"}
                            color="text-amber-400"
                            bg="bg-amber-500/10 hover:bg-amber-500/20"
                        />
                        <ServiceCard
                            href="/calculator"
                            icon={<Calculator className="w-6 h-6" />}
                            label={tDashboard('service_calculator')}
                            desc={tDashboard('service_calculator_desc')}
                            color="text-orange-400"
                            bg="bg-orange-500/10 hover:bg-orange-500/20"
                        />
                        <ServiceCard
                            href="/library"
                            icon={<BookOpen className="w-6 h-6" />}
                            label={tDashboard('service_library')}
                            desc={tDashboard('service_library_desc')}
                            color="text-blue-400"
                            bg="bg-blue-500/10 hover:bg-blue-500/20"
                        />
                        <ServiceCard
                            href="/marketplace"
                            icon={<ShoppingBag className="w-6 h-6" />}
                            label={tDashboard('service_shop')}
                            desc={tDashboard('service_shop_desc')}
                            color="text-purple-400"
                            bg="bg-purple-500/10 hover:bg-purple-500/20"
                        />
                        <ServiceCard
                            href="/community"
                            icon={<Users className="w-6 h-6" />}
                            label={tDashboard('service_community')}
                            desc={tDashboard('service_community_desc')}
                            color="text-pink-400"
                            bg="bg-pink-500/10 hover:bg-pink-500/20"
                        />
                    </div>
                </div>

                {/* 3. My Crops Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tDashboard('my_crops_title')}</h3>
                        <Link href="/crops" className="text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300">{tDashboard('view_all')}</Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                        {/* Mock Crop Cards */}
                        <CropCard name="Potato" stage="Flowering" health="Good" days={45} image="/crops/potato.jpg" labelDay={tDashboard('day_count', { days: 45 })} />
                        <CropCard name="Tomato" stage="Vegetative" health="Risk" days={22} image="/crops/tomato.jpg" labelDay={tDashboard('day_count', { days: 22 })} />

                        {/* Add New Crop */}
                        <Link href="/crops/new" className="min-w-[140px] h-[160px] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-green-500/50 flex flex-col items-center justify-center gap-3 group transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-green-100 dark:group-hover:bg-green-500/20 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                <span className="text-2xl">+</span>
                            </div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">{tDashboard('add_crop')}</span>
                        </Link>
                    </div>
                </div>

                {/* 4. Insights / Prophet */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 px-1">{tDashboard('market_insights')}</h3>
                    <ProphetWidget locationName={user?.location_name} />
                </div>

            </div>
        </main>
    );
}

// Sub-components
function ServiceCard({ href, icon, label, desc, color, bg }: any) {
    return (
        <Link href={href} className={`rounded-xl p-4 border border-slate-200 dark:border-white/5 transition-all group ${bg}`}>
            <div className={`mb-3 ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
            <div className="font-bold text-slate-900 dark:text-white text-sm">{label}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{desc}</div>
        </Link>
    );
}

function CropCard({ name, stage, health, days, image, labelDay }: any) {
    const isRisk = health === 'Risk';
    return (
        <div className="min-w-[140px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex flex-col gap-3 hover:border-green-500/50 dark:hover:border-white/20 transition-colors">
            <div className="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-lg relative overflow-hidden">
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white backdrop-blur-md">
                    {labelDay || `Day ${days}`}
                </div>
                {/* Placeholder for crop image */}
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <Sprout className="w-8 h-8 opacity-50" />
                </div>
            </div>
            <div>
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{name}</h4>
                    <span className={`w-2 h-2 rounded-full ${isRisk ? 'bg-red-500' : 'bg-green-500'}`}></span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{stage}</p>
            </div>
        </div>
    );
}

function dateFormat(date: Date, locale: string) {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}
