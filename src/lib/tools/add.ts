import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

export const name = "add";

export function registerTool(server: McpServer) {
  server.registerTool(
    name,
    {
      title: "Addition Tool",
      description: "Add two numbers together",
      inputSchema: {
        a: z.number().describe("First number to add"),
        b: z.number().describe("Second number to add"),
      },
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: `${a} + ${b} = ${a + b}` }],
    }),
  );
}
