# FileFlex MCP Server

A Model Context Protocol (MCP) server that provides AI capabilities for accessing a FileFlex server API

## Installation / Usage

Set your auth token and run:

### Claude Code

```shell
claude mcp add --scope project fileflex\
               --env FBWEB_AUTH_CLIENT_ID=fbweb_client_id \
               --env FBWEB_AUTH_REFRESH_TOKEN=fbweb_refresh_token \
               --env FBWEB_BASE_URL=fbweb_base_url \
               -- npx -y fileflex/mcp
```

> Can also use `npx -y @fileflex/mcp --verbose` if more verbose debug traces are needed.

### Manual Configuration

```json
{
  "mcpServers": {
    "mcp_fbweb": {
      "type": "stdio",
      "command": "npx",
      "args": [
         "-y",
        "@fileflex/mcp"
      ],
      "env": {
        "FBWEB_AUTH_CLIENT_ID": "fbweb_client_id",
        "FBWEB_AUTH_REFRESH_TOKEN": "fbweb_refresh_token",
        "FBWEB_BASE_URL": "fbweb_base_url"
      }
    }
  }
}
```

## Configuration props

Configuration props are passed using these environment variables:

- `FBWEB_AUTH_CLIENT_ID` - (Required) Authentication OAuth Client ID for accessing the FileFlex server
- `FBWEB_AUTH_REFRESH_TOKEN` - (Required) Authentication refresh-token for accessing the FileFlex server
- `FBWEB_BASE_URL`: (Optional) The FileFlex server base url
- `--verbose` - command argument for showing more verbose error details

## Available Tools

This server provides specialized tools for different image and video analysis tasks:

### Image Analysis Tools

1. **`list_activities`** - List activities in pages

## Development

```shell
pnpm install
pnpm dev
```

## Deploy / Publish

```shell
pnpm publish
```
