import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import config from "./config.js";
import {AuthError} from "./error.js";
import {log} from "./log.js";

type Auth = {
    accessToken: string;
    refreshToken: string;
    uid: string;
};

type StoredAuth = Auth & {
    clientId: string;
    rootRefreshToken: string;
};

let auth: Auth | undefined;

const cacheFolder = "fileflex_mcp";

export async function getAccessToken(): Promise<string> {
    if (!auth)
        throw new AuthError(
            "Not authorized yet. Reconnect the MCP in order to authorize again.",
        );

    return auth.accessToken;
}

export function getAuthUid(): string {
    if (!auth)
        throw new AuthError(
            "Not authorized yet. Reconnect the MCP in order to authorize again.",
        );
    return auth.uid;
}

export function clearAuth() {
    auth = undefined;
}

export async function loadAuth() {
    log("Loading auth...");

    try {
        await restoreAuth();
    } catch (err) {
        // if "valid" auth is not found, then "create" one by exchanging the refreshToken for an accessToken
        log("Failed to restore auth from file:", err);
        await reloadAuth();
    }
}

export async function reloadAuth() {
    // exchange the refreshToken (or rootRefreshToken) for an accessToken
    await exchangeRefreshToken();

    // save it
    await storeAuth();
}


export async function restoreAuth() {
    try {
        const authPath = getAuthFilePath();
        const content = await fs.readFile(authPath, "utf-8");
        const storedAuths: StoredAuth[] = JSON.parse(content);

        const {clientId, rootRefreshToken} = config.fbweb;
        const found = storedAuths.find(
            (a) => a.clientId === clientId && a.rootRefreshToken === rootRefreshToken,
        );

        if (found) {
            const {clientId: _, rootRefreshToken: __, ...authStored} = found;
            auth = authStored;
            log("Found stored auth");
            return;
        }
    } catch {
        // File doesn't exist or is invalid - auth remains undefined
    }
}

export async function storeAuth(anAuth?: Auth) {
    anAuth ??= auth;
    if (!anAuth)
        throw new Error("No auth to store");

    const cacheDir = getCacheDir();
    const authPath = getAuthFilePath();

    // create the `~/.cache/mcp_fbweb` folder if necessary
    await fs.mkdir(cacheDir, {recursive: true});

    const authFull: StoredAuth = {
        clientId: config.fbweb.clientId,
        rootRefreshToken: config.fbweb.rootRefreshToken,
        ...anAuth,
    };

    // Read existing auths or start with empty array
    let storedAuths: StoredAuth[] = [];
    try {
        const content = await fs.readFile(authPath, "utf-8");
        storedAuths = JSON.parse(content);
        if (!Array.isArray(storedAuths))
            throw new Error(`Invalid JSON format for the ${cacheFolder} auth.json file`);
    } catch {
        // File doesn't exist yet, or is not valid JSON format
        // TODO Rumen : log error
    }

    // Find and update existing entry, or add new one
    const index = storedAuths.findIndex(
        (a) =>
            a.clientId === authFull.clientId &&
            a.rootRefreshToken === authFull.rootRefreshToken,
    );

    if (index >= 0) {
        storedAuths[index] = authFull;
    } else {
        storedAuths.push(authFull);
    }

    await fs.writeFile(authPath, JSON.stringify(storedAuths, null, 2), {
        mode: 0o600, // Read/write for owner only
    });
    log("Stored auth");
}

async function exchangeRefreshToken() {
    log("Fetching new `accessToken`...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.fbweb.timeout);
    try {
        // use the authorization token endpoint for exchanging current refresh token
        // to a new valid one INCLUDING a valid access token
        const url = new URL(
            "/fbweb/app/public/ajax/oauth_token",
            config.fbweb.baseEndpointUrl.origin,
        );
        url.searchParams.set("grant_type", "refresh_token");
        url.searchParams.set("client_id", config.fbweb.clientId);
        url.searchParams.set("refresh_token", auth?.refreshToken || config.fbweb.rootRefreshToken);

        const response = await fetch(url, {
            method: "POST",
            signal: controller.signal,
        });

        // stop the timeout immediately
        clearTimeout(timeoutId);

        if (!response.ok) {
            const details = await response.text();

            const message = "Error calling FileFlex token-exchange endpoint";
            throw new AuthError(
                config.verbose
                    ? `${message} : ${response.status}, ${details}`
                    : message,
                response.status,
                details,
            );
        }

        const {
            refresh_token: refreshToken,
            access_token: accessToken,
            uid,
        } = await response.json();

        log("Created new auth");
        auth = {refreshToken, accessToken, uid};
    } catch (error) {
        // stop the timeout immediately
        clearTimeout(timeoutId);

        // rethrow if already ApiError
        if (error instanceof AuthError) {
            throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
            throw new AuthError(
                `Request timeout after ${config.fbweb.timeout}ms when calling FileFlex token-exchange endpoint`,
            );
        }

        let message = error instanceof Error ? error.message : String(error);
        if (config.verbose && error instanceof Error)
            message = `${error.message} - ${error.stack}`;

        throw new AuthError(
            `Network error when calling FileFlex token-exchange endpoint: ${message}`,
        );
    }
}

function getCacheDir(): string {
    const xdgCacheHome = process.env.XDG_CACHE_HOME;
    const cacheBase = xdgCacheHome || path.join(os.homedir(), ".cache");
    return path.join(cacheBase, cacheFolder);
}

function getAuthFilePath(): string {
    return path.join(getCacheDir(), "auth.json");
}
