/**
 * Comprehensive Logging System - Type Definitions
 * 
 * Captures all application errors, warnings, and events for AI-powered debugging
 */

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal',
}

export enum LogCategory {
    SYSTEM = 'system',
    NETWORK = 'network',
    USER_ACTION = 'user_action',
    STATE_CHANGE = 'state_change',
    PERFORMANCE = 'performance',
    AUTH = 'auth',
    DATABASE = 'database',
    RENDER = 'render',
}

export interface LogContext {
    // User context
    userId?: string;
    sessionId: string;
    userAgent: string;

    // Page context
    url: string;
    route: string;
    referrer?: string;

    // Device context
    screenWidth: number;
    screenHeight: number;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;

    // App context
    appVersion?: string;
    environment: 'development' | 'production' | 'staging';

    // Timing
    timestamp: string;
    timeInSession: number; // milliseconds since session start
}

export interface NetworkLog {
    method: string;
    url: string;
    status?: number;
    duration?: number; // milliseconds
    requestBody?: any;
    responseBody?: any;
    error?: string;
    headers?: Record<string, string>;
}

export interface UserActionLog {
    action: string; // 'click', 'submit', 'navigate', 'input', etc.
    target: string; // element description
    targetId?: string;
    targetClass?: string;
    value?: any;
    metadata?: Record<string, any>;
}

export interface PerformanceLog {
    metric: string; // 'page_load', 'api_call', 'render', etc.
    duration: number; // milliseconds
    details?: Record<string, any>;
}

export interface ErrorLog {
    message: string;
    stack?: string;
    componentStack?: string; // React component stack
    errorInfo?: any;
    boundary?: string; // Which error boundary caught it
    recoverable: boolean;
}

export interface LogEntry {
    id: string; // Unique log ID
    level: LogLevel;
    category: LogCategory;
    message: string;
    context: LogContext;

    // Optional detailed data based on category
    networkLog?: NetworkLog;
    userActionLog?: UserActionLog;
    performanceLog?: PerformanceLog;
    errorLog?: ErrorLog;

    // Additional metadata
    tags?: string[];
    metadata?: Record<string, any>;

    // Status
    uploaded: boolean;
    uploadAttempts: number;
}

export interface LoggerConfig {
    // Logging levels
    minLevel: LogLevel;
    enabledCategories: LogCategory[];

    // Storage
    useLocalStorage: boolean;
    useRemoteStorage: boolean;
    remoteEndpoint?: string;

    // Batch settings
    batchSize: number;
    batchInterval: number; // milliseconds

    // Privacy
    sanitizeSensitiveData: boolean;
    excludeHeaders?: string[]; // Headers to exclude from network logs
    excludeKeys?: string[]; // Object keys to exclude from all logs

    // Performance
    maxLogsInMemory: number;
    maxLogsInStorage: number;

    // Features
    captureConsole: boolean;
    captureNetwork: boolean;
    captureUserActions: boolean;
    capturePerformance: boolean;
    captureUnhandledErrors: boolean;

    // Environment
    environment: 'development' | 'production' | 'staging';
    enableInProduction: boolean;
}

export interface LogStats {
    totalLogs: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<LogCategory, number>;
    uploadedCount: number;
    failedUploadCount: number;
    oldestLog?: string; // timestamp
    newestLog?: string; // timestamp
}
