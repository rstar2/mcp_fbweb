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
               -- npx -y @fileflex/mcp
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

### General

1. **`get_mcp_info`** - Get the info for this MCP - version, etc... mainly used for development
2. **`get_me`** - Getthe currently authorized user - his email

### Activities

1. **`list_activities`** - List user's activities

### Content

1. **`list_provider`** - List user's providers
2. **`list_children`** - List the contents of a certain folder inside a provider

### Others

1. **`get_statistics`** - Get latests statistics

## Development

```shell
pnpm install
pnpm dev
```

## Deploy / Publish

```shell
pnpm publish
```
