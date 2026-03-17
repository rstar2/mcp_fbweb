import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import config from "./config.js";
import { AuthError } from "./error.js";

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

export async function getAccessToken(): Promise<string> {
  if (!auth)
    throw new AuthError(
      "Not authorized yet. Reconnect the MCP in order to authorize again.",
    );

  return auth.accessToken;
}

export function clearAuth() {
  auth = undefined;
}

export async function loadAuth() {
  // TODO: when restoring Auth from file if the accessToken is not "valid" any more
  // then when exchanging the latest refreshToken must be used, not the init/root one
  const authStored = await restoreAuth();
  if (authStored) {
    console.error("MCP_FBWEB use stored auth");

    auth = authStored;
    return;
  }

  const authNew = await exchangeRefreshToken();
  console.error("MCP_FBWEB created new auth");

  await storeAuth(authNew);
  console.error("MCP_FBWEB store auth");

  auth = authNew;
}

async function exchangeRefreshToken(): Promise<Auth> {
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
    url.searchParams.set("refresh_token", config.fbweb.refreshToken);

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
    });

    // stop the timeout immediately
    clearTimeout(timeoutId);

    if (!response.ok) {
      const details = await response.text();

      const message = "Error calling FbWeb token-exchange endpoint";
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

    return { refreshToken, accessToken, uid };
  } catch (error: unknown) {
    // stop the timeout immediately
    clearTimeout(timeoutId);

    // rethrow if already ApiError
    if (error instanceof AuthError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AuthError(
        `Request timeout after ${config.fbweb.timeout}ms when calling FbWeb token-exchange endpoint`,
      );
    }

    let message = error instanceof Error ? error.message : String(error);
    if (config.verbose && error instanceof Error)
      message = `${error.message} - ${error.stack}`;

    throw new AuthError(
      `Network error when calling FbWeb token-exchange endpoint: ${message}`,
    );
  }
}
export async function restoreAuth(): Promise<Auth | undefined> {
  try {
    const authPath = getAuthFilePath();
    const content = await fs.readFile(authPath, "utf-8");
    const storedAuths: StoredAuth[] = JSON.parse(content);

    const { clientId, refreshToken } = config.fbweb;
    const found = storedAuths.find(
      (a) => a.clientId === clientId && a.rootRefreshToken === refreshToken,
    );

    if (found) {
      const { clientId: _, rootRefreshToken: __, ...auth } = found;
      return auth;
    }
  } catch {
    // File doesn't exist or is invalid - auth remains undefined
  }
}

export async function storeAuth(auth: Auth) {
  const cacheDir = getCacheDir();
  const authPath = getAuthFilePath();

  // create the `~/.cache/mcp_fbweb` folder if necessary
  await fs.mkdir(cacheDir, { recursive: true });

  const authFull: StoredAuth = {
    clientId: config.fbweb.clientId,
    rootRefreshToken: config.fbweb.refreshToken,
    ...auth,
  };

  // Read existing auths or start with empty array
  let storedAuths: StoredAuth[] = [];
  try {
    const content = await fs.readFile(authPath, "utf-8");
    storedAuths = JSON.parse(content);
    if (!Array.isArray(storedAuths))
      throw new Error("Invalid JSON format for the mcp_fbweb auth file");
  } catch {
    // File doesn't exist yet, or is not valid JSON format
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
}

function getCacheDir(): string {
  const xdgCacheHome = process.env.XDG_CACHE_HOME;
  const cacheBase = xdgCacheHome || path.join(os.homedir(), ".cache");
  return path.join(cacheBase, "mcp_fbweb");
}

function getAuthFilePath(): string {
  return path.join(getCacheDir(), "auth.json");
}
