'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

// Dynamic imports for major views to split bundle size
const DashboardView = dynamic(() => import('@/components/home/DashboardView'), {
    loading: () => (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
    )
});

const LandingView = dynamic(() => import('@/components/home/LandingView'));

export default function Index({ params: { locale } }: { params: { locale: string } }) {
    const { isAuthenticated, loading } = useAuth();

    // If loading, we want to show something fast.
    // Strategy:
    // 1. If we are authenticated, Show Dashboard (Dynamic will show loader)
    // 2. If we are NOT authenticated, Show Landing (Dynamic)
    // 
    // Problem: 'loading' is true initially for everyone.
    // Solution: Show LandingView by default as the "Skeleton" / "Shell" for the app root.
    // If the user turns out to be logged in, it will swap to DashboardView.
    // This gives instant LCP for guests.

    if (loading) {
        // While checking auth, we can display the Landing Page (as it's the public face)
        // OR a minimal loader. Since the user complained about slowness,
        // showing the Landing Page immediately is the best perceived performance fix.
        // It acts as a "Skeleton" for the guest experience.
        return <LandingView locale={locale} />;
    }

    if (isAuthenticated) {
        return <DashboardView locale={locale} />;
    }

    // Default Guest View
    return <LandingView locale={locale} />;
}
