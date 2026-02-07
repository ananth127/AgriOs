'use client'

import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import { mySchema } from './schema'
import Farmer from './models/Farmer'
import Log from './models/Log'

// LokiJS is an in-memory database that persists to IndexedDB
// Ideally, for a PWA, you might want to configure it for better persistence
// Initialize DB only on client side to avoid server-side execution/logs
let database: Database

if (typeof window !== 'undefined') {
    const adapter = new LokiJSAdapter({
        schema: mySchema,
        useWebWorker: false, // simpler for now
        useIncrementalIndexedDB: true,
        // onQuotaExceededError: (error) => { ... }
    })

    database = new Database({
        adapter,
        modelClasses: [
            Farmer,
            Log,
        ],
    })
} else {
    // Server-side dummy export to prevent import errors
    database = null as unknown as Database
}

export { database }
