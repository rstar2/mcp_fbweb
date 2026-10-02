import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {apiRequest} from "../api.js";

/**
 * Easy way to disable a tool temporary
 */
export const isDisabled = false;

export const name = "get_statistics";

export function registerTool(server: McpServer) {
    server.registerTool(
        name,
        {
            title: "Statistics",
            description: "Get the statistics data for the currently authorized FileFlex user",
        },
        async () => {
            const data = await apiRequest("statistic_get");
            return {
                content: [
                    {
                        type: "text",
                        text: `There are ${data.lists_per_mid.length} requests in the statistics data`,
                    },
                ],
                structuredContent: data,
            };
        },
    );
}
