import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {InitializeRequestSchema} from "@modelcontextprotocol/sdk/types.js";

import config from "./config.js";
import {registerTools} from "./tools/index.js";
import {loadAuth} from "./auth.js";
import {log} from "./log.js";

export async function startMcpServer() {
    const serverInfo = {
        name: config.name,
        version: config.version,
    };
    const server = new McpServer(serverInfo);

    // 1. Set init handler first
    server.server.setRequestHandler(InitializeRequestSchema, async (request) => {
        await loadAuth();

        log("Server is running");
        return {
            // latest MCP protocol version
            protocolVersion: "2024-11-05",
            // NOTE: this is obligatory to be sent again
            serverInfo,
            capabilities: {tools: {}},
        };
    });

    setupErrorHandling(server);
    await registerTools(server);
    await connect(server);
}

function setupErrorHandling(server: McpServer) {
    const gracefulShutdown = (exitCode: number = 0) => {
        log("Performing graceful shutdown...");

        // Cleanup logic can be added here
        // ...

        process.exit(exitCode);
    };

    process.on("uncaughtException", (error) => {
        log("Uncaught exception:", error);
        gracefulShutdown(1);
    });
    process.on("unhandledRejection", (reason, promise) => {
        log("Unhandled rejection at:", {promise, reason});
        gracefulShutdown(1);
    });
    process.on("SIGINT", () => {
        log("Received SIGINT, shutting down gracefully...");
        gracefulShutdown();
    });
    process.on("SIGTERM", () => {
        log("Received SIGTERM, shutting down gracefully...");
        gracefulShutdown();
    });
}

async function connect(server: McpServer) {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log("Loading...");
}
