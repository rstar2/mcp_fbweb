import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import config from "../config.js";

/**
 * Easy way to disable a tool temporary
 */
export const isDisabled = false;

export const name = "get_mcp_info";

export function registerTool(server: McpServer) {
    server.registerTool(
        name,
        {
            title: "Get MCP info",
            description: "Get the name and version of this MCP server",
        },
        async () => {
            const {name: serverName, version} = config;
            return {
                content: [
                    {
                        type: "text",
                        text: `MCP server: ${serverName}, version: ${version}`,
                    },
                ],
                structuredContent: {name: serverName, version},
            };
        },
    );
}
