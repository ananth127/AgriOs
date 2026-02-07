/**
 * Log Viewer Component
 * 
 * Visual interface for viewing and filtering logs
 * Add this to your admin/debug page
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import logger from './index';
import { LogEntry, LogLevel, LogCategory } from './types';

export default function LogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<{
        level?: LogLevel;
        category?: LogCategory;
        search?: string;
    }>({});
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);



    const loadLogs = useCallback(async () => {
        setLoading(true);
        try {
            let allLogs = await logger.getRecentLogs(200);

            // Apply filters
            if (filter.level) {
                allLogs = allLogs.filter(log => log.level === filter.level);
            }
            if (filter.category) {
                allLogs = allLogs.filter(log => log.category === filter.category);
            }
            if (filter.search) {
                const search = filter.search.toLowerCase();
                allLogs = allLogs.filter(log =>
                    log.message.toLowerCase().includes(search) ||
                    JSON.stringify(log.metadata).toLowerCase().includes(search)
                );
            }

            setLogs(allLogs);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    const loadStats = useCallback(() => {
        setStats(logger.getStats());
    }, []);

    useEffect(() => {
        loadLogs();
        loadStats();
    }, [loadLogs, loadStats]);

    const clearAllLogs = async () => {
        if (confirm('Are you sure you want to clear all logs?')) {
            await logger.clearLogs();
            loadLogs();
            loadStats();
        }
    };

    const exportLogs = () => {
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs-${new Date().toISOString()}.json`;
        link.click();
    };

    const getLevelColor = (level: LogLevel) => {
        switch (level) {
            case LogLevel.DEBUG: return 'text-gray-600';
            case LogLevel.INFO: return 'text-blue-600';
            case LogLevel.WARN: return 'text-yellow-600';
            case LogLevel.ERROR: return 'text-red-600';
            case LogLevel.FATAL: return 'text-red-900 font-bold';
            default: return 'text-gray-600';
        }
    };

    const getLevelBg = (level: LogLevel) => {
        switch (level) {
            case LogLevel.DEBUG: return 'bg-gray-100';
            case LogLevel.INFO: return 'bg-blue-50';
            case LogLevel.WARN: return 'bg-yellow-50';
            case LogLevel.ERROR: return 'bg-red-50';
            case LogLevel.FATAL: return 'bg-red-100';
            default: return 'bg-gray-50';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Application Logs
                        </h1>
                        <div className="flex gap-2">
                            <button
                                onClick={loadLogs}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={exportLogs}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Export
                            </button>
                            <button
                                onClick={clearAllLogs}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded">
                                <div className="text-sm text-gray-600">Total Logs</div>
                                <div className="text-2xl font-bold">{stats.totalLogs}</div>
                            </div>
                            <div className="bg-red-50 p-4 rounded">
                                <div className="text-sm text-gray-600">Errors</div>
                                <div className="text-2xl font-bold text-red-600">
                                    {stats.byLevel.error + stats.byLevel.fatal}
                                </div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded">
                                <div className="text-sm text-gray-600">Warnings</div>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {stats.byLevel.warn}
                                </div>
                            </div>
                            <div className="bg-green-50 p-4 rounded">
                                <div className="text-sm text-gray-600">Uploaded</div>
                                <div className="text-2xl font-bold text-green-600">
                                    {stats.uploadedCount}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Level
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                value={filter.level || ''}
                                onChange={(e) => setFilter({ ...filter, level: e.target.value as LogLevel || undefined })}
                            >
                                <option value="">All Levels</option>
                                {Object.values(LogLevel).map(level => (
                                    <option key={level} value={level}>{level.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                value={filter.category || ''}
                                onChange={(e) => setFilter({ ...filter, category: e.target.value as LogCategory || undefined })}
                            >
                                <option value="">All Categories</option>
                                {Object.values(LogCategory).map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                placeholder="Search logs..."
                                value={filter.search || ''}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Logs List */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        Logs ({logs.length})
                    </h2>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No logs found</div>
                    ) : (
                        <div className="space-y-2">
                            {logs.map((log) => (
                                <details
                                    key={log.id}
                                    className={`border rounded ${getLevelBg(log.level)}`}
                                >
                                    <summary className="cursor-pointer p-4 hover:bg-gray-100">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${getLevelColor(log.level)}`}>
                                                        [{log.level.toUpperCase()}]
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {log.category}
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        {new Date(log.context.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-gray-900">
                                                    {log.message}
                                                </div>
                                            </div>
                                        </div>
                                    </summary>

                                    <div className="p-4 bg-gray-50 border-t">
                                        <pre className="text-xs overflow-auto">
                                            {JSON.stringify(log, null, 2)}
                                        </pre>
                                    </div>
                                </details>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
