'use client'

import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import { mySchema } from './schema'
import Farmer from './models/Farmer'
import Log from './models/Log'

// LokiJS is an in-memory database that persists to IndexedDB
// Ideally, for a PWA, you might want to configure it for better persistence
const adapter = new LokiJSAdapter({
    schema: mySchema,
    useWebWorker: false, // simpler for now
    useIncrementalIndexedDB: true,
    // onQuotaExceededError: (error) => { ... }
})

export const database = new Database({
    adapter,
    modelClasses: [
        Farmer,
        Log,
    ],
})
