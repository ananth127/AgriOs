import { API_BASE_URL } from './constants';

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const requestCache = new Map<string, { data: any; timestamp: number }>();

async function fetchAPI<T>(endpoint: string, method: RequestMethod = "GET", body?: any, useCache: boolean = true): Promise<T> {
    const headers = {
        "Content-Type": "application/json",
    };

    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    const cacheKey = `${endpoint}`;

    // 1. Return cached data if available and valid (only for GET)
    if (useCache && method === "GET") {
        const cached = requestCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log(`⚡ Serving from cache: ${endpoint}`);
            return cached.data;
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        const data = await response.json();

        // 2. Store in cache (only for GET)
        if (useCache && method === "GET") {
            requestCache.set(cacheKey, { data, timestamp: Date.now() });
        }

        // 3. Invalidate cache on mutations (POST/PUT/DELETE) to ensure freshness
        if (method !== "GET") {
            requestCache.clear(); // Simple strategy: clear all on any write to avoid stale state.
            console.log("🧹 Cache cleared due to mutation");
        }

        return data;

    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
}

export const api = {
    // Utilities for manual cache management
    invalidateCache: () => {
        requestCache.clear();
        console.log("🧹 Cache manually cleared");
    },
    invalidateEndpoint: (endpoint: string) => {
        requestCache.delete(endpoint);
        console.log(`🧹 Cache cleared for: ${endpoint}`);
    },

    registry: {
        create: (data: any) => fetchAPI("/registry/", "POST", data),
        get: (name: string) => fetchAPI(`/registry/${name}`),
        list: () => fetchAPI("/registry/"),
    },
    farms: {
        create: (data: any) => fetchAPI("/farms/", "POST", data),
        list: () => fetchAPI("/farms/"),
        get: (id: number) => fetchAPI(`/farms/${id}`),
        update: (id: number, data: any) => fetchAPI(`/farms/${id}`, "PUT", data),
        delete: (id: number) => fetchAPI(`/farms/${id}`, "DELETE"),
    },
    prophet: {
        predict: (data: any) => fetchAPI("/prophet/predict", "POST", data),
    },
    drone: {
        analyze: (data: any) => fetchAPI("/drone/analyze", "POST", data),
    },
    marketplace: {
        search: (lat: number, lon: number) => fetchAPI(`/marketplace/search?lat=${lat}&lon=${lon}`),
        registerProvider: (data: any) => fetchAPI("/marketplace/providers", "POST", data),
        list: () => fetchAPI("/marketplace/listings/"),
        products: {
            list: (filters?: { category?: string; listing_type?: string; search?: string }, options?: { forceRefresh?: boolean }) => {
                const params = new URLSearchParams();
                if (filters?.category) params.append('category', filters.category);
                if (filters?.listing_type) params.append('listing_type', filters.listing_type);
                if (filters?.search) params.append('search', filters.search);
                return fetchAPI(`/marketplace/products/?${params.toString()}`, "GET", undefined, !options?.forceRefresh);
            },
            create: (data: any) => fetchAPI("/marketplace/products", "POST", data),
            update: (id: number, data: any) => fetchAPI(`/marketplace/products/${id}`, "PUT", data),
            delete: (id: number) => fetchAPI(`/marketplace/products/${id}`, "DELETE"),
        },
        commercial: {
            list: (filters?: { ingredient?: string; category?: string }) => {
                const params = new URLSearchParams();
                if (filters?.ingredient) params.append('ingredient', filters.ingredient);
                if (filters?.category) params.append('category', filters.category);
                return fetchAPI(`/marketplace/commercial-products?${params.toString()}`);
            }
        },
        orders: {
            create: (data: any) => fetchAPI("/marketplace/orders", "POST", data),
        },
        // Legacy support if needed, or remove duplicate list
        listProducts: (options?: { forceRefresh?: boolean }) => fetchAPI("/marketplace/products/", "GET", undefined, !options?.forceRefresh),
    },
    crops: {
        plant: (data: any) => fetchAPI("/crops/", "POST", data),
        list: (farmId: number) => fetchAPI(`/crops/farm/${farmId}`),
        update: (id: number, data: any) => fetchAPI(`/crops/${id}`, "PUT", data),
        delete: (id: number) => fetchAPI(`/crops/${id}`, "DELETE"),
    },
    livestock: {
        list: (farmId: number) => fetchAPI(`/livestock/farm/${farmId}`),
        register: (data: any) => fetchAPI("/livestock/", "POST", data),
        update: (id: number, data: any) => fetchAPI(`/livestock/${id}`, "PUT", data),
        delete: (id: number) => fetchAPI(`/livestock/${id}`, "DELETE"),
    },
    supplyChain: {
        getBatch: (id: string) => fetchAPI(`/supply-chain/batches/${id}`),
        getAllBatches: () => fetchAPI("/supply-chain/batches"),
        createBatch: (data: any) => fetchAPI("/supply-chain/batches", "POST", data),
        addEvent: (batchId: string, data: any) => fetchAPI(`/supply-chain/batches/${batchId}/events`, "POST", data),
    },
    voice: {
        query: (audioBlob: string) => fetchAPI("/voice-search/query", "POST", { audio_data: audioBlob }),
    },
    farmManagement: {
        // Loans
        createLoan: (data: any) => fetchAPI("/farm-management/loans", "POST", data),
        getLoans: (farmId: number) => fetchAPI(`/farm-management/loans/${farmId}`),

        // Inventory
        addInventory: (data: any) => fetchAPI("/farm-management/inventory", "POST", data),
        getInventory: (farmId: number) => fetchAPI(`/farm-management/inventory/${farmId}`),
        updateInventory: (id: number, data: any) => fetchAPI(`/farm-management/inventory/${id}`, "PUT", data),
        deleteInventory: (id: number) => fetchAPI(`/farm-management/inventory/${id}`, "DELETE"),

        // Assets
        addAsset: (data: any) => fetchAPI("/farm-management/assets", "POST", data),
        getAssets: (farmId: number) => fetchAPI(`/farm-management/assets/${farmId}`),
        updateAsset: (id: number, data: any) => fetchAPI(`/farm-management/assets/${id}`, "PUT", data),
        deleteAsset: (id: number) => fetchAPI(`/farm-management/assets/${id}`, "DELETE"),

        // Suggestions
        getFertilizerSuggestion: (farmId: number, crop: string) => fetchAPI(`/farm-management/suggestions/fertilizer?farm_id=${farmId}&crop_name=${crop}`),
        getPesticideSuggestion: (farmId: number, crop: string, disease: string) => fetchAPI(`/farm-management/suggestions/pesticide?farm_id=${farmId}&crop_name=${crop}&disease=${disease}`),

        // Timeline & Activities
        logActivity: (data: any) => fetchAPI("/farm-management/activities", "POST", data),
        getTimeline: (cropCycleId: number) => fetchAPI(`/farm-management/timeline/${cropCycleId}`),

        // Financials
        getFinancials: (farmId: number) => fetchAPI(`/farm-management/financials/${farmId}`),

        // Labor
        postJob: (data: any) => fetchAPI("/farm-management/labor/jobs", "POST", data),
        getJobs: (farmId: number) => fetchAPI(`/farm-management/labor/jobs?farm_id=${farmId}`),
        deleteJob: (id: number) => fetchAPI(`/farm-management/labor/jobs/${id}`, "DELETE"),
        acceptApplication: (appId: number) => fetchAPI(`/farm-management/labor/applications/${appId}/accept`, "POST"),
    }
};