/**
 * Core Logger Implementation
 * 
 * Central logging system for Agri-OS application
 */

import {
    LogLevel,
    LogCategory,
    LogEntry,
    LoggerConfig,
    NetworkLog,
    UserActionLog,
    PerformanceLog,
    ErrorLog,
    LogStats,
} from './types';
import {
    generateLogId,
    buildLogContext,
    sanitizeData,
    formatError,
    truncateString,
} from './utils';
import { logStorage } from './storage';
import { shouldIgnoreError, isDuplicateError } from './config';

class Logger {
    private config: LoggerConfig;
    private logQueue: LogEntry[] = [];
    private uploadInterval: NodeJS.Timeout | null = null;
    private stats: LogStats = {
        totalLogs: 0,
        byLevel: {
            [LogLevel.DEBUG]: 0,
            [LogLevel.INFO]: 0,
            [LogLevel.WARN]: 0,
            [LogLevel.ERROR]: 0,
            [LogLevel.FATAL]: 0,
        },
        byCategory: {
            [LogCategory.SYSTEM]: 0,
            [LogCategory.NETWORK]: 0,
            [LogCategory.USER_ACTION]: 0,
            [LogCategory.STATE_CHANGE]: 0,
            [LogCategory.PERFORMANCE]: 0,
            [LogCategory.AUTH]: 0,
            [LogCategory.DATABASE]: 0,
            [LogCategory.RENDER]: 0,
        },
        uploadedCount: 0,
        failedUploadCount: 0,
    };

    constructor(config?: Partial<LoggerConfig>) {
        this.config = {
            minLevel: LogLevel.INFO,
            enabledCategories: Object.values(LogCategory),
            useLocalStorage: true,
            useRemoteStorage: true,
            remoteEndpoint: process.env.NEXT_PUBLIC_API_URL + '/logs',
            batchSize: 50,
            batchInterval: 30000, // 30 seconds
            sanitizeSensitiveData: true,
            excludeHeaders: ['authorization', 'cookie', 'set-cookie'],
            excludeKeys: [],
            maxLogsInMemory: 100,
            maxLogsInStorage: 1000,
            captureConsole: true,
            captureNetwork: true,
            captureUserActions: true,
            capturePerformance: true,
            captureUnhandledErrors: true,
            environment: (process.env.NODE_ENV as any) || 'development',
            enableInProduction: true,
            ...config,
        };

        this.initialize();
    }

    /**
     * Initialize the logger
     */
    private async initialize(): Promise<void> {
        // Initialize storage
        if (this.config.useLocalStorage) {
            await logStorage.init();
        }

        // Set up console capture
        if (this.config.captureConsole) {
            this.captureConsole();
        }

        // Set up error handlers
        if (this.config.captureUnhandledErrors) {
            this.captureGlobalErrors();
        }

        // Start batch upload interval
        if (this.config.useRemoteStorage && this.config.batchInterval > 0) {
            this.startBatchUpload();
        }

        // Log initialization
        this.info('Logger initialized', LogCategory.SYSTEM, {
            config: this.config,
        });
    }

    /**
     * Core logging method
     */
    private async log(
        level: LogLevel,
        category: LogCategory,
        message: string,
        data?: any
    ): Promise<void> {
        // Check if this log should be captured
        if (!this.shouldLog(level, category)) {
            return;
        }

        // Build log entry
        const logEntry: LogEntry = {
            id: generateLogId(),
            level,
            category,
            message: truncateString(message, 500),
            context: buildLogContext(this.config),
            uploaded: false,
            uploadAttempts: 0,
            metadata: data,
        };

        // Sanitize if needed
        if (this.config.sanitizeSensitiveData) {
            logEntry.metadata = sanitizeData(data, this.config.excludeKeys);
        }

        // Update stats
        this.updateStats(logEntry);

        // Store in memory queue
        this.logQueue.push(logEntry);

        // Trim queue if too large
        if (this.logQueue.length > this.config.maxLogsInMemory) {
            this.logQueue.shift();
        }

        // Store in IndexedDB
        if (this.config.useLocalStorage) {
            try {
                await logStorage.store(logEntry);
            } catch (error) {
                console.error('Failed to store log:', error);
            }
        }

        // Immediate upload for errors in production
        if (
            level === LogLevel.ERROR ||
            level === LogLevel.FATAL
        ) {
            if (this.config.environment === 'production' && this.config.useRemoteStorage) {
                this.uploadLogs([logEntry]);
            }
        }

        // Note: We don't log to console here when captureConsole is enabled
        // because the console interception already calls the original console methods
    }

    /**
     * Check if a log should be captured
     */
    private shouldLog(level: LogLevel, category: LogCategory): boolean {
        // Check log level
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
        const minLevelIndex = levels.indexOf(this.config.minLevel);
        const currentLevelIndex = levels.indexOf(level);

        if (currentLevelIndex < minLevelIndex) {
            return false;
        }

        // Check category
        if (!this.config.enabledCategories.includes(category)) {
            return false;
        }

        // Check environment
        if (
            this.config.environment === 'production' &&
            !this.config.enableInProduction
        ) {
            return false;
        }

        return true;
    }

    /**
     * Update logging statistics
     */
    private updateStats(log: LogEntry): void {
        this.stats.totalLogs++;
        this.stats.byLevel[log.level]++;
        this.stats.byCategory[log.category]++;

        if (!this.stats.oldestLog) {
            this.stats.oldestLog = log.context.timestamp;
        }
        this.stats.newestLog = log.context.timestamp;
    }

    /**
     * Log to native console
     */
    private logToConsole(level: LogLevel, message: string, data?: any): void {
        const consoleMethod = level === LogLevel.DEBUG ? 'debug'
            : level === LogLevel.INFO ? 'info'
                : level === LogLevel.WARN ? 'warn'
                    : 'error';

        if (data) {
            console[consoleMethod](`[${level.toUpperCase()}]`, message, data);
        } else {
            console[consoleMethod](`[${level.toUpperCase()}]`, message);
        }
    }

    // ==========================================================================
    // PUBLIC API - Log Methods
    // ==========================================================================

    /**
     * Log debug message
     */
    debug(message: string, category: LogCategory = LogCategory.SYSTEM, data?: any): void {
        this.log(LogLevel.DEBUG, category, message, data);
    }

    /**
     * Log info message
     */
    info(message: string, category: LogCategory = LogCategory.SYSTEM, data?: any): void {
        this.log(LogLevel.INFO, category, message, data);
    }

    /**
     * Log warning
     */
    warn(message: string, category: LogCategory = LogCategory.SYSTEM, data?: any): void {
        this.log(LogLevel.WARN, category, message, data);
    }

    /**
     * Log error
     */
    error(message: string, category: LogCategory = LogCategory.SYSTEM, error?: any, data?: any): void {
        // Check if this error should be ignored
        const errorLog = formatError(error);
        if (shouldIgnoreError(message, errorLog.stack)) {
            return; // Skip ignored errors
        }

        // Check for duplicates
        if (isDuplicateError(message, errorLog.stack)) {
            return; // Skip duplicate errors
        }

        const fullErrorLog: ErrorLog = {
            ...errorLog,
            message,
            recoverable: true,
        };

        this.log(LogLevel.ERROR, category, message, {
            ...data,
            errorLog: fullErrorLog,
        });
    }

    /**
     * Log fatal error
     */
    fatal(message: string, category: LogCategory = LogCategory.SYSTEM, error?: any, data?: any): void {
        // Check if this error should be ignored
        const errorLog = formatError(error);
        if (shouldIgnoreError(message, errorLog.stack)) {
            return; // Skip ignored errors
        }

        // Fatal errors are always logged (no duplicate check)
        const fullErrorLog: ErrorLog = {
            ...errorLog,
            message,
            recoverable: false,
        };

        this.log(LogLevel.FATAL, category, message, {
            ...data,
            errorLog: fullErrorLog,
        });
    }

    /**
     * Log network request
     */
    logNetwork(networkLog: NetworkLog): void {
        const message = `${networkLog.method} ${networkLog.url} ${networkLog.status || 'pending'}`;

        this.log(LogLevel.INFO, LogCategory.NETWORK, message, {
            networkLog: this.config.sanitizeSensitiveData
                ? sanitizeData(networkLog, this.config.excludeKeys)
                : networkLog,
        });
    }

    /**
     * Log user action
     */
    logUserAction(userActionLog: UserActionLog): void {
        const message = `User ${userActionLog.action}: ${userActionLog.target}`;

        this.log(LogLevel.INFO, LogCategory.USER_ACTION, message, {
            userActionLog,
        });
    }

    /**
     * Log performance metric
     */
    logPerformance(performanceLog: PerformanceLog): void {
        const message = `Performance: ${performanceLog.metric} took ${performanceLog.duration}ms`;

        this.log(LogLevel.INFO, LogCategory.PERFORMANCE, message, {
            performanceLog,
        });
    }

    // ==========================================================================
    // CONSOLE CAPTURE
    // ==========================================================================

    /**
     * Capture and intercept console methods
     */
    private captureConsole(): void {
        if (typeof window === 'undefined') return;

        // Store original console methods
        const originalConsole = {
            error: console.error,
            warn: console.warn,
            info: console.info,
            log: console.log,
            debug: console.debug,
        };

        // Store reference for later use
        (this as any)._originalConsole = originalConsole;

        // Flag to prevent infinite loops
        let isLogging = false;

        // Intercept console.error
        console.error = (...args: any[]) => {
            if (!isLogging) {
                isLogging = true;
                try {
                    this.error(
                        args[0]?.toString() || 'Console error',
                        LogCategory.SYSTEM,
                        args[1],
                        { consoleArgs: args }
                    );
                } finally {
                    isLogging = false;
                }
            }
            originalConsole.error(...args);
        };

        // Intercept console.warn
        console.warn = (...args: any[]) => {
            if (!isLogging) {
                isLogging = true;
                try {
                    this.warn(
                        args[0]?.toString() || 'Console warning',
                        LogCategory.SYSTEM,
                        { consoleArgs: args }
                    );
                } finally {
                    isLogging = false;
                }
            }
            originalConsole.warn(...args);
        };

        // Intercept console.info
        console.info = (...args: any[]) => {
            if (!isLogging) {
                isLogging = true;
                try {
                    this.info(
                        args[0]?.toString() || 'Console info',
                        LogCategory.SYSTEM,
                        { consoleArgs: args }
                    );
                } finally {
                    isLogging = false;
                }
            }
            originalConsole.info(...args);
        };

        // Intercept console.log
        console.log = (...args: any[]) => {
            if (!isLogging) {
                isLogging = true;
                try {
                    this.debug(
                        args[0]?.toString() || 'Console log',
                        LogCategory.SYSTEM,
                        { consoleArgs: args }
                    );
                } finally {
                    isLogging = false;
                }
            }
            originalConsole.log(...args);
        };
    }

    /**
     * Capture global errors and unhandled promise rejections
     */
    private captureGlobalErrors(): void {
        if (typeof window === 'undefined') return;

        // Capture unhandled errors
        window.addEventListener('error', (event) => {
            this.error(
                event.message || 'Unhandled error',
                LogCategory.SYSTEM,
                event.error,
                {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                }
            );
        });

        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error(
                'Unhandled promise rejection',
                LogCategory.SYSTEM,
                event.reason,
                {
                    promise: event.promise,
                }
            );
        });
    }

    // ==========================================================================
    // BATCH UPLOAD
    // ==========================================================================

    /**
     * Start batch upload interval
     */
    private startBatchUpload(): void {
        this.uploadInterval = setInterval(() => {
            this.uploadBatch();
        }, this.config.batchInterval);
    }

    /**
     * Upload a batch of logs
     */
    private async uploadBatch(): Promise<void> {
        if (!this.config.useLocalStorage || !this.config.useRemoteStorage) {
            return;
        }

        try {
            const logs = await logStorage.getUnuploaded(this.config.batchSize);

            if (logs.length === 0) {
                return;
            }

            await this.uploadLogs(logs);
        } catch (error) {
            console.error('Failed to upload log batch:', error);
        }
    }

    /**
     * Upload logs to remote endpoint
     */
    private async uploadLogs(logs: LogEntry[]): Promise<void> {
        if (!this.config.remoteEndpoint) {
            return;
        }

        try {
            const response = await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ logs }),
            });

            if (response.ok) {
                // Mark as uploaded
                const logIds = logs.map(log => log.id);
                await logStorage.markAsUploaded(logIds);
                this.stats.uploadedCount += logs.length;
            } else {
                this.stats.failedUploadCount += logs.length;
            }
        } catch (error) {
            console.error('Failed to upload logs:', error);
            this.stats.failedUploadCount += logs.length;
        }
    }

    // ==========================================================================
    // PUBLIC API - Management Methods
    // ==========================================================================

    /**
     * Get logging statistics
     */
    getStats(): LogStats {
        return { ...this.stats };
    }

    /**
     * Get recent logs
     */
    async getRecentLogs(limit: number = 100): Promise<LogEntry[]> {
        return await logStorage.getAll(limit);
    }

    /**
     * Get logs by level
     */
    async getLogsByLevel(level: LogLevel, limit?: number): Promise<LogEntry[]> {
        return await logStorage.getByLevel(level, limit);
    }

    /**
     * Clear all logs
     */
    async clearLogs(): Promise<void> {
        this.logQueue = [];
        await logStorage.clearAll();
        this.resetStats();
    }

    /**
     * Reset statistics
     */
    private resetStats(): void {
        this.stats = {
            totalLogs: 0,
            byLevel: {
                [LogLevel.DEBUG]: 0,
                [LogLevel.INFO]: 0,
                [LogLevel.WARN]: 0,
                [LogLevel.ERROR]: 0,
                [LogLevel.FATAL]: 0,
            },
            byCategory: {
                [LogCategory.SYSTEM]: 0,
                [LogCategory.NETWORK]: 0,
                [LogCategory.USER_ACTION]: 0,
                [LogCategory.STATE_CHANGE]: 0,
                [LogCategory.PERFORMANCE]: 0,
                [LogCategory.AUTH]: 0,
                [LogCategory.DATABASE]: 0,
                [LogCategory.RENDER]: 0,
            },
            uploadedCount: 0,
            failedUploadCount: 0,
        };
    }

    /**
     * Destroy the logger and clean up
     */
    destroy(): void {
        if (this.uploadInterval) {
            clearInterval(this.uploadInterval);
            this.uploadInterval = null;
        }

        logStorage.close();
    }
}

// Create singleton instance
let loggerInstance: Logger | null = null;

export function getLogger(config?: Partial<LoggerConfig>): Logger {
    if (!loggerInstance) {
        loggerInstance = new Logger(config);
    }
    return loggerInstance;
}

export { Logger };
export default getLogger();
