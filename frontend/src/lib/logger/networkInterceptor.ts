/**
 * Network Request Interceptor
 * 
 * Automatically logs all fetch requests and responses
 */

import logger from './index';
import { NetworkLog, LogCategory } from './types';

// Store original fetch
const originalFetch = typeof window !== 'undefined' ? window.fetch : fetch;

/**
 * Intercept and log all fetch requests
 */
export function interceptNetworkRequests(): void {
    if (typeof window === 'undefined') return;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const startTime = Date.now();
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const method = init?.method || 'GET';

        const networkLog: NetworkLog = {
            method,
            url,
            headers: init?.headers as Record<string, string>,
            requestBody: init?.body ? tryParse(init.body) : undefined,
        };

        try {
            const response = await originalFetch(input, init);
            const duration = Date.now() - startTime;

            // Clone response to read body without consuming it
            const clonedResponse = response.clone();
            let responseBody;

            try {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    responseBody = await clonedResponse.json();
                } else {
                    responseBody = await clonedResponse.text();
                }
            } catch (e) {
                responseBody = '[Unable to parse response]';
            }

            // Update network log
            networkLog.status = response.status;
            networkLog.duration = duration;
            networkLog.responseBody = responseBody;

            // Log the request
            logger.logNetwork(networkLog);

            // Log errors (4xx, 5xx)
            if (response.status >= 400) {
                logger.error(
                    `Network request failed: ${method} ${url}`,

                    LogCategory.NETWORK,
                    undefined,
                    { networkLog }
                );
            }

            return response;
        } catch (error) {
            const duration = Date.now() - startTime;

            networkLog.duration = duration;
            networkLog.error = error instanceof Error ? error.message : String(error);

            logger.error(
                `Network request error: ${method} ${url}`,

                LogCategory.NETWORK,
                error,
                { networkLog }
            );

            throw error;
        }
    };
}

/**
 * Try to parse body content
 */
function tryParse(body: BodyInit): any {
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch {
            return body;
        }
    }

    if (body instanceof FormData) {
        const data: Record<string, any> = {};
        body.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    }

    return '[Binary data]';
}

/**
 * Restore original fetch
 */
export function restoreNetworkRequests(): void {
    if (typeof window !== 'undefined') {
        window.fetch = originalFetch;
    }
}
