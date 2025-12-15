# Magi Archive MCP Proxy

Cloudflare Worker that proxies MCP requests from Claude Web/Mobile to the Ruby backend server.

## Why This Exists

Claude Web has documented bugs preventing direct connections to custom MCP servers. This proxy uses Cloudflare's infrastructure which Claude Web trusts, while forwarding all requests to the existing Ruby MCP server at `https://mcp.magi-agi.org`.

## Architecture

```
Claude Web/Mobile
      ↓
Cloudflare Worker (this proxy)
      ↓
Ruby MCP Server (mcp.magi-agi.org)
```

## Setup

### Prerequisites

- Cloudflare account (free tier works)
- Wrangler CLI installed (`npm install -g wrangler`)
- Authenticated with Cloudflare (`wrangler login`)

### Installation

```bash
npm install
```

### Development

Run locally:
```bash
npm run dev
# or
npx wrangler dev
```

Test the proxy:
```bash
curl http://localhost:8787/
```

### Deployment

Deploy to Cloudflare:
```bash
npm run deploy
# or
npx wrangler deploy
```

After deployment, you'll get a URL like:
```
https://magi-archive-mcp-proxy.your-subdomain.workers.dev
```

## Configuration

Edit `wrangler.toml`:
- `BACKEND_URL`: The Ruby MCP server URL (default: https://mcp.magi-agi.org)

## Connecting from Claude

1. Go to Claude Web → Settings → Connectors
2. Click "Add custom connector"
3. Enter your Cloudflare Worker URL: `https://magi-archive-mcp-proxy.your-subdomain.workers.dev`
4. Click "Add"

## Features

- ✅ Proxies all MCP requests transparently
- ✅ Adds CORS headers for browser compatibility
- ✅ Handles SSE streams properly
- ✅ Forwards session headers (MCP-Session-Id, MCP-Protocol-Version)
- ✅ Error handling with MCP-compliant responses
- ✅ Cloudflare's global CDN for reliability

## Troubleshooting

Check Cloudflare logs:
```bash
npx wrangler tail
```

Test specific endpoints:
```bash
# Test root
curl https://your-worker-url.workers.dev/

# Test MCP initialize
curl -X POST https://your-worker-url.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

## Backend Compatibility

This proxy is designed for the Magi Archive MCP server but can proxy any MCP server by changing `BACKEND_URL` in `wrangler.toml`.
