import {readdir} from "node:fs/promises";
import {join, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import type {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";

const toolsDir = dirname(fileURLToPath(import.meta.url));

export async function registerTools(server: McpServer): Promise<void> {
    const files = await readdir(toolsDir);

    for (const file of files) {
        if (file === "index.js" || file === "index.ts") continue;
        if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;

        const module = await import(join(toolsDir, file));
        if (!module.isDisabled && module.registerTool) {
            console.log(`Register tool: ${module.name}`);
            module.registerTool?.(server);
        }
    }
}
