/**
 * Logger Initialization Hook for Next.js
 * 
 * Use this in your _app.tsx or layout.tsx to initialize logging
 */

'use client';

import { useEffect } from 'react';
import { getLogger } from './index';
import { interceptNetworkRequests } from './networkInterceptor';
import { LogCategory } from './types';

export function useLogger() {
    useEffect(() => {
        // Initialize logger
        const logger = getLogger({
            environment: (process.env.NODE_ENV as any) || 'development',
            enableInProduction: true,
            minLevel: process.env.NODE_ENV === 'production' ? 'warn' as any : 'debug' as any,
            remoteEndpoint: process.env.NEXT_PUBLIC_API_URL + '/logs',
        });

        // Expose logger to window for console access
        if (typeof window !== 'undefined') {
            (window as any).__logger = logger;
            console.log('💡 Logger available at: window.__logger');
            console.log('📊 Try: window.__logger.getStats()');
            console.log('📝 Try: window.__logger.getRecentLogs(10)');
        }

        // Intercept network requests
        if (logger) {
            interceptNetworkRequests();
        }

        // Log initialization
        logger.info('Application loaded', LogCategory.SYSTEM, {
            userAgent: navigator.userAgent,
            url: window.location.href,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
        });

        // Log page performance
        if (window.performance) {
            const perfData = window.performance.getEntriesByType('navigation')[0] as any;
            if (perfData) {
                logger.logPerformance({
                    metric: 'page_load',
                    duration: perfData.loadEventEnd - perfData.fetchStart,
                    details: {
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
                        domInteractive: perfData.domInteractive - perfData.fetchStart,
                    },
                });
            }
        }

        // Cleanup on unmount
        return () => {
            logger.destroy();
        };
    }, []);
}

/**
 * Simple component version if you prefer
 */
export function LoggerProvider({ children }: { children: React.ReactNode }) {
    useLogger();
    return <>{children}</>;
}
