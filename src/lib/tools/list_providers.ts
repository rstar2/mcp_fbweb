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
                schema: z.string().optional().describe("Type of the providers, like 'Dropbox', 'Box',..."),
            },
        },
        async ({schema}) => {
            const {providers} = await apiRequest("list_provider", {
                schema
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `There are ${providers.length} providers`,
                    },
                ],
                structuredContent: {providers},
            };
        },
    );
}
