'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import {
    Loader2, ArrowRight, CloudSun, Droplets, Thermometer,
    Calculator, BookOpen, ShoppingBag, Users, ScanLine, Sprout,
    MessageCircle, Leaf, Tractor
} from 'lucide-react';

const ProphetWidget = dynamic(() => import('@/components/dashboard/ProphetWidget'), { ssr: false });
const WeatherWidget = dynamic(() => import('@/components/dashboard/WeatherWidget'), { ssr: false });
const QrScannerModal = dynamic(() => import('@/components/dashboard/QrScannerModal').then(mod => mod.QrScannerModal), { ssr: false });

export default function Index({ params: { locale } }: { params: { locale: string } }) {
    const tDashboard = useTranslations('Dashboard');
    const tAuth = useTranslations('Auth');
    const tGlobal = useTranslations('Global');
    const { isAuthenticated, loading, user } = useAuth();
    const [isQrOpen, setIsQrOpen] = React.useState(false);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Landing Page for Guest (Keep existing or simplify)
        return (
            <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center z-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-green-500/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="z-10 max-w-4xl">
                    <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-6 leading-tight">
                        {tDashboard('hero_title_part1')} <span className="text-green-400">{tDashboard('hero_title_part2')}</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        {tDashboard('hero_subtitle')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/login" className="px-8 py-4 bg-green-500 hover:bg-green-400 text-slate-950 font-bold rounded-xl transition-all hover:scale-105 flex items-center gap-2 justify-center">
                            {tAuth('login_button')} <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/auth/signup" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all hover:scale-105 flex items-center gap-2 justify-center">
                            {tAuth('signup_button')}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    // AUTHENTICATED DASHBOARD (Plantix Style)
    return (
        <main className="min-h-screen bg-slate-950 text-white selection:bg-green-500/30 font-sans pb-20">

            {/* Top Header Section */}
            <header className="px-6 pt-8 pb-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-white/5">
                <div className="max-w-5xl mx-auto flex justify-between items-end">
                    <div>
                        <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-medium">{dateFormat(new Date(), locale)}</p>
                        <h1 className="text-3xl font-bold text-white">
                            {tDashboard('greeting_hello')} <span className="text-green-400">{user?.full_name?.split(' ')[0] || tDashboard('greeting_farmer')}!</span>
                        </h1>
                        <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                            <Leaf className="w-3 h-3 text-green-500" />
                            {user?.location_name || tDashboard('location_not_set')}
                        </p>
                    </div>

                    <button
                        onClick={() => setIsQrOpen(true)}
                        className="group flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/50 rounded-xl transition-all active:scale-95 shadow-lg hover:shadow-green-900/20"
                    >
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400 group-hover:bg-green-500 group-hover:text-black transition-colors">
                            <ScanLine className="w-5 h-5" />
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-xs text-slate-400 font-medium">Quick Action</p>
                            <p className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">Scan Tag</p>
                        </div>
                    </button>
                </div>
            </header>

            <QrScannerModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 mt-6">

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
                    <Link href="/crop-doctor" className="group relative bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col justify-between overflow-hidden hover:border-green-500/50 transition-all shadow-lg hover:shadow-green-900/10">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">{tDashboard('crop_doctor_title')}</h2>
                                <p className="text-slate-400 text-sm max-w-[200px]">{tDashboard('crop_doctor_desc')}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-black transition-all">
                                <ScanLine className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <div className="inline-flex items-center gap-2 text-sm font-bold text-green-400 group-hover:translate-x-1 transition-transform">
                                {tDashboard('start_diagnosis')} <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* 2. Quick Services Grid */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4 px-1">{tDashboard('services_title')}</h3>
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
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">{tDashboard('my_crops_title')}</h3>
                        <Link href="/crops" className="text-xs font-bold text-green-400 hover:text-green-300">{tDashboard('view_all')}</Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                        {/* Mock Crop Cards - Pass tDashboard to them component or hardcode? 
                            This is mock data. I'll leave crop names as is or use tCrops if I had it. */}
                        <CropCard name="Potato" stage="Flowering" health="Good" days={45} image="/crops/potato.jpg" labelDay={tDashboard('day_count', { days: 45 })} />
                        <CropCard name="Tomato" stage="Vegetative" health="Risk" days={22} image="/crops/tomato.jpg" labelDay={tDashboard('day_count', { days: 22 })} />

                        {/* Add New Crop */}
                        <Link href="/crops/new" className="min-w-[140px] h-[160px] rounded-xl border-2 border-dashed border-slate-700 hover:border-green-500/50 flex flex-col items-center justify-center gap-3 group transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-green-500/20 group-hover:text-green-400 transition-colors">
                                <span className="text-2xl">+</span>
                            </div>
                            <span className="text-sm font-medium text-slate-500 group-hover:text-slate-300">{tDashboard('add_crop')}</span>
                        </Link>
                    </div>
                </div>

                {/* 4. Insights / Prophet */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4 px-1">{tDashboard('market_insights')}</h3>
                    <ProphetWidget locationName={user?.location_name} />
                </div>

            </div>
        </main>
    );
}

// Sub-components
function ServiceCard({ href, icon, label, desc, color, bg }: any) {
    return (
        <Link href={href} className={`rounded-xl p-4 border border-white/5 transition-all group ${bg}`}>
            <div className={`mb-3 ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
            <div className="font-bold text-white text-sm">{label}</div>
            <div className="text-xs text-slate-400">{desc}</div>
        </Link>
    );
}

function CropCard({ name, stage, health, days, image, labelDay }: any) {
    const isRisk = health === 'Risk';
    return (
        <div className="min-w-[140px] bg-slate-950 border border-white/10 rounded-xl p-3 flex flex-col gap-3 hover:border-white/20 transition-colors">
            <div className="w-full h-24 bg-slate-800 rounded-lg relative overflow-hidden">
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white backdrop-blur-md">
                    {labelDay || `Day ${days}`}
                </div>
                {/* Placeholder for crop image */}
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Sprout className="w-8 h-8 opacity-50" />
                </div>
            </div>
            <div>
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-sm">{name}</h4>
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
