/**
 * Logger Configuration
 * 
 * Adjust these settings to control log volume
 */

import { LogLevel, LogCategory } from './types';

export const loggerConfig = {
    // ========================================
    // LOG LEVEL CONTROL
    // ========================================

    // In development: capture everything
    development: {
        minLevel: LogLevel.DEBUG,
        enabledCategories: [
            LogCategory.SYSTEM,
            LogCategory.NETWORK,
            LogCategory.USER_ACTION,
            LogCategory.STATE_CHANGE,
            LogCategory.PERFORMANCE,
            LogCategory.AUTH,
            LogCategory.DATABASE,
            LogCategory.RENDER,
        ],
        captureConsole: true,
        captureNetwork: true,
    },

    // In production: only important logs
    production: {
        minLevel: LogLevel.WARN, // Only warnings and errors
        enabledCategories: [
            LogCategory.SYSTEM,
            LogCategory.NETWORK,
            LogCategory.AUTH,
            LogCategory.DATABASE,
        ],
        captureConsole: true,
        captureNetwork: true,
    },

    // ========================================
    // STORAGE LIMITS
    // ========================================

    maxLogsInMemory: 100,       // Reduce from default 100
    maxLogsInStorage: 500,      // Reduce from default 1000
    batchInterval: 60000,       // Upload every 60s (instead of 30s)

    // ========================================
    // ERROR DEDUPLICATION
    // ========================================

    // Skip duplicate errors within this time window (ms)
    deduplicationWindow: 5000, // 5 seconds

    // ========================================
    // FILTERING
    // ========================================

    // Ignore these error messages (useful for third-party errors)
    ignoreErrors: [
        'ResizeObserver loop',
        'Non-Error promise rejection',
        'Unprocessable Content', // Livestock seeding errors
        'recursivelyTraversePassiveMountEffects', // React dev noise
        'commitPassiveMountOnFiber', // React dev noise
        'Tracking Prevention blocked access', // Browser privacy feature
        // Add patterns to ignore
    ],

    // Ignore errors from these sources
    ignoreSources: [
        'chrome-extension://',
        'moz-extension://',
        'react-dom.development.js', // React dev stack traces
        // Add browser extension URLs
    ],
};

/**
 * Check if an error should be ignored
 */
export function shouldIgnoreError(message: string, source?: string): boolean {
    // Check message patterns
    if (loggerConfig.ignoreErrors.some(pattern =>
        message.toLowerCase().includes(pattern.toLowerCase())
    )) {
        return true;
    }

    // Check source patterns
    if (source && loggerConfig.ignoreSources.some(pattern =>
        source.includes(pattern)
    )) {
        return true;
    }

    return false;
}

/**
 * Simple deduplication cache
 */
const errorCache = new Map<string, number>();

export function isDuplicateError(message: string, stack?: string): boolean {
    const key = `${message}-${stack?.substring(0, 100)}`;
    const lastSeen = errorCache.get(key);
    const now = Date.now();

    if (lastSeen && (now - lastSeen) < loggerConfig.deduplicationWindow) {
        return true; // Duplicate within window
    }

    errorCache.set(key, now);

    // Clean old entries
    if (errorCache.size > 1000) {
        const oldestKey = errorCache.keys().next().value;
        if (oldestKey !== undefined) {
            errorCache.delete(oldestKey);
        }
    }

    return false;
}
