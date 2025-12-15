/**
 * Cloudflare Worker MCP Proxy
 *
 * Proxies MCP requests from Claude Web to the Ruby backend at mcp.magi-agi.org
 * Adds Cloudflare's infrastructure reliability and OAuth handling
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const backendUrl = env.BACKEND_URL || 'https://mcp.magi-agi.org';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Session-Id, MCP-Protocol-Version',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Build backend request
    const backendRequestUrl = `${backendUrl}${url.pathname}${url.search}`;

    // Clone headers
    const backendHeaders = new Headers(request.headers);

    // Set correct Host header for backend (required by HostAuthorization middleware)
    const backendHost = new URL(backendUrl).host;
    backendHeaders.set('Host', backendHost);

    // Add identifying headers
    backendHeaders.set('X-Forwarded-By', 'cloudflare-mcp-proxy');
    backendHeaders.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
    backendHeaders.set('X-Original-Host', request.headers.get('Host') || '');

    // Forward request to backend
    let backendResponse;
    try {
      console.log(`[PROXY] ${request.method} ${url.pathname} -> ${backendRequestUrl}`);
      console.log(`[PROXY] Host header being sent: ${backendHeaders.get('Host')}`);

      backendResponse = await fetch(backendRequestUrl, {
        method: request.method,
        headers: backendHeaders,
        body: request.body,
        // Don't auto-redirect, let Claude handle it
        redirect: 'manual',
      });

      console.log(`[BACKEND] Status: ${backendResponse.status}, Content-Type: ${backendResponse.headers.get('Content-Type')}`);

      // Log 403 error details
      if (backendResponse.status === 403) {
        const errorText = await backendResponse.clone().text();
        console.log(`[BACKEND] 403 Error: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.error('[ERROR] Backend request failed:', error);
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Backend server unavailable',
          data: error.message
        }
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Clone response and add CORS headers
    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Session-Id, MCP-Protocol-Version');

    // For SSE streams, ensure proper headers
    if (responseHeaders.get('Content-Type')?.includes('text/event-stream')) {
      responseHeaders.set('Cache-Control', 'no-cache');
      responseHeaders.set('X-Accel-Buffering', 'no');
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  },
};
