
'use client';

import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
    LayoutDashboard, Sprout, Tractor, ShoppingBag, ScrollText, Users, Camera, Menu, X, Calculator, LogIn, LogOut
} from 'lucide-react';

export default function NavBar({ locale }: { locale: string }) {
    const t = useTranslations('Index');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const { isAuthenticated, user, logout } = useAuth();

    const links = [
        { href: '/', label: 'Overview', icon: LayoutDashboard },
        { href: '/farms', label: 'My Farms', icon: Tractor },
        { href: '/crops', label: 'Crops & Registry', icon: Sprout },
        { href: '/livestock', label: 'Livestock', icon: Users },
        { href: '/supply-chain', label: 'Track & Trace', icon: ScrollText },
        { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
        { href: '/drone', label: 'Drone AI', icon: Camera },
        { href: '/calculator', label: 'Calculator', icon: Calculator },
        { href: '/docs', label: 'Docs', icon: Users },
    ];

    return (
        <nav className="z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 text-white w-full">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <div className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                        Agri-OS
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <LanguageSwitcher locale={locale} />
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-white/10 shadow-2xl animate-in slide-in-from-top-2">
                    <div className="p-4 space-y-2">
                        {links.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                    )}
                                >
                                    <link.icon className="w-5 h-5" />
                                    {link.label}
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
                                            <LogOut className="w-3 h-3" /> Logout
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
                                        <div className="text-sm font-medium text-white group-hover:text-green-300">Sign In</div>
                                        <div className="text-xs text-slate-500 group-hover:text-green-400">Access Account</div>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
