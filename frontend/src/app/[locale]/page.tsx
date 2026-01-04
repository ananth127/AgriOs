import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import dynamic from 'next/dynamic';

const ProphetWidget = dynamic(() => import('@/components/dashboard/ProphetWidget'), { ssr: false });
const WeatherWidget = dynamic(() => import('@/components/dashboard/WeatherWidget'), { ssr: false });
const MarketplaceWidget = dynamic(() => import('@/components/dashboard/MarketplaceWidget'), { ssr: false });

export default function Index({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Index');

    return (
        <main className="min-h-screen bg-slate-950 text-white selection:bg-green-500/30">

            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                <header className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        {t('title')}
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Your Universal Agricultural Operating System</p>
                </header>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">

                    {/* 1. Prophet Engine (Large Widget) */}
                    <ProphetWidget />

                    {/* 2. Farm Map (Small Widget) */}
                    <div className="col-span-1 row-span-1 rounded-2xl bg-slate-900 border border-white/10 p-6 flex flex-col group hover:border-blue-500/50 transition-colors">
                        <h2 className="text-lg font-semibold mb-2 text-blue-400">My Farm</h2>
                        <div className="flex-1 rounded bg-slate-800 flex items-center justify-center border border-white/5">
                            <span className="text-slate-600 text-sm">Nasik HQ</span>
                        </div>
                    </div>

                    {/* 3. Weather (Small Widget) */}
                    <WeatherWidget />

                    {/* 4. Action Center (Wide) */}
                    <div className="col-span-1 md:col-span-2 row-span-1 rounded-2xl bg-slate-900 border border-white/10 p-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-purple-400">Quick Actions</h2>
                            <div className="flex gap-2 mt-3">
                                <Link href="/crops" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm border border-white/5 transition-colors">Register Crop</Link>
                                <Link href="/marketplace" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm border border-white/5 transition-colors">Book Drone</Link>
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
