'use client';

import { ThemeProvider } from 'next-themes';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import NavigationLoader from './NavigationLoader';
import dynamic from 'next/dynamic';

const ServerWakeupIndicator = dynamic(() => import('./ServerWakeupIndicator'), { ssr: false });

export default function GlobalProviders({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Global default: Cache for 5 minutes, stale after 1 minute
                staleTime: 60 * 1000,
                gcTime: 5 * 60 * 1000,
                refetchOnWindowFocus: false, // Don't refetch on window focus to save bandwidth
                retry: 1
            }
        }
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                {children}
                <NavigationLoader />
                <ServerWakeupIndicator />
            </ThemeProvider>
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </QueryClientProvider>
    );
}
