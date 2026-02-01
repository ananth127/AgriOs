'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Stop loading when path changes
        setIsLoading(false);
        setProgress(100);
        const timer = setTimeout(() => setProgress(0), 500);
        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    useEffect(() => {
        if (isLoading) {
            setProgress(30);
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 500);
            return () => clearInterval(timer);
        }
    }, [isLoading]);

    // Listen for custom event to start loading
    useEffect(() => {
        const handleStart = () => {
            setIsLoading(true);
            setProgress(30);
        };
        window.addEventListener('navigation-start', handleStart);
        return () => window.removeEventListener('navigation-start', handleStart);
    }, []);

    if (progress === 0) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-[3px] z-[110] pointer-events-none">
            <div
                className="h-full bg-green-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(34,197,94,0.7)]"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

export const startNavigationProgress = () => {
    // Dispatch custom event
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('navigation-start'));
    }
};
