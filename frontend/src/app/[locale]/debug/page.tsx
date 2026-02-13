/**
 * Debug Page - View Application Logs
 * 
 * Access at: http://localhost:3000/en/debug
 */

'use client';

import React, { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { LogEntry, LogLevel } from '@/lib/logger/types';

export default function DebugPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const recentLogs = await logger.getRecentLogs(50);
            const logStats = logger.getStats();

            setLogs(recentLogs);
            setStats(logStats);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        if (confirm('Clear all logs?')) {
            await logger.clearLogs();
            loadData();
        }
    };

    const exportLogs = async () => {
        const allLogs = await logger.getRecentLogs(1000);
        const dataStr = JSON.stringify(allLogs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs-${new Date().toISOString()}.json`;
        link.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading logs...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            🔍 Application Debug Console
                        </h1>
                        <div className="flex gap-2">
                            <button
                                onClick={loadData}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                🔄 Refresh
                            </button>
                            <button
                                onClick={exportLogs}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                📥 Export
                            </button>
                            <button
                                onClick={clearLogs}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                🗑️ Clear
                            </button>
                        </div>
                    </div>

                    {/* Statistics */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Total Logs</div>
                                <div className="text-3xl font-bold text-blue-600">
                                    {stats.totalLogs}
                                </div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Errors</div>
                                <div className="text-3xl font-bold text-red-600">
                                    {stats.byLevel.error + stats.byLevel.fatal}
                                </div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Warnings</div>
                                <div className="text-3xl font-bold text-yellow-600">
                                    {stats.byLevel.warn}
                                </div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-sm text-gray-600">Info</div>
                                <div className="text-3xl font-bold text-green-600">
                                    {stats.byLevel.info}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">⚡ Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={async () => {
                                const errors = await logger.getLogsByLevel(LogLevel.ERROR);
                                console.log('🔴 All Errors:', errors);
                                alert(`Found ${errors.length} errors. Check console (F12)`);
                            }}
                            className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 text-left"
                        >
                            <div className="font-semibold text-red-700">View All Errors</div>
                            <div className="text-sm text-gray-600">Logged to console</div>
                        </button>

                        <button
                            onClick={() => {
                                logger.error('Test error from debug page', 'system' as any, new Error('This is a test error'));
                                alert('Test error logged! Refresh to see it.');
                            }}
                            className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 text-left"
                        >
                            <div className="font-semibold text-orange-700">Create Test Error</div>
                            <div className="text-sm text-gray-600">Test the logging system</div>
                        </button>

                        <button
                            onClick={async () => {
                                const allLogs = await logger.getRecentLogs(1000);
                                console.log('📊 All Logs:', allLogs);
                                alert(`Showing ${allLogs.length} logs in console (F12)`);
                            }}
                            className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 text-left"
                        >
                            <div className="font-semibold text-blue-700">View All Logs</div>
                            <div className="text-sm text-gray-600">Logged to console</div>
                        </button>
                    </div>
                </div>

                {/* Recent Logs */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        📝 Recent Logs ({logs.length})
                    </h2>

                    {logs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No logs yet. Logs will appear here as errors occur.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {logs.map((log) => (
                                <details
                                    key={log.id}
                                    className={`border rounded p-3 ${log.level === 'error' || log.level === 'fatal'
                                            ? 'bg-red-50 border-red-200'
                                            : log.level === 'warn'
                                                ? 'bg-yellow-50 border-yellow-200'
                                                : 'bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <summary className="cursor-pointer font-medium">
                                        <span
                                            className={`inline-block px-2 py-1 rounded text-xs mr-2 ${log.level === 'error' || log.level === 'fatal'
                                                    ? 'bg-red-600 text-white'
                                                    : log.level === 'warn'
                                                        ? 'bg-yellow-600 text-white'
                                                        : 'bg-blue-600 text-white'
                                                }`}
                                        >
                                            {log.level.toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {new Date(log.context.timestamp).toLocaleString()}
                                        </span>
                                        {' - '}
                                        {log.message}
                                    </summary>
                                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                                        {JSON.stringify(log, null, 2)}
                                    </pre>
                                </details>
                            ))}
                        </div>
                    )}
                </div>

                {/* Backend Logs Info */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">
                        💡 Backend Logs Location
                    </h3>
                    <p className="text-sm text-blue-800 mb-2">
                        All logs are also stored on the backend for permanent storage and AI analysis:
                    </p>
                    <code className="block bg-blue-100 p-2 rounded text-sm">
                        backend/logs/errors-{new Date().toISOString().split('T')[0]}.jsonl
                    </code>
                    <p className="text-xs text-blue-700 mt-2">
                        View with: <code>cat backend/logs/errors-*.jsonl</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
