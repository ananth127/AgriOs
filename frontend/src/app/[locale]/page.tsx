
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { Loader2, ArrowRight } from 'lucide-react';

// Dynamically import widgets to avoid SSR issues with some libraries or just for code splitting
const ProphetWidget = dynamic(() => import('@/components/dashboard/ProphetWidget'), { ssr: false });
const WeatherWidget = dynamic(() => import('@/components/dashboard/WeatherWidget'), { ssr: false });
const MarketplaceWidget = dynamic(() => import('@/components/dashboard/MarketplaceWidget'), { ssr: false });

export default function Index({ params: { locale } }: { params: { locale: string } }) {
    const tDashboard = useTranslations('Dashboard');
    const tAuth = useTranslations('Auth');
    const tGlobal = useTranslations('Global');
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center z-10 relative overflow-hidden">
                {/* Background Effects */}
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

                <footer className="absolute bottom-6 text-center text-slate-500 text-sm z-10 w-full">
                    {tDashboard('footer_copyright')}
                </footer>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white selection:bg-green-500/30">

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                <header className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        {tGlobal('app_name')}
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                        {tAuth('welcome_back')}, <span className="text-green-400">{user?.full_name || user?.email || tAuth('guest_user')}</span>
                    </p>
                </header>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">

                    {/* 1. Prophet Engine (Large Widget) */}
                    <ProphetWidget locationName={user?.location_name} />

                    {/* 2. Farm Map (Small Widget) */}
                    <div className="col-span-1 row-span-1 rounded-2xl bg-slate-900 border border-white/10 p-6 flex flex-col group hover:border-blue-500/50 transition-colors">
                        <h2 className="text-lg font-semibold mb-2 text-blue-400">{tDashboard('widget_my_farm')}</h2>
                        <div className="flex-1 rounded bg-slate-800 flex items-center justify-center border border-white/5">
                            <span className="text-slate-600 text-sm">{user?.location_name || tDashboard('widget_no_location')}</span>
                        </div>
                    </div>

                    {/* 3. Weather (Small Widget) */}
                    <WeatherWidget lat={user?.latitude} lng={user?.longitude} locationName={user?.location_name} />

                    {/* 4. Action Center (Wide) */}
                    <div className="col-span-1 md:col-span-2 row-span-1 rounded-2xl bg-slate-900 border border-white/10 p-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-purple-400">{tDashboard('widget_quick_actions')}</h2>
                            <div className="flex gap-2 mt-3">
                                <Link href="/crops" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm border border-white/5 transition-colors">{tDashboard('action_register_crop')}</Link>
                                <Link href="/marketplace" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm border border-white/5 transition-colors">{tDashboard('action_book_drone')}</Link>
                            </div>
                        </div>
                    </div>

                    {/* 5. Marketplace Feed */}
                    <MarketplaceWidget />

                </div>
            </div>

        </main>
    );
}
