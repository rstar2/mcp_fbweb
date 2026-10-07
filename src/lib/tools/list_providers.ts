import z from "zod";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {apiRequest} from "../api.js";

/**
 * Easy way to disable a tool temporary
 */
export const isDisabled = false;

export const name = "list_providers";

export function registerTool(server: McpServer) {
    server.registerTool(
        name,
        {
            title: "List Providers",
            description: "List Providers for current user",
            inputSchema: {
                schema: z.string().optional().describe("Type of the providers, like 'Dropbox', 'OneDrive', etc..."),
            },
        },
        async ({schema}) => {
            const data = await apiRequest("provider_list", {schema});
            return {
                content: [
                    {
                        type: "text",
                        text: `There are ${data.providers.length} providers`,
                    },
                ],
                structuredContent: data,
            };
        },
    );
}
