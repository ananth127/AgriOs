'use client';

import { useAuth } from '@/lib/auth-context';
import { usePathname, useRouter } from '@/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/docs', '/auth/login', '/auth/signup', '/', '/verify'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Allow public paths
        const isPublic = PUBLIC_PATHS.some(path => {
            if (path === '/') return pathname === '/';
            return pathname.startsWith(path);
        });

        if (loading) return; // Wait for auth check to finish

        if (!isAuthenticated && !isPublic) {
            router.push('/auth/login');
            setAuthorized(false);
        } else {
            setAuthorized(true);
        }
    }, [isAuthenticated, loading, pathname, router]);

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    // If redirecting, don't show content
    // Check again for render safety? 
    // If not authorized and not public, we are redirecting.
    const isPublic = PUBLIC_PATHS.some(path => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    });

    if (!isAuthenticated && !isPublic) {
        return null;
    }

    return <>{children}</>;
}
