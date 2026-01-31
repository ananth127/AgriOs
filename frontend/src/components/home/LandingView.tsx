'use client';

import React from 'react';
import { Link } from '@/navigation';
import PublicHeader from '@/components/PublicHeader';
import { useTranslations } from 'next-intl';
import { ArrowRight, Sprout, ScanLine, Users, Tractor, ShoppingBag } from 'lucide-react';
import FeaturesSection from './sections/FeaturesSection';
import UseCasesSection from './sections/UseCasesSection';
import DocsSection from './sections/DocsSection';

export default function LandingView({ locale }: { locale: string }) {
    const tDashboard = useTranslations('Dashboard');
    const tAuth = useTranslations('Auth');

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-green-500/30 overflow-x-hidden transition-colors duration-300">
            <PublicHeader locale={locale} />

            {/* Hero Section */}
            <div className="relative pt-10 pb-20 px-6 flex flex-col items-center justify-center text-center">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-green-500/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="z-10 max-w-4xl mt-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-xs font-semibold text-green-600 dark:text-green-400 mb-6">
                        <Sprout className="w-3 h-3" />
                        <span>v2.0 Now Available</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent mb-6 leading-tight">
                        {tDashboard('hero_title_part1')} <span className="text-green-500 dark:text-green-400">{tDashboard('hero_title_part2')}</span>
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        {tDashboard('hero_subtitle')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/signup" className="px-8 py-4 bg-green-500 hover:bg-green-400 text-white dark:text-slate-950 font-bold rounded-xl transition-all hover:scale-105 flex items-center gap-2 justify-center shadow-xl shadow-green-900/20">
                            {tAuth('signup_button')} <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/auth/login" className="px-8 py-4 bg-white/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-semibold rounded-xl border border-slate-200 dark:border-white/10 transition-all hover:scale-105 flex items-center gap-2 justify-center shadow-sm dark:shadow-none">
                            {tAuth('login_button')} <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                {/* Quick Feature Grid for SEO */}
                <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full">
                    <FeatureLink href="/crop-doctor" icon={<ScanLine />} label="AI Crop Doctor" />
                    <FeatureLink href="/livestock" icon={<Users />} label="Livestock Mgmt" />
                    <FeatureLink href="/farm-management" icon={<Tractor />} label="Farm Ops" />
                    <FeatureLink href="/marketplace" icon={<ShoppingBag />} label="Marketplace" />
                </div>
            </div>

            {/* Sections */}
            <FeaturesSection />
            <UseCasesSection />
            <DocsSection />
        </main>
    );
}

// Helper for Feature Links
function FeatureLink({ href, icon, label }: any) {
    return (
        <Link href={href} className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 hover:border-green-500/30 transition-colors flex flex-col items-center gap-3 group shadow-sm dark:shadow-none">
            <div className="text-slate-500 dark:text-slate-400 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors">{icon}</div>
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{label}</span>
        </Link>
    )
}
