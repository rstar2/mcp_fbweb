import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {getAuthUid} from "../auth.js";

/**
 * Easy way to disable a tool temporary
 */
export const isDisabled = false;

export const name = "get_me";

export function registerTool(server: McpServer) {
    server.registerTool(
        name,
        {
            title: "Get myself",
            description: "Get authorized current user's UID",
        },
        async () => {
            const uid = getAuthUid();
            return {
                content: [
                    {
                        type: "text",
                        text: `Currently authorized with UID: ${uid}`,
                    },
                ],
                structuredContent: {uid},
            };
        },
    );
}
