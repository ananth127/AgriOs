'use client';

import { ThemeProvider } from 'next-themes';
import NavigationLoader from './NavigationLoader';

export default function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <NavigationLoader />
        </ThemeProvider>
    );
}
