'use client';

import { ThemeProvider } from 'next-themes';
import NavigationLoader from './NavigationLoader';
import ServerWakeupIndicator from './ServerWakeupIndicator';

export default function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <NavigationLoader />
            <ServerWakeupIndicator />
        </ThemeProvider>
    );
}
