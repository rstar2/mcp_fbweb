import config from "./config.js";
import {getAccessToken, reloadAuth} from "./auth.js";
import {ApiError} from "./error.js";
import {JSONObject} from "./types.js";
import {log} from "./log.js";

const maxAuthRetries = 2;
let rid = 0;


function getRid() {
    return `${++rid}`;
}

export async function apiRequest(
    endpoint: string,
    data?: JSONObject,
    method: "GET" | "POST" = "GET",
) {
    return tryApiRequest(endpoint, data, method);
}

async function tryApiRequest(
    endpoint: string,
    data?: JSONObject,
    method: "GET" | "POST" = "GET",
    tryCount = 1,
) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.fbweb.timeout);
    try {
        const url = new URL(endpoint, config.fbweb.baseEndpointUrl);
        url.searchParams.set("rid", getRid());
        // NOTE: Currently all cases are sending the data in the query
        if (data) url.searchParams.set("data", JSON.stringify(data));

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

            if (response.status === 401 || response.status === 403) {
                // const message = `Not authorized calling FbWeb api endpoint ${endpoint}. Reconnect the MCP in order to authorize again.`;
                // throw new AuthError(
                //     config.verbose
                //         ? `${message} : ${response.status}, ${details}`
                //         : message,
                //     response.status,
                //     details,
                // );

                // rety same task if allowed
                if (tryCount < maxAuthRetries) {
                    log(`API auth error so reload auth and try again, retry=${tryCount}`);

                    // try to reload the auth , e.g. to create new valid access token
                    await reloadAuth();

                    return tryApiRequest(endpoint, data, method, tryCount + 1);
                }
            }

            const message = `Error calling FileFlex api endpoint ${endpoint}`;
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
