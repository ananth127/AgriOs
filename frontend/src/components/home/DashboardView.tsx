'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';

import {
    Loader2, ArrowRight, CloudSun, Droplets, Thermometer,
    Calculator, BookOpen, ShoppingBag, Users, ScanLine, Sprout,
    Leaf, Tractor, Camera, Video, Activity, Plane, AlertCircle, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ... (existing code for FarmEcosystem, etc. - no change needed until LiveOperationsCarousel)

function LiveOperationsCarousel({ operations }: { operations: any[] }) {
    const tDashboard = useTranslations('Dashboard');
    const [index, setIndex] = React.useState(0);
    // Logic: Mobile 1 item, Desktop 2 items. 
    // We'll treat the index as the index of the *first* visible item.
    // For smooth sliding, we need to know the width of items. 
    // Simply sliding by % is easier. 
    // Mobile: 100% shift per index. Desktop: 50% shift per index.

    // However, keeping it simple: We will group data into "pages" of 2 (desktop) or 1 (mobile) logic is complex in pure CSS/React without resize listeners.
    // Alternative: Just render a horizontal list and translate it.

    // Let's assume a "card width" percentage.
    // On Desktop (sm+), we want 2 visible. So each card is 50%.
    // On Mobile, we want 1 visible? Or maybe 1.2 to show peek? Let's do 1 visible (100%).

    React.useEffect(() => {
        if (!operations || operations.length === 0) return;

        const interval = setInterval(() => {
            setIndex((prev) => {
                // If we are at the end, reset to 0.
                // We show 2 items at a time on desktop.
                // So if valid indices are 0 to N-1.
                // We want to stop when the last item is visible.
                // But simplified infinite loop is better for "dashboard" feel.
                return (prev + 1) % operations.length;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [operations?.length]);

    if (!operations?.length) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                    <p className="text-sm">{tDashboard('no_active_ops')}</p>
                    <Link href="/farm-management?tab=iot" className="text-blue-500 text-xs mt-1 block hover:underline">{tDashboard('start_device')}</Link>
                </div>
                {/* Static Recent Activity for Empty State */}
                <Link href="/farm-management" className="block hover:scale-[1.02] transition-transform col-span-2 sm:col-span-1">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-white/5 cursor-pointer hover:border-green-500/30">
                        <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">{tDashboard('recent_activity')}</p>
                        <ul className="space-y-2">
                            <li className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-300">✅ Zone 2 Irrigation</span>
                                <span className="text-slate-400 text-xs">10m ago</span>
                            </li>
                        </ul>
                    </div>
                </Link>
            </div>
        );
    }

    const getOpIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('camera') || n.includes('cctv') || n.includes('monitoring')) return <Camera className="w-5 h-5 animate-pulse text-red-500" />;
        if (n.includes('tractor') || n.includes('deere')) return <Tractor className="w-5 h-5 animate-bounce-slow text-amber-500" />;
        if (n.includes('drone') || n.includes('fly')) return <Plane className="w-5 h-5 animate-pulse text-sky-500" />;
        if (n.includes('moisture') || n.includes('irrigation') || n.includes('water')) return <Droplets className="w-5 h-5 animate-bounce-slow text-blue-500" />;
        if (n.includes('temp') || n.includes('climate') || n.includes('warm')) return <Thermometer className="w-5 h-5 text-orange-500" />;
        return <Activity className="w-5 h-5 animate-pulse text-green-500" />;
    };

    return (
        <div className="relative group/carousel overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-white/5">
            {/* Carousel Track */}
            <div
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] h-full"
                style={{
                    // Simple "One Page" slide logic.
                    // To avoid complex responsive JS logic, we slide by 100% (1 page) at a time.
                    // On Mobile: 1 Page = 1 Item (100% width).
                    // On Desktop: 1 Page = 2 Items (50% width each).
                    transform: `translateX(-${index * 100}%)`
                }}
            >
                {operations.map((op) => (
                    <div key={op.id} className="min-w-full sm:min-w-[50%] p-1.5 transition-all">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between h-full hover:border-blue-400 dark:hover:border-blue-600 transition-colors group/item">
                            <div className="flex items-center gap-4 overflow-hidden flex-1">
                                <div className="flex-shrink-0 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover/item:scale-105 transition-transform">
                                    {getOpIcon(op.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">{op.name}</p>
                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium truncate flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        {tDashboard('running')} • {op.details}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{tDashboard('duration')}</span>
                                <p className="font-mono text-sm font-bold dark:text-slate-200">{op.duration}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Indicators */}
            <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                {operations.map((_, i) => (
                    // Only show dots if there are enough pages? 
                    // If we show 1 dot per item, it's fine.
                    <div key={i} className={`h-1 rounded-full transition-all ${i === index ? 'w-4 bg-green-500' : 'w-1 bg-slate-300 dark:bg-slate-700'}`} />
                ))}
            </div>
        </div>
    );
}

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
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{tDashboard('quick_action')}</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{tDashboard('scan_tag')}</p>
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
                            <Link href="/farm-management?tab=iot" className="text-xs font-bold text-blue-500 hover:text-blue-400">{tDashboard('manage_devices')}</Link>
                        </div>

                        <SmartMonitorWidget />
                    </div>

                    {/* Suggested Actions */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5">
                        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400 mb-3 flex items-center gap-2">
                            <span className="text-amber-500">⚡</span> {tDashboard('suggested_actions') || "Suggested"}
                        </h3>
                        <div className="space-y-3">
                            <SuggestedActionsCarousel suggestions={realtime?.suggestions} />
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





// Re-write SuggestedActionsCarousel to be Swipeable using framer-motion
function SuggestedActionsCarousel({ suggestions }: { suggestions: any[] }) {
    const tDashboard = useTranslations('Dashboard');
    const [[page, direction], setPage] = React.useState([0, 0]);
    // Safety check for empty suggestions
    const validSuggestions = suggestions?.length ? suggestions : [];
    const index = validSuggestions.length > 0 ? Math.abs(page % validSuggestions.length) : 0;

    // Auto-slide logic
    React.useEffect(() => {
        if (validSuggestions.length <= 1) return;
        const timer = setInterval(() => {
            setPage([page + 1, 1]);
        }, 6000);
        return () => clearInterval(timer);
    }, [page, validSuggestions.length]);

    if (!validSuggestions.length) {
        return <p className="text-sm text-slate-500 italic">{tDashboard('no_suggestions')}</p>;
    }

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100, // Small distance for simple content slide
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0
        })
    };

    return (
        <div className="relative group/carousel">
            <div className="overflow-hidden min-h-[100px] relative">
                <AnimatePresence initial={false} custom={direction} mode='popLayout'>
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x);
                            if (swipe < -swipeConfidenceThreshold) {
                                paginate(1);
                            } else if (swipe > swipeConfidenceThreshold) {
                                paginate(-1);
                            }
                        }}
                        className="w-full absolute inset-0 cursor-grab active:cursor-grabbing px-0.5"
                    >
                        {/* Render 2 items based on index */}
                        <div className="grid grid-cols-1 gap-3 h-full">
                            {(() => {
                                const i1 = index % validSuggestions.length;
                                const i2 = (index + 1) % validSuggestions.length;
                                const items = [validSuggestions[i1], validSuggestions[i2]];

                                return items.map((sugg, i) => (
                                    <Link key={i} href={sugg?.action_link || '#'} className="block w-full text-left p-3 lg:p-4 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-white/5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group h-full">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm group-hover:text-amber-600 transition-colors line-clamp-1">
                                                {sugg?.title}
                                            </span>
                                            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2 min-h-[2.5em]">
                                            {sugg?.reason}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex items-center gap-1.5 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${sugg?.severity === 'High' ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/30' : 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${sugg?.severity === 'High' ? 'animate-pulse bg-red-500' : 'bg-slate-400'}`}></span>
                                                {sugg?.severity}
                                            </span>
                                        </div>
                                    </Link>
                                ));
                            })()}
                        </div>
                    </motion.div>
                </AnimatePresence>
                {/* Spacer to maintain height since absolute positioning removes it */}
                <div className="invisible p-4 border border-transparent flex flex-col gap-3">
                    <div>
                        <div className="mb-2"><span className="text-sm">Placeholder</span></div>
                        <p className="text-xs mb-3 min-h-[2.5em]">Placeholder content</p>
                        <div className="flex"><span className="text-[10px]">Placeholder</span></div>
                    </div>
                    <div>
                        <div className="mb-2"><span className="text-sm">Placeholder</span></div>
                        <p className="text-xs mb-3 min-h-[2.5em]">Placeholder content</p>
                        <div className="flex"><span className="text-[10px]">Placeholder</span></div>
                    </div>
                </div>
            </div>

            {/* Carousel Indicators - Adjusted for dual slide */}
            {validSuggestions.length > 2 && (
                <div className="flex justify-center gap-1.5 mt-4">
                    {Array.from({ length: Math.ceil(validSuggestions.length / 2) }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage([i, i > Math.floor(index / 2) ? 1 : -1])}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === Math.floor(index / 2) ? 'w-6 bg-amber-500' : 'w-1.5 bg-amber-300/40 hover:bg-amber-400'}`}
                            aria-label={`Go to slide group ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
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

function SmartMonitorWidget() {
    const tDashboard = useTranslations('Dashboard');
    // Mock Feeds
    // Mock Feeds with Specific Side Images
    const feeds = [
        {
            id: 1,
            name: 'Zone 2 - North Field',
            cam: 'CAM 01',
            type: 'Drone',
            status: 'STABLE',
            image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200',
            recent_photo: 'https://images.unsplash.com/photo-1625246333195-bf8f3f885f8c?q=80&w=400', // Field variant
            last_alert: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=400', // Bird
            bg_color: 'bg-green-500'
        },
        {
            id: 2,
            name: 'Main Irrigation Pump',
            cam: 'CAM 02',
            type: 'Sensor',
            status: 'ACTIVE',
            image: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=1200',
            recent_photo: 'https://images.unsplash.com/photo-1574689049597-7e6c8e755f53?q=80&w=400', // Water/Pump
            last_alert: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400', // Gauge/Industrial
            bg_color: 'bg-blue-500'
        },
        {
            id: 3,
            name: 'Warehouse Entry',
            cam: 'CAM 03',
            type: 'CCTV',
            status: 'ALERT',
            image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=1200',
            recent_photo: 'https://images.unsplash.com/photo-1530124566582-7c2c5878b698?q=80&w=400', // Door/Gate
            last_alert: 'https://images.unsplash.com/photo-1506097425191-7ad538b29cef?q=80&w=400', // Shadowy figure / detection
            bg_color: 'bg-red-500'
        }
    ];

    const [[page, direction], setPage] = React.useState([0, 0]);
    // We only have 3 feeds, so we wrap the index
    const imageIndex = Math.abs(page % feeds.length);
    const activeFeed = feeds[imageIndex];

    // Global Unusual Activity (Static / Independent of slide)
    const [globalAlerts, setGlobalAlerts] = React.useState([
        { id: 101, src: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=400', time: '10:41 AM', label: 'Gate Forced (South)', cam: 'CAM 05' },
        { id: 102, src: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?q=80&w=400', time: '10:40 AM', label: 'Leak Detected', cam: 'CAM 09' },
    ]);

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    // Auto-slide
    React.useEffect(() => {
        const timer = setInterval(() => {
            paginate(1);
        }, 10000);
        return () => clearInterval(timer);
    }, [page]);

    // Snapshot Update


    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
            scale: 0.95
        })
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
        return Math.abs(offset) * velocity;
    };

    return (
        <div className="relative group/monitor">
            {/* Indicators */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 pointer-events-none">
                {feeds.map((_, i) => (
                    <button
                        key={i}
                        onClick={(e) => {
                            e.preventDefault(); // Prevent navigating if just changing slides
                            setPage([i, i > imageIndex ? 1 : -1]);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all pointer-events-auto ${i === imageIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/80'}`}
                    />
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[320px]">
                {/* Left Box: Sliding Feed - Clickable to go to Smart Monitor */}
                <Link href="/smart-monitor" className="relative w-full h-[250px] lg:h-auto lg:flex-1 rounded-xl overflow-hidden bg-black group shadow-lg border border-slate-800 cursor-pointer block">
                    <AnimatePresence initial={false} custom={direction} mode='popLayout'>
                        <motion.div
                            key={page}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = swipePower(offset.x, velocity.x);
                                if (swipe < -swipeConfidenceThreshold) {
                                    paginate(1);
                                } else if (swipe > swipeConfidenceThreshold) {
                                    paginate(-1);
                                }
                            }}
                            className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
                        >
                            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)] ${activeFeed.status === 'ALERT' ? 'bg-red-500' : 'bg-green-500'}`} />
                                <span className="text-white text-xs font-bold tracking-wider">LIVE • {activeFeed.cam}</span>
                            </div>

                            <img
                                src={activeFeed.image || "https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=1200"}
                                alt="Live Feed"
                                className="w-full h-full object-cover opacity-90 pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none" />

                            {/* Data Overlay */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end pointer-events-none">
                                <div className="bg-black/40 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-green-400 border border-green-500/30 flex items-center gap-1">
                                    <Activity size={10} /> NET: {activeFeed.status}
                                </div>
                            </div>

                            {/* Controls Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-end pointer-events-auto">
                                <div className="pointer-events-none">
                                    <p className="text-white font-bold text-lg">{activeFeed.name}</p>
                                    <p className="text-white/60 text-xs font-mono mt-0.5">PTS: 34.552 | LAT: 12.34 | ZOOM: 1.2x</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                    <button className="p-2.5 bg-white/10 hover:bg-white/20 active:bg-green-500 rounded-lg text-white backdrop-blur border border-white/5 transition-colors"><Camera size={18} /></button>
                                    <button className="p-2.5 bg-white/10 hover:bg-white/20 active:bg-red-500 rounded-lg text-white backdrop-blur border border-white/5 transition-colors"><Video size={18} /></button>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </Link>

                {/* Right Box: Static History */}
                <div className="w-full lg:w-[320px] flex flex-col gap-3">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <History className="w-3.5 h-3.5 text-slate-400" />
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{tDashboard('detected_events')}</h4>
                        </div>
                        <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-800/30 animate-pulse">{tDashboard('auto_capture_on')}</span>
                    </div>


                    <div className="grid grid-cols-2 gap-2.5 h-full overflow-hidden relative p-1">
                        <AnimatePresence mode='popLayout'>
                            {/* TOP ROW: Dynamic - Linked to Active Camera */}
                            {/* slot 1: Recent Photo (1 min) */}
                            <motion.div
                                key={`recent-${activeFeed.id}`}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 aspect-[4/3] group cursor-pointer shadow-sm hover:shadow-md hover:border-green-500/40 transition-all z-0"
                            >
                                <img src={activeFeed.recent_photo} alt="Recent 1m" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-80" />
                                <div className="absolute top-2 right-2 bg-blue-500/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-white">1m ago</div>
                                <div className="absolute bottom-2 left-2 text-white">
                                    <p className="text-[10px] font-bold">{tDashboard('snapshot')}</p>
                                    <p className="text-[9px] opacity-70">{activeFeed.cam}</p>
                                </div>
                            </motion.div>

                            {/* slot 2: Last Movement/Unusual Activity in THIS camera */}
                            <motion.div
                                key={`alert-${activeFeed.id}`}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 aspect-[4/3] group cursor-pointer shadow-sm hover:shadow-md hover:border-red-500/40 transition-all z-0"
                            >
                                <img src={activeFeed.last_alert} alt="Last Alert" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-80" />
                                <div className="absolute top-2 right-2 bg-red-500/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-white flex items-center gap-1">
                                    <Activity size={8} /> {tDashboard('detected')}
                                </div>
                                <div className="absolute bottom-2 left-2 text-white">
                                    <p className="text-[10px] font-bold">{tDashboard('unusual_activity')}</p>
                                    <p className="text-[9px] opacity-70">{tDashboard('last_event')}</p>
                                </div>
                            </motion.div>

                            {/* BOTTOM ROW: Global / Static Unusual Activity (from all cameras) */}
                            {globalAlerts.map((alert) => (
                                <motion.div
                                    key={alert.id}
                                    layout
                                    className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 aspect-[4/3] group cursor-pointer shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all z-0"
                                >
                                    <img src={alert.src} alt="Global Alert" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                    <div className="absolute top-2 left-2 bg-amber-500/80 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-white">GLOBAL</div>
                                    <div className="absolute bottom-0 inset-x-0 p-2.5 text-white">
                                        <p className="text-[10px] font-bold truncate leading-tight">{alert.label}</p>
                                        <p className="text-[9px] text-white/70 font-mono mt-0.5">{alert.time} • {alert.cam}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div >
    );
}



