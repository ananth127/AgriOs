import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'farmers',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'phone', type: 'string', isIndexed: true },
                { name: 'location', type: 'string', isOptional: true },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
        tableSchema({
            name: 'logs',
            columns: [
                { name: 'content', type: 'string' },
                { name: 'type', type: 'string' }, // e.g., 'activity', 'photo', 'scan'
                { name: 'farmer_id', type: 'string', isIndexed: true },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
                { name: 'is_synced', type: 'boolean' },
            ],
        }),
    ]
})
