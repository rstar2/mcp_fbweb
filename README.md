# FbWeb MCP Server - `mcp_fbweb`

A Model Context Protocol (MCP) server that provides AI capabilities for accessing a FbWeb server

## Installation / Usage

Set your auth token and run:

### Claude Code

```shell
claude mcp add --scope project mcp_fbweb \
               --env FBWEB_AUTH_REFRESH_TOKEN=fbweb_refresh_token \
               --env FBWEB_BASE_URL=fbweb_base_url \
               -- npx mcp_fbweb
```

> Can also use `npx mcp_fbweb --verbose` if more verbose debug traces are needed.

### Manual Configuration

```json
{
  "mcpServers": {
    "mcp_fbweb": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "mcp_fbweb"
      ],
      "env": {
        "FBWEB_AUTH_REFRESH_TOKEN": "fbweb_refresh_token",
        "FBWEB_BASE_URL": "fbweb_base_url",
      }
    }
  }
}
```

## Configuration props

Configuration props are passed using these environment variables:

- `FBWEB_AUTH_REFRESH_TOKEN` - Required authentication refresh-token for accessing the FbWeb server
- `FBWEB_BASE_URL`: The FbWeb server base url
- `--verbose` - command argument for showing more verbose error details

## Available Tools

This server provides specialized tools for different image and video analysis tasks:

### Image Analysis Tools

1. **`list_activities`** - List activities in pages

## Development

```shell
pnpm install
pnpm build
pnpm start:dev
```

## Deploy / Publish

```shell
npm publish
```
