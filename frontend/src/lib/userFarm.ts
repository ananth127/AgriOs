import { api } from './api';

let cachedFarmId: number | null = null;

/**
 * Get the current user's primary farm ID
 * This is cached to avoid repeated API calls
 */
export async function getUserFarmId(): Promise<number> {
    if (cachedFarmId !== null) {
        return cachedFarmId;
    }

    try {
        const response = await api.farmManagement.getUserFarmId();
        cachedFarmId = response.farm_id;
        return cachedFarmId;
    } catch (error) {
        console.error('Failed to get user farm ID:', error);
        // Fallback to 1 for backward compatibility, but this should be handled better
        return 1;
    }
}

/**
 * Clear the cached farm ID (useful after logout)
 */
export function clearFarmIdCache() {
    cachedFarmId = null;
}
