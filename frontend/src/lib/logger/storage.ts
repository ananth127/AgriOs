/**
 * Log Storage Manager
 * 
 * Handles storing logs in IndexedDB for persistence and offline support
 */

import { LogEntry } from './types';

const DB_NAME = 'AgriOS_Logs';
const DB_VERSION = 1;
const STORE_NAME = 'logs';

class LogStorage {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize IndexedDB
     */
    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined') {
                resolve();
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

                    // Create indexes for efficient querying
                    store.createIndex('timestamp', 'context.timestamp', { unique: false });
                    store.createIndex('level', 'level', { unique: false });
                    store.createIndex('category', 'category', { unique: false });
                    store.createIndex('uploaded', 'uploaded', { unique: false });
                }
            };
        });

        return this.initPromise;
    }

    /**
     * Store a log entry
     */
    async store(log: LogEntry): Promise<void> {
        await this.init();

        if (!this.db) {
            console.warn('IndexedDB not available, storing in memory only');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(log);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Store multiple log entries
     */
    async storeBatch(logs: LogEntry[]): Promise<void> {
        await this.init();

        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            let completed = 0;
            let hasError = false;

            logs.forEach(log => {
                const request = store.add(log);

                request.onsuccess = () => {
                    completed++;
                    if (completed === logs.length && !hasError) {
                        resolve();
                    }
                };

                request.onerror = () => {
                    hasError = true;
                    reject(request.error);
                };
            });
        });
    }

    /**
     * Get all logs that haven't been uploaded
     */
    async getUnuploaded(limit?: number): Promise<LogEntry[]> {
        await this.init();

        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('uploaded');

            const results: LogEntry[] = [];
            let count = 0;

            // Use a cursor to filter by uploaded=false
            const request = index.openCursor();

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;

                if (cursor) {
                    // Check if the uploaded field is false (or null/undefined)
                    if (cursor.value.uploaded === false || !cursor.value.uploaded) {
                        results.push(cursor.value);
                        count++;

                        // Stop if we've reached the limit
                        if (limit && count >= limit) {
                            resolve(results);
                            return;
                        }
                    }

                    cursor.continue();
                } else {
                    // No more entries
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Mark logs as uploaded
     */
    async markAsUploaded(logIds: string[]): Promise<void> {
        await this.init();

        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            let completed = 0;
            let hasError = false;

            logIds.forEach(id => {
                const getRequest = store.get(id);

                getRequest.onsuccess = () => {
                    const log = getRequest.result;
                    if (log) {
                        log.uploaded = true;
                        log.uploadAttempts++;

                        const putRequest = store.put(log);

                        putRequest.onsuccess = () => {
                            completed++;
                            if (completed === logIds.length && !hasError) {
                                resolve();
                            }
                        };

                        putRequest.onerror = () => {
                            hasError = true;
                            reject(putRequest.error);
                        };
                    } else {
                        completed++;
                        if (completed === logIds.length && !hasError) {
                            resolve();
                        }
                    }
                };

                getRequest.onerror = () => {
                    hasError = true;
                    reject(getRequest.error);
                };
            });
        });
    }

    /**
     * Get logs by level
     */
    async getByLevel(level: string, limit?: number): Promise<LogEntry[]> {
        await this.init();

        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('level');
            const request = index.getAll(IDBKeyRange.only(level), limit);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all logs
     */
    async getAll(limit?: number): Promise<LogEntry[]> {
        await this.init();

        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll(undefined, limit);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Count total logs
     */
    async count(): Promise<number> {
        await this.init();

        if (!this.db) return 0;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear old logs (keep only recent ones)
     */
    async clearOldLogs(keepCount: number): Promise<void> {
        await this.init();

        if (!this.db) return;

        const allLogs = await this.getAll();

        if (allLogs.length <= keepCount) return;

        // Sort by timestamp (oldest first)
        allLogs.sort((a, b) =>
            new Date(a.context.timestamp).getTime() - new Date(b.context.timestamp).getTime()
        );

        // Delete oldest logs
        const logsToDelete = allLogs.slice(0, allLogs.length - keepCount);
        await this.deleteLogs(logsToDelete.map(log => log.id));
    }

    /**
     * Delete specific logs
     */
    async deleteLogs(logIds: string[]): Promise<void> {
        await this.init();

        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            let completed = 0;
            let hasError = false;

            logIds.forEach(id => {
                const request = store.delete(id);

                request.onsuccess = () => {
                    completed++;
                    if (completed === logIds.length && !hasError) {
                        resolve();
                    }
                };

                request.onerror = () => {
                    hasError = true;
                    reject(request.error);
                };
            });
        });
    }

    /**
     * Clear all logs
     */
    async clearAll(): Promise<void> {
        await this.init();

        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Close the database connection
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initPromise = null;
        }
    }
}

export const logStorage = new LogStorage();
