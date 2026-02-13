import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from './index'

export async function syncData() {
    await synchronize({
        database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
            const urlParams = new URLSearchParams({
                last_pulled_at: lastPulledAt ? lastPulledAt.toString() : '0',
                schema_version: schemaVersion.toString(),
            })

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync/pull?${urlParams}`)
                if (!response.ok) {
                    throw new Error(await response.text())
                }

                const { changes, timestamp } = await response.json()
                return { changes, timestamp }
            } catch (error) {
                console.error("Sync Pull Failed:", error)
                throw error
            }
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sync/push`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ changes, last_pulled_at: lastPulledAt }),
                })

                if (!response.ok) {
                    throw new Error(await response.text())
                }
            } catch (error) {
                console.error("Sync Push Failed:", error)
                throw error
            }
        },
        migrationsEnabledAtVersion: 1,
    })
}
