'use client';

import React from 'react';
import { usePathname } from '@/navigation';
import { Sidebar } from './Sidebar';
import NavBar from './NavBar';

interface AppShellProps {
    children: React.ReactNode;
    locale: string;
}

export default function AppShell({ children, locale }: AppShellProps) {
    const pathname = usePathname();
    const isPublicVerify = pathname.includes('/verify/');

    if (isPublicVerify) {
        return (
            <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative h-screen">
                {/* No Sidebar, No NavBar */}
                <main className="flex-1 overflow-y-auto relative scroll-smooth">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <>
            <Sidebar locale={locale} />
            <div className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
                {/* NavBar stays at top, essentially 'fixed' relative to content */}
                <NavBar locale={locale} />

                {/* Main Content Area - Scrolls independently */}
                <main className="flex-1 overflow-y-auto relative scroll-smooth">
                    {children}
                </main>
            </div>
        </>
    );
}
