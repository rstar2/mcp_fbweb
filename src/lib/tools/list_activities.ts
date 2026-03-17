import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiRequest } from "../api.js";

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
      description: "List Activities for current user",
      //   inputSchema: {
      //     a: z.number().describe("First number to add"),
      //     b: z.number().describe("Second number to add"),
      //   },
    },
    async () => {
      const { activities } = await apiRequest("list_activity", {
        pagination: {
          isNewer: false,
          readState: "read",
          max: 50,
          ownerUid: "QNrstar2@abv.bg",
          excludeInternal: true,
        },
      });
      return {
        content: [
          {
            type: "text",
            text: `Activities are ${activities.length} in count`,
          },
        ],
        structuredContent: { activities },
      };
    },
  );
}
