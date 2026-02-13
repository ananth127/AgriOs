'use client';

import React from 'react';
import { usePathname } from '@/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './Sidebar';
import NavBar from './NavBar';

interface AppShellProps {
    children: React.ReactNode;
    locale: string;
}

export default function AppShell({ children, locale }: AppShellProps) {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();
    const isPublicVerify = pathname.includes('/verify/');
    // If authenticated, we treat /docs as part of the app so users can navigate back.
    const isMarketingPage = ['/features', '/use-cases', '/community', '/auth'].some(route => pathname.startsWith(route)) ||
        (!isAuthenticated && pathname.startsWith('/docs'));
    const isPublicLanding = pathname === '/' && !isAuthenticated;

    if (isPublicVerify || isMarketingPage || isPublicLanding) {
        return (
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 relative">
                {/* No Sidebar, No NavBar */}
                <main id="scrolling-container" className="flex-1 overflow-y-auto relative scroll-smooth">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <>
            <Sidebar locale={locale} />
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 relative">
                {/* NavBar stays at top, essentially 'fixed' relative to content */}
                <NavBar locale={locale} />

                {/* Main Content Area - Scrolls independently */}
                <main id="scrolling-container" className="flex-1 overflow-y-auto relative scroll-smooth">
                    {children}
                </main>
            </div>
        </>
    );
}
