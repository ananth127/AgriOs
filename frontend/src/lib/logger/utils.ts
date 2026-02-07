/**
 * Logger Utility Functions
 */

import { LogContext, LoggerConfig } from './types';

/**
 * Generate a unique ID for each log entry
 */
export function generateLogId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a session ID (stored in sessionStorage)
 */
export function getSessionId(): string {
    if (typeof window === 'undefined') return 'server-session';

    let sessionId = sessionStorage.getItem('app_session_id');
    if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('app_session_id', sessionId);
    }
    return sessionId;
}

/**
 * Get session start time
 */
export function getSessionStartTime(): number {
    if (typeof window === 'undefined') return Date.now();

    let sessionStart = sessionStorage.getItem('app_session_start');
    if (!sessionStart) {
        sessionStart = Date.now().toString();
        sessionStorage.setItem('app_session_start', sessionStart);
    }
    return parseInt(sessionStart, 10);
}

/**
 * Detect device type based on screen width
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

/**
 * Parse user agent to get browser and OS info
 */
export function parseUserAgent(ua: string): { browser: string; os: string } {
    // Simple parsing - can be enhanced with a library like ua-parser-js
    const browser = ua.includes('Chrome') ? 'Chrome'
        : ua.includes('Firefox') ? 'Firefox'
            : ua.includes('Safari') ? 'Safari'
                : ua.includes('Edge') ? 'Edge'
                    : 'Unknown';

    const os = ua.includes('Windows') ? 'Windows'
        : ua.includes('Mac') ? 'macOS'
            : ua.includes('Linux') ? 'Linux'
                : ua.includes('Android') ? 'Android'
                    : ua.includes('iOS') ? 'iOS'
                        : 'Unknown';

    return { browser, os };
}

/**
 * Build log context from current environment
 */
export function buildLogContext(config: LoggerConfig): LogContext {
    if (typeof window === 'undefined') {
        return {
            sessionId: 'server-session',
            userAgent: 'server',
            url: '',
            route: '',
            screenWidth: 0,
            screenHeight: 0,
            deviceType: 'desktop',
            os: 'server',
            browser: 'server',
            environment: config.environment,
            timestamp: new Date().toISOString(),
            timeInSession: 0,
        };
    }

    const { browser, os } = parseUserAgent(window.navigator.userAgent);
    const sessionStart = getSessionStartTime();

    return {
        userId: getUserId(),
        sessionId: getSessionId(),
        userAgent: window.navigator.userAgent,
        url: window.location.href,
        route: window.location.pathname,
        referrer: document.referrer || undefined,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        deviceType: getDeviceType(),
        os,
        browser,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
        environment: config.environment,
        timestamp: new Date().toISOString(),
        timeInSession: Date.now() - sessionStart,
    };
}

/**
 * Get user ID from localStorage or session
 */
function getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;

    // Try to get from localStorage (if user is logged in)
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            return user.id || user.email || user.username;
        }
    } catch (e) {
        // Ignore parsing errors
    }

    return undefined;
}

/**
 * Sanitize sensitive data from objects
 */
export function sanitizeData(
    data: any,
    excludeKeys: string[] = []
): any {
    if (!data || typeof data !== 'object') return data;

    const defaultExcludeKeys = [
        'password',
        'token',
        'secret',
        'apiKey',
        'api_key',
        'authorization',
        'auth',
        'credit_card',
        'creditCard',
        'ssn',
        'social_security',
    ];

    const keysToExclude = [...defaultExcludeKeys, ...excludeKeys];

    const sanitize = (obj: any): any => {
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }

        if (obj && typeof obj === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                const lowerKey = key.toLowerCase();
                const shouldExclude = keysToExclude.some(excludeKey =>
                    lowerKey.includes(excludeKey.toLowerCase())
                );

                if (shouldExclude) {
                    sanitized[key] = '[REDACTED]';
                } else {
                    sanitized[key] = sanitize(value);
                }
            }
            return sanitized;
        }

        return obj;
    };

    return sanitize(data);
}

/**
 * Format error for logging
 */
export function formatError(error: any): {
    message: string;
    stack?: string;
    name?: string;
} {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
    }

    if (typeof error === 'string') {
        return { message: error };
    }

    return {
        message: JSON.stringify(error),
    };
}

/**
 * Truncate large strings to prevent excessive log sizes
 */
export function truncateString(str: string, maxLength: number = 1000): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '... [TRUNCATED]';
}

/**
 * Calculate log size in bytes
 */
export function calculateLogSize(log: any): number {
    return new Blob([JSON.stringify(log)]).size;
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): {
    used: number;
    available: number;
    percentage: number;
} | null {
    if (typeof navigator === 'undefined' || !navigator.storage) {
        return null;
    }

    // Note: This is async, so we can't use it synchronously
    // Return null for now, can be enhanced later
    return null;
}
