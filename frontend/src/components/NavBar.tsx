
'use client';

import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
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
        <>
            <nav className="z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white w-full sticky top-0 transition-colors duration-300 shadow-sm shadow-slate-200/50 dark:shadow-none">
                <div className="flex items-center justify-between p-4 h-16">
                    <div className="flex items-center gap-3 md:hidden">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-white"
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

                    {/* Desktop Placeholder to balance the flex justify-between if needed, or just let Language Switcher sit right */}
                    <div className="hidden md:flex items-center pl-4">
                        {/* Potential Page Title could go here */}
                    </div>

                    <div className="flex gap-4 items-center">
                        <ThemeToggle />
                        <LanguageSwitcher locale={locale} />
                    </div>
                </div>

                {/* Secondary Sub-Navigation */}
                {!isAuthenticated && (
                    <div className="border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm transition-colors duration-300">
                        <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto px-4 py-2 scrollbar-none md:justify-center">
                            <Link href="/features" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 whitespace-nowrap transition-colors">Features</Link>
                            <Link href="/use-cases" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 whitespace-nowrap transition-colors">Use Cases</Link>
                            <Link href="/community" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 whitespace-nowrap transition-colors">Community</Link>
                            <Link href="/docs" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 whitespace-nowrap transition-colors">Docs</Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Mobile Menu Side Drawer */}
            <div className={`fixed inset-0 z-[9999] md:hidden transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMenuOpen(false)}
                />

                {/* Drawer */}
                <div className={`absolute top-0 left-0 w-[85vw] max-w-[320px] h-full bg-slate-950 border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                    {/* Drawer Header */}
                    <div className="p-6 pb-4 border-b border-white/5 flex flex-col gap-4 bg-slate-950">
                        <div className="flex justify-between items-center">
                            <div className="text-2xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent tracking-tight">
                                {tGlobal('app_name')}
                            </div>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Mobile User Profile Summary (Inside Drawer Header) */}
                        {isAuthenticated && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate">{user?.full_name}</div>
                                    <div className="text-xs text-slate-400 truncate">{user?.role || 'Farmer'}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Scrollable Links */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                        {links.map((link) => {
                            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                        isActive
                                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                            : "text-slate-400 hover:bg-slate-900 hover:text-slate-100 border border-transparent"
                                    )}
                                >
                                    <link.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-green-400" : "text-slate-500 group-hover:text-slate-300")} />
                                    <span className="flex-1">{link.label}</span>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Drawer Footer */}
                    <div className="p-4 border-t border-white/5 bg-slate-900/30">
                        {isAuthenticated ? (
                            <button
                                onClick={() => { logout(); setIsMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/30 transition-all font-medium"
                            >
                                <LogOut className="w-5 h-5" />
                                {tAuth('logout')}
                            </button>
                        ) : (
                            <Link
                                href="/auth/login"
                                className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-500 shadow-lg shadow-green-900/20 transition-all"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <LogIn className="w-5 h-5" />
                                {tAuth('sign_in')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            {/* Mobile Connection Warning Toast */}
            {connectionWarning && (
                <div className="absolute top-[70px] left-1/2 -translate-x-1/2 w-[90%] bg-red-500/90 text-white text-[10px] font-medium px-3 py-2 rounded-lg shadow-xl backdrop-blur-md z-50 text-center animate-in fade-in slide-in-from-top-2 border border-red-400/50">
                    {connectionWarning}
                </div>
            )}
        </>
    );
}
