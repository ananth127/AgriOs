'use client';

import { ThemeProvider } from 'next-themes';
import NavigationLoader from './NavigationLoader';
import dynamic from 'next/dynamic';

const ServerWakeupIndicator = dynamic(() => import('./ServerWakeupIndicator'), { ssr: false });

export default function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <NavigationLoader />
            <ServerWakeupIndicator />
        </ThemeProvider>
    );
}
