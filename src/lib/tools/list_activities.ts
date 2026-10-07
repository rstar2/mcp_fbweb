import z from "zod";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {apiRequest} from "../api.js";

/**
 * Easy way to disable a tool temporary
 */
export const isDisabled = false;

export const name = "list_activities";

export function registerTool(server: McpServer) {
    server.registerTool(
        name,
        {
            title: "List Activities",
            description: "List Activities for a user",
            inputSchema: {
                ownerUid: z.email().describe("Email of the owner of the activities"),
                max: z.number().optional().default(50).describe("Max activities to return"),
            },
        },
        async ({max, ownerUid}) => {
            if (!ownerUid.startsWith("QN")) {
                ownerUid = "QN" + ownerUid;
            }
            const data = await apiRequest("list_activity", {
                pagination: {
                    isNewer: false,
                    readState: "read",
                    max,
                    ownerUid,
                    excludeInternal: true,
                },
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `There are ${data.activities.length} activities`,
                    },
                ],
                structuredContent: data,
            };
        },
    );
}
