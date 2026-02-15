'use client';

import { Link, usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Sprout, Tractor, ShoppingBag, ScrollText, Users, Camera, Calculator, LogIn, Stethoscope, Activity, BookOpen, RefreshCw, Cpu, Newspaper, Briefcase, MessageCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { syncData } from '@/db/sync';
import { useTranslations } from 'next-intl';
import { trackSidebarClick, trackAuthEvent } from '@/lib/analytics';
import { startNavigationProgress } from '@/components/NavigationLoader';
import { useConnectionHealth } from '@/hooks/useConnectionHealth';

interface SidebarProps {
    locale: string;
}

export function Sidebar({ locale }: SidebarProps) {
    const t = useTranslations('Sidebar');
    const tGlobal = useTranslations('Global');
    const tAuth = useTranslations('Auth');
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuth();

    // Connection States from Hook
    const { isOnline, frontendSignalStrength, isBackendHealthy, backendSignalStrength, connectionWarning } = useConnectionHealth();

    const links = [
        { href: '/', label: t('menu_overview'), icon: LayoutDashboard },
        { href: '/chat', label: t('menu_chat'), icon: MessageSquare },
        { href: '/feed', label: t('menu_daily_updates'), icon: Newspaper },
        { href: '/community', label: t('menu_community'), icon: MessageCircle },
        { href: '/smart-monitor', label: t('menu_smart_monitor'), icon: Activity },
        { href: '/farms', label: t('menu_my_farms'), icon: Tractor },
        { href: '/crops', label: t('menu_crops_registry'), icon: Sprout },
        { href: '/farm-management', label: t('menu_management'), icon: Briefcase },
        { href: '/crop-doctor', label: t('menu_crop_doctor'), icon: Stethoscope },
        // { href: '/library', label: t('menu_library'), icon: BookOpen }, // Merged into Crop Doctor page as tabs
        { href: '/livestock', label: t('menu_livestock'), icon: Users },
        { href: '/supply-chain', label: t('menu_track_trace'), icon: ScrollText },
        { href: '/marketplace', label: t('menu_marketplace'), icon: ShoppingBag },
        { href: '/drone', label: t('menu_drone_ai'), icon: Camera },
        { href: '/devices', label: t('menu_smart_devices'), icon: Cpu },
        { href: '/calculator', label: t('menu_calculator'), icon: Calculator },
        { href: '/docs', label: t('menu_docs'), icon: BookOpen },
    ];

    return (
        <div className="w-64 xl:w-72 shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex-col hidden md:flex h-full shadow-2xl relative z-40 transition-colors duration-300">
            <div className="p-8 pb-6">
                <div className="flex items-center gap-3">
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-500 dark:to-teal-600 bg-clip-text text-transparent tracking-tight">
                        {tGlobal('app_name')}
                    </div>
                    {/* Status Indicators */}
                    <div className="flex flex-col justify-center gap-[2px] ml-2 mb-1">
                        {/* Frontend Status */}
                        <div className="flex items-center gap-1.5" title={`${tGlobal('frontend')}: ${isOnline ? tGlobal('online') : tGlobal('offline')} (${frontendSignalStrength}/5)`}>
                            <span className="text-[9px] font-bold text-slate-500 w-3 text-right">F</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", isOnline ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]")} />
                            {/* Bars */}
                            <div className="flex items-end gap-[1px] h-2">
                                {[1, 2, 3, 4, 5].map(bar => (
                                    <div key={`f-${bar}`} className={cn("w-[2px] rounded-[1px] transition-all", frontendSignalStrength >= bar ? "bg-green-500" : "bg-slate-800")} style={{ height: `${bar * 20}%` }} />
                                ))}
                            </div>
                        </div>

                        {/* Backend Status */}
                        <div className="flex items-center gap-1.5" title={`${tGlobal('backend')}: ${isBackendHealthy ? tGlobal('online') : tGlobal('offline')} (${backendSignalStrength}/5)`}>
                            <span className="text-[9px] font-bold text-slate-500 w-3 text-right">B</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", isBackendHealthy ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]")} />
                            {/* Bars */}
                            <div className="flex items-end gap-[1px] h-2">
                                {[1, 2, 3, 4, 5].map(bar => (
                                    <div key={`b-${bar}`} className={cn("w-[2px] rounded-[1px] transition-all", backendSignalStrength >= bar ? "bg-green-500" : "bg-slate-800")} style={{ height: `${bar * 20}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Sync Button */}
                    <button
                        onClick={async () => {
                            try {
                                const btn = document.getElementById('sync-btn-icon');
                                if (btn) btn.classList.add('animate-spin');
                                await syncData();
                                setTimeout(() => alert("Sync Complete!"), 500);
                            } catch (e) {
                                console.error(e);
                                alert("Sync Failed");
                            } finally {
                                const btn = document.getElementById('sync-btn-icon');
                                if (btn) btn.classList.remove('animate-spin');
                            }
                        }}
                        className="ml-auto p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Sync Data"
                    >
                        <RefreshCw id="sync-btn-icon" className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-1.5 uppercase tracking-widest pl-0.5">{tGlobal('app_tagline')}</p>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                {links.map((link) => {
                    const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => {
                                trackSidebarClick(link.label, link.href);
                                if (link.href !== pathname) {
                                    startNavigationProgress();
                                }
                            }}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-green-100/50 text-green-700 dark:bg-green-500/10 dark:text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)] border border-green-200/60 dark:border-green-500/20"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-500 rounded-r-full shadow-lg shadow-green-500/30" />
                            )}
                            <link.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300")} />
                            <span className="relative z-10">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Connection Warning Toast */}
            {
                connectionWarning && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] bg-red-500/90 text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-xl backdrop-blur-md z-50 text-center animate-in fade-in slide-in-from-top-2 border border-red-400/50">
                        {connectionWarning}
                    </div>
                )
            }

            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/30 transition-colors duration-300">
                {isAuthenticated ? (
                    <Link href="/profile" className="block">
                        <div
                            className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl p-3.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-green-500/30 transition-all cursor-pointer group shadow-lg"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-teal-600 p-[1px] shadow-lg shadow-green-900/20">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-sm font-bold text-slate-800 dark:text-white uppercase">
                                        {user?.full_name?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                        {user?.full_name || tAuth('guest_user')}
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 group-hover:text-green-500/70 flex items-center gap-1 transition-colors">
                                        {t('profile_view')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <Link href="/auth/login" className="block">
                        <div className="bg-slate-800 rounded-lg p-3 hover:bg-green-500/10 hover:border-green-500/30 border border-transparent transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                    <LogIn className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white group-hover:text-green-300 transition-colors">{tAuth('sign_in')}</div>
                                    <div className="text-xs text-slate-500 group-hover:text-green-400/70">{tAuth('access_account')}</div>
                                </div>
                            </div>
                        </div>
                    </Link>
                )}
            </div>
        </div >
    );
}
