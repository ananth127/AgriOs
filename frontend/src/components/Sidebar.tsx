'use client';

import { Link, usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Sprout, Tractor, ShoppingBag, ScrollText, Users, Camera, Calculator } from 'lucide-react';

interface SidebarProps {
    locale: string;
}

export function Sidebar({ locale }: SidebarProps) {
    const pathname = usePathname();

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
        <div className="w-64 bg-slate-900 border-r border-white/10 flex-col hidden md:flex h-full">
            <div className="p-6">
                <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                    Agri-OS
                </div>
                <p className="text-xs text-slate-500 mt-1">Universal Farm OS</p>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    // usePathname from navigation.ts returns path WITHOUT locale (e.g. /farms)
                    // We compare it directly to link.href
                    const isActive = pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
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
            </nav>

            <div className="p-4 border-t border-white/10">
                <Link href="/auth/login" className="block">
                    <div className="bg-slate-800 rounded-lg p-3 hover:bg-slate-700 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 group-hover:from-red-500 group-hover:to-orange-500 transition-colors"></div>
                            <div>
                                <div className="text-sm font-medium text-white group-hover:text-red-200">Guest Farmer</div>
                                <div className="text-xs text-slate-500 group-hover:text-red-300/70">Click to Logout</div>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
