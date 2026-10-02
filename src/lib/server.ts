import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";

import config from "./config.js";
import {registerTools} from "./tools/index.js";
import {InitializeRequestSchema} from "@modelcontextprotocol/sdk/types.js";
import {loadAuth} from "./auth.js";

export async function startMcpServer() {
    const serverInfo = {
        name: config.name,
        version: config.version,
    };
    const server = new McpServer(serverInfo);

    // 1. Set init handler first
    server.server.setRequestHandler(InitializeRequestSchema, async (request) => {
        await loadAuth();
        return {
            // latest MCP protocol version
            protocolVersion: "2024-11-05",
            // NOTE: this is obligatory to be sent again
            serverInfo,
            capabilities: {tools: {}},
        };
    });

    await setupErrorHandling(server);
    await registerTools(server);
    await connect(server);
}

function setupErrorHandling(server: McpServer) {
    const gracefulShutdown = (exitCode: number = 0) => {
        console.info("Performing graceful shutdown...");

        // Cleanup logic can be added here
        // ...

        process.exit(exitCode);
    };

    process.on("uncaughtException", (error) => {
        console.error("Uncaught exception:", error);
        gracefulShutdown(1);
    });
    process.on("unhandledRejection", (reason, promise) => {
        console.error("Unhandled rejection at:", {promise, reason});
        gracefulShutdown(1);
    });
    process.on("SIGINT", () => {
        console.info("Received SIGINT, shutting down gracefully...");
        gracefulShutdown();
    });
    process.on("SIGTERM", () => {
        console.info("Received SIGTERM, shutting down gracefully...");
        gracefulShutdown();
    });
}

async function connect(server: McpServer) {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.log("FileFlex MCP Server is running");
}
