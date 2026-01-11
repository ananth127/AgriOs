
'use client';

import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
    LayoutDashboard, Sprout, Tractor, ShoppingBag, ScrollText, Users, Camera, Menu, X, Calculator, LogIn, LogOut, Briefcase, Stethoscope, BookOpen
} from 'lucide-react';
import { useConnectionHealth } from '@/hooks/useConnectionHealth';



export default function NavBar({ locale }: { locale: string }) {
    const tSidebar = useTranslations('Sidebar');
    const tGlobal = useTranslations('Global');
    const tAuth = useTranslations('Auth');

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { isAuthenticated, user, logout } = useAuth();

    // Connection Health
    const { isOnline, frontendSignalStrength, isBackendHealthy, backendSignalStrength, connectionWarning } = useConnectionHealth();

    const links = [
        { href: '/', label: tSidebar('menu_overview'), icon: LayoutDashboard },
        { href: '/farms', label: tSidebar('menu_my_farms'), icon: Tractor },
        { href: '/crops', label: tSidebar('menu_crops_registry'), icon: Sprout },
        { href: '/farm-management', label: tSidebar('menu_management'), icon: Briefcase },
        { href: '/crop-doctor', label: tSidebar('menu_crop_doctor'), icon: Stethoscope },
        { href: '/library', label: tSidebar('menu_library'), icon: BookOpen },
        { href: '/livestock', label: tSidebar('menu_livestock'), icon: Users },
        { href: '/supply-chain', label: tSidebar('menu_track_trace'), icon: ScrollText },
        { href: '/marketplace', label: tSidebar('menu_marketplace'), icon: ShoppingBag },
        { href: '/drone', label: tSidebar('menu_drone_ai'), icon: Camera },
        { href: '/calculator', label: tSidebar('menu_calculator'), icon: Calculator },
        { href: '/docs', label: tSidebar('menu_docs'), icon: Users },
    ];

    return (
        <nav className="z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 text-white w-full md:hidden">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <div className="flex flex-col">
                        <div className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent leading-none">
                            {tGlobal('app_name')}
                        </div>
                        {/* Mobile Signal Indicators */}
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1" title={`${tGlobal('frontend')}: ${isOnline ? tGlobal('online') : tGlobal('offline')}`}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
                                <div className="flex items-end gap-[1px] h-1.5">
                                    {[1, 2, 3, 4, 5].map(bar => (
                                        <div key={`f-${bar}`} className={cn("w-[1.5px] rounded-[1px]", frontendSignalStrength >= bar ? "bg-green-500" : "bg-slate-800")} style={{ height: `${bar * 20}%` }} />
                                    ))}
                                </div>
                            </div>
                            <div className="w-[1px] h-2 bg-slate-700 mx-0.5"></div>
                            <div className="flex items-center gap-1" title={`${tGlobal('backend')}: ${isBackendHealthy ? tGlobal('online') : tGlobal('offline')}`}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", isBackendHealthy ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
                                <div className="flex items-end gap-[1px] h-1.5">
                                    {[1, 2, 3, 4, 5].map(bar => (
                                        <div key={`b-${bar}`} className={cn("w-[1.5px] rounded-[1px]", backendSignalStrength >= bar ? "bg-green-500" : "bg-slate-800")} style={{ height: `${bar * 20}%` }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <LanguageSwitcher locale={locale} />
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl animate-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto">
                    <div className="p-4 space-y-1">
                        {links.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-gradient-to-r from-green-500/20 to-green-500/5 text-green-400 border border-green-500/20 shadow-lg shadow-green-900/10"
                                            : "text-slate-400 hover:bg-white/5 hover:text-slate-100 border border-transparent"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                        isActive ? "bg-green-500/20" : "bg-slate-800/50 group-hover:bg-slate-700"
                                    )}>
                                        <link.icon className="w-4 h-4" />
                                    </div>
                                    <span className="flex-1">{link.label}</span>
                                </Link>
                            );
                        })}

                        <div className="pt-4 border-t border-white/10 mt-2">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 transition-colors group text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                                        {user?.full_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white group-hover:text-red-300">{user?.full_name}</div>
                                        <div className="text-xs text-slate-500 group-hover:text-red-400 flex items-center gap-1">
                                            <LogOut className="w-3 h-3" /> {tAuth('logout')}
                                        </div>
                                    </div>
                                </button>
                            ) : (
                                <Link
                                    href="/auth/login"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                        <LogIn className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white group-hover:text-green-300">{tAuth('sign_in')}</div>
                                        <div className="text-xs text-slate-500 group-hover:text-green-400">{tAuth('access_account')}</div>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Mobile Connection Warning Toast */}
            {connectionWarning && (
                <div className="absolute top-[70px] left-1/2 -translate-x-1/2 w-[90%] bg-red-500/90 text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-xl backdrop-blur-md z-50 text-center animate-in fade-in slide-in-from-top-2 border border-red-400/50">
                    {connectionWarning}
                </div>
            )}
        </nav>
    );
}
