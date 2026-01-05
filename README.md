# Magi Archive MCP Proxy

> **⚠️ DEPRECATED (January 2026)**: This Cloudflare Worker proxy is no longer needed.
>
> Use the direct connection at `https://mcp.magi-agi.org` instead.
>
> The MCP server now has HTTPS via Cloudflare CDN proxy (orange cloud DNS), which provides
> better SSE stability and eliminates the Worker timeout issues that caused tools to
> disappear mid-session.
>
> **See:** [MCP Client Setup Guide](https://wiki.magi-agi.org/Neoterics+Magi_Archive+MCP_Client_Setup)

---

## Migration

If you were using `https://magi-archive-mcp-proxy.lake-watkins.workers.dev`:

1. Remove that connector from your client
2. Add new connector with URL: `https://mcp.magi-agi.org`
3. OAuth Client ID: `public-client` (if prompted)

---

## Historical Documentation

This was a Cloudflare Worker that proxied MCP requests from Claude Web/Mobile to the Ruby backend server.

### Why This Existed

Claude Web had documented bugs preventing direct connections to custom MCP servers. This proxy used Cloudflare's infrastructure which Claude Web trusted, while forwarding all requests to the Ruby MCP server.

### Architecture (Deprecated)

```
Claude Web/Mobile
      ↓
Cloudflare Worker (this proxy) ← NO LONGER NEEDED
      ↓
Ruby MCP Server (mcp.magi-agi.org)
```

### Current Architecture

```
Claude Web/Mobile
      ↓
Cloudflare CDN (orange cloud DNS)
      ↓
Ruby MCP Server (mcp.magi-agi.org)
```

## Repository Status

This repository is archived for historical reference. The Worker may be deleted from Cloudflare in the future.
