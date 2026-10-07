import z from "zod";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

import {apiRequest} from "../api.js";

/**
 * Easy way to disable a tool temporary
 */
export const isDisabled = false;

export const name = "list_children";

export function registerTool(server: McpServer) {
    server.registerTool(
        name,
        {
            title: "List Children",
            description: "List the children contents of a folder",
            inputSchema: {
                uid: z.string().describe("Current auth user UID"),
                pid: z.string().describe("Provider's ID where the parent path is located"),
                path: z.string().optional().describe("Parent's path whose children to request"),
            },
        },
        async ({uid, pid, path}) => {

            const data = await apiRequest("children_list", {
                pg: {
                    uid: uid,

                    // only MyContent/Sharer case
                    loc: pid,
                    sha: true,

                    path: path || "/",
                },
                includeParentInfo: true,
                requestPage: {start: 0, count: 250}
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `There are ${data.listRes.length} resources/children`,
                    },
                ],
                structuredContent: data,
            };
        },
    );
}
