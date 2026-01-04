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
    },
    crops: {
        plant: (data: any) => fetchAPI("/crops/", "POST", data),
        list: (farmId: number) => fetchAPI(`/crops/farm/${farmId}`),
    },
    livestock: {
        list: (farmId: number) => fetchAPI(`/livestock/farm/${farmId}`),
        register: (data: any) => fetchAPI("/livestock/", "POST", data),
    },
    supplyChain: {
        getBatch: (id: string) => fetchAPI(`/supply-chain/batches/${id}`),
        createBatch: (data: any) => fetchAPI("/supply-chain/batches", "POST", data),
        addEvent: (batchId: string, data: any) => fetchAPI(`/supply-chain/batches/${batchId}/events`, "POST", data),
    },
    voice: {
        query: (audioBlob: string) => fetchAPI("/voice-search/query", "POST", { audio_data: audioBlob }),
    }
};