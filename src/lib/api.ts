import {clearAuth, getAccessToken} from "./auth.js";
import config from "./config.js";
import {ApiError, AuthError} from "./error.js";
import {JSONObject} from "./types.js";

let rid = 0;

function getRid() {
    return `${++rid}`;
}

export async function apiRequest(
    endpoint: string,
    data?: JSONObject,
    method: "GET" | "POST" = "GET",
) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.fbweb.timeout);
    try {
        const url = new URL(endpoint, config.fbweb.baseEndpointUrl);
        url.searchParams.set("rid", getRid());
        if (data) url.searchParams.set("data", JSON.stringify(data));

        // NOTE: Currently all cases are sending the data in the query
        const accessToken = await getAccessToken();
        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            signal: controller.signal,
        });

        // stop the timeout immediately
        clearTimeout(timeoutId);

        if (!response.ok) {
            const details = await response.text();

            const message = `Error calling FileFlex api endpoint ${endpoint}`;
            if (response.status === 401 || response.status === 403) {
                const message = `Not authorized calling FbWeb api endpoint ${endpoint}. Reconnect the MCP in order to authorize again.`;

                // clear the auth token
                clearAuth();

                throw new AuthError(
                    config.verbose
                        ? `${message} : ${response.status}, ${details}`
                        : message,
                    response.status,
                    details,
                );
            }
            throw new ApiError(
                config.verbose
                    ? `${message} : ${response.status}, ${details}`
                    : message,
                response.status,
                details,
            );
        }

        return response.json();
    } catch (error: unknown) {
        // stop the timeout immediately
        clearTimeout(timeoutId);

        // rethrow if already ApiError
        if (error instanceof ApiError) {
            throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
            throw new ApiError(
                `Request timeout after ${config.fbweb.timeout}ms when calling FileFlex API endpoint ${endpoint}`,
            );
        }

        let message = error instanceof Error ? error.message : String(error);
        if (config.verbose && error instanceof Error)
            message = `${error.message} - ${error.stack}`;

        throw new ApiError(
            `Network error when calling FileFlex API endpoint ${endpoint}: ${message}`,
        );
    }
}
