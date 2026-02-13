
'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initAnalytics, trackPageView, trackGlobalClick, setUserLoginStatus, setUserLocation, trackScroll, trackFormInteraction } from '@/lib/analytics';
import { useAuth } from '@/lib/auth-context';

// Map paths to readable Page Names (matching Sidebar)
const PAGE_NAMES: Record<string, string> = {
    '/': 'Overview',
    '/farms': 'My Farms',
    '/crops': 'Crops & Registry',
    '/farm-management': 'Management',
    '/livestock': 'Livestock',
    '/supply-chain': 'Track & Trace',
    '/marketplace': 'Marketplace',
    '/drone': 'Drone AI',
    '/calculator': 'Calculator',
    '/docs': 'Docs',
    '/auth/login': 'Login',
    '/auth/signup': 'Signup'
};

function getPageName(path: string): string {
    // Exact match
    if (PAGE_NAMES[path]) return PAGE_NAMES[path];

    // Prefix match (e.g. /farms/1 -> My Farms)
    // sort by length desc to match longest prefix first
    const sortedKeys = Object.keys(PAGE_NAMES).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (key !== '/' && path.startsWith(key)) {
            return PAGE_NAMES[key];
        }
    }
    return 'Unknown Page';
}

function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        initAnalytics();
    }, []);

    useEffect(() => {
        setUserLoginStatus(isAuthenticated, user);
        if (user?.latitude && user?.longitude && user?.location_name) {
            setUserLocation(user.latitude, user.longitude, user.location_name);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (pathname) {
            const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
            const pageName = getPageName(pathname);

            // Handle locale in path (e.g. /en/farms -> My Farms)
            // If pathname starts with /en, /hi etc, strip it for matching?
            // Assuming next-intl handles generic paths, but raw pathname might include locale.
            // Let's refine matching safely later if needed, for now standard paths.

            trackPageView(url, pageName);
        }
    }, [pathname, searchParams]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const clickable = target.closest('button, a');
            if (clickable) {
                // Get fresh page name on click
                const currentPath = window.location.pathname;
                // Note: window.location.pathname might include locale. 
                // We'll rely on the React pathname passed or recalculate.
                // Simple recalculation:
                // Strip locale if present? standard strategy:
                // /en/farms -> /farms
                let path = currentPath;
                const segments = path.split('/');
                if (segments[1] && segments[1].length === 2) { // rough check for locale
                    path = '/' + segments.slice(2).join('/');
                }
                if (path === '') path = '/'; // root

                const pageName = getPageName(path);
                trackGlobalClick(clickable as HTMLElement, pageName);
            }
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Scroll Tracking
    useEffect(() => {
        let maxScroll = 0;
        const pageName = getPageName(pathname || '/');

        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            if (docHeight <= 0) return;

            const scrollPercent = Math.round((scrollTop / docHeight) * 100);

            // Track milestones: 25, 50, 75, 90
            [25, 50, 75, 90].forEach(milestone => {
                if (scrollPercent >= milestone && maxScroll < milestone) {
                    maxScroll = milestone;
                    trackScroll(pageName, milestone);
                }
            });
        };

        // Throttled scroll listener could be better but basic version for now
        let timeoutId: NodeJS.Timeout;
        const throttledScroll = () => {
            if (timeoutId) return;
            timeoutId = setTimeout(() => {
                handleScroll();
                clearTimeout(timeoutId);
                // @ts-ignore
                timeoutId = null;
            }, 500);
        };

        window.addEventListener('scroll', throttledScroll);
        return () => window.removeEventListener('scroll', throttledScroll);
    }, [pathname]);

    // Form Interaction Tracking (Capture Phase for focus/blur)
    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
                const fieldName = target.getAttribute('name') || target.getAttribute('id') || target.getAttribute('placeholder') || 'unknown_field';
                const pageName = getPageName(window.location.pathname);
                trackFormInteraction(pageName, fieldName, 'focus');
            }
        };

        const handleBlur = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
                const fieldName = target.getAttribute('name') || target.getAttribute('id') || target.getAttribute('placeholder') || 'unknown_field';
                const pageName = getPageName(window.location.pathname);
                trackFormInteraction(pageName, fieldName, 'blur');
            }
        };

        // Use capture phase to catch focus/blur which don't bubble
        window.addEventListener('focus', handleFocus, true);
        window.addEventListener('blur', handleBlur, true);

        return () => {
            window.removeEventListener('focus', handleFocus, true);
            window.removeEventListener('blur', handleBlur, true);
        };
    }, []);

    return null;
}

export default function AnalyticsListener() {
    // Wrap in Suspense because useSearchParams causes client-side de-opt
    return (
        <Suspense fallback={null}>
            <AnalyticsTracker />
        </Suspense>
    );
}
