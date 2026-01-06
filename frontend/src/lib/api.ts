import { API_BASE_URL } from './constants';

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

async function fetchAPI<T>(endpoint: string, method: RequestMethod = "GET", body?: any): Promise<T> {
    const headers = {
        "Content-Type": "application/json",
    };

    const config: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
}

export const api = {
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
            list: () => fetchAPI("/marketplace/products/"),
            create: (data: any) => fetchAPI("/marketplace/products", "POST", data),
            update: (id: number, data: any) => fetchAPI(`/marketplace/products/${id}`, "PUT", data),
            delete: (id: number) => fetchAPI(`/marketplace/products/${id}`, "DELETE"),
        },
        // Legacy support if needed, or remove duplicate list
        listProducts: () => fetchAPI("/marketplace/products/"),
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