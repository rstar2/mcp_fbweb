import packageJson from "../../package.json" with {type: "json"};
import {ConfigError} from "./error.js";

if (!process.env.FBWEB_AUTH_CLIENT_ID)
    throw new ConfigError("Missing FileFlex OAuth client ID", "clientId");

if (!process.env.FBWEB_AUTH_REFRESH_TOKEN)
    throw new ConfigError("Missing FileFlex OAuth refresh token", "refreshToken");

// check presence of a `--verbose` argument
const verbose = process.argv.includes("--verbose");

let baseEndpointUrl: URL;
try {
    // currently all requests are for "/fbweb/app/protected/ajax/...."
    baseEndpointUrl = new URL(`${process.env.FBWEB_BASE_URL || "https://fileflex.com"}/fbweb/app/protected/ajax/`);
} catch {
    throw new ConfigError(
        `Invalid FileFlex base URL: ${process.env.FBWEB_BASE_URL}`,
        "baseUrl",
    );
}
const config = {
    name: packageJson.name,
    version: packageJson.version,
    verbose,
    fbweb: {
        baseEndpointUrl,
        clientId: process.env.FBWEB_AUTH_CLIENT_ID,
        refreshToken: process.env.FBWEB_AUTH_REFRESH_TOKEN,
        timeout: 5000, // 5 seconds
    },
};

export default config;
