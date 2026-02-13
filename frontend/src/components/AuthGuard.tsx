
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from '@/navigation';
import { Loader2 } from 'lucide-react';
import AppPreview from '@/components/AppPreview';

const PUBLIC_PATHS = ['/docs', '/auth/login', '/auth/signup', '/', '/features', '/use-cases', '/verify', '/marketplace', '/calculator', '/community', '/crop-doctor'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter(); // Auto-redirect needs router
    const { isAuthenticated, loading } = useAuth();
    const pathname = usePathname();

    // specific routes that logged-in users should NOT access
    const GUEST_ONLY_PATHS = ['/auth/login', '/auth/signup'];

    const isGuestOnly = GUEST_ONLY_PATHS.some(path => pathname.startsWith(path));

    const isPublic = PUBLIC_PATHS.some(path => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    });

    useEffect(() => {
        // Redirect authenticated users away from guest pages (Login/Signup)
        if (!loading && isAuthenticated && isGuestOnly) {
            router.push('/');
        }
    }, [loading, isAuthenticated, isGuestOnly, router]);

    // Optimization: Render Public Pages (like Landing) IMMEDIATELY
    // Do not block on auth loading state. This improves First Contentful Paint (FCP).
    // The page components themselves handle loading states if needed (e.g. Header buttons).
    if (isPublic) {
        return <>{children}</>;
    }

    // Universal Loader: Wait for auth check ONLY for protected routes.
    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    // Case 1: Authenticated User -> Show the actual App
    if (isAuthenticated) {
        return <>{children}</>;
    }



    // Case 3: Unauthenticated & Protected Route -> Show "App Preview" (SEO Friendly)
    // Instead of redirecting to login, we show a preview of what's behind the wall.
    return <AppPreview pathname={pathname} />;
}
