'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import {
    Leaf, Menu, X, LayoutDashboard, Tractor, Sprout, Briefcase,
    Stethoscope, BookOpen, Users, ScrollText, ShoppingBag, Camera, Calculator
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { cn } from '@/lib/utils';

export default function PublicHeader({ locale }: { locale?: string }) {
    const tAuth = useTranslations('Auth');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const appLinks = [
        { href: '/', label: 'Overview', icon: LayoutDashboard },
        { href: '/features', label: 'Features', icon: Tractor },
        { href: '/use-cases', label: 'Use Cases', icon: Briefcase },
        { href: '/docs', label: 'Docs', icon: BookOpen },
    ];

    return (
        <>
            <header className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Icon - Always Visible on Mobile, Left Side */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>

                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/20">
                                <Leaf className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white hidden xs:block">Agri-OS</span>
                        </div>
                    </div>

                    {/* Desktop Nav - Marketing Links */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Overview</Link>
                        <Link href="/features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</Link>
                        <Link href="/use-cases" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Use Cases</Link>
                        <Link href="/docs" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Docs</Link>
                    </nav>

                    {/* Right Side: Auth & Language */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-3">
                            <Link href="/auth/login" className="text-sm font-bold text-white hover:text-green-400 transition-colors">
                                {tAuth('login_button')}
                            </Link>
                            <Link href="/auth/signup" className="px-4 py-2 bg-white text-slate-950 font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-lg shadow-white/5 text-sm">
                                {tAuth('signup_button')}
                            </Link>
                        </div>
                        {/* Language Switcher */}
                        <LanguageSwitcher locale={locale || 'en'} />
                    </div>
                </div>
            </header>

            {/* Mobile Menu Side Drawer */}
            <div className={`fixed inset-0 z-[9999] md:hidden transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setIsMenuOpen(false)}
                />

                {/* Drawer */}
                <div className={`absolute top-0 left-0 w-[85vw] max-w-[320px] h-full bg-slate-950 border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950">
                        <span className="text-xl font-bold text-white">Agri-OS</span>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* App Links Sections */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="mb-6">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Menu</h4>
                            <div className="space-y-1">
                                {appLinks.map((link) => (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <link.icon className="w-5 h-5" />
                                        <span className="font-medium text-sm">{link.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 bg-slate-900/30 space-y-3">
                        <Link href="/auth/login" className="flex items-center justify-center w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-colors" onClick={() => setIsMenuOpen(false)}>
                            {tAuth('login_button')}
                        </Link>
                        <Link href="/auth/signup" className="flex items-center justify-center w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 shadow-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                            {tAuth('signup_button')}
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
