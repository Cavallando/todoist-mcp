import "dotenv/config";
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => { raw += chunk; });
    req.on("end", () => {
      if (!raw) { resolve(undefined); return; }
      try { resolve(JSON.parse(raw)); } catch { resolve(undefined); }
    });
    req.on("error", reject);
  });
}

import { registerTaskTools } from "./tools/tasks.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerLabelTools } from "./tools/labels.js";
import { registerSectionTools } from "./tools/sections.js";
import { registerCommentTools } from "./tools/comments.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);

function createServer(): McpServer {
  const server = new McpServer(
    { name: "todoist-mcp", version: "1.0.0" },
    {
      capabilities: { tools: {} },
      instructions:
        "A full-featured Todoist integration. Use the available tools to manage tasks, projects, sections, labels, and comments.",
    }
  );

  registerTaskTools(server);
  registerProjectTools(server);
  registerLabelTools(server);
  registerSectionTools(server);
  registerCommentTools(server);

  return server;
}

// Session map: reuse the same transport across the MCP handshake (initialize →
// initialized notification → tool calls). A new transport is only created when
// there is no mcp-session-id header (i.e. the very first request of a session).
const sessions = new Map<string, StreamableHTTPServerTransport>();

const httpServer = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname !== "/mcp") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use POST /mcp" }));
    return;
  }

  // Parse the body once up front so it can be passed to handleRequest.
  // The Streamable HTTP transport uses the parsedBody argument when present;
  // without it, body parsing can fail on some runtimes/proxies.
  const body = req.method === "POST" ? await readBody(req) : undefined;

  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  let transport: StreamableHTTPServerTransport;

  if (sessionId && sessions.has(sessionId)) {
    // Existing session — route to the already-initialized transport.
    transport = sessions.get(sessionId)!;
    try {
      await transport.handleRequest(req, res, body);
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
      console.error("Request handling error:", err);
    }
    return;
  }

  if (sessionId) {
    // Client sent a session ID we don't recognise (e.g. server restarted).
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Session not found" }));
    return;
  }

  // No session ID — this is the first request (initialize).
  // onsessioninitialized fires synchronously inside handleRequest the instant
  // the session ID is generated, before the response is sent to the client.
  // This guarantees the transport is in the map before the client can send
  // any follow-up request with that session ID.
  transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sid) => {
      sessions.set(sid, transport);
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) sessions.delete(transport.sessionId);
  };

  const server = createServer();
  await server.connect(transport);

  try {
    await transport.handleRequest(req, res, body);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    console.error("Request handling error:", err);
  }
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Todoist MCP server listening on http://0.0.0.0:${PORT}/mcp`);
  console.log(`Add to Cursor/Claude: { "url": "http://<your-pi-ip>:${PORT}/mcp" }`);
});

httpServer.on("error", (err) => {
  console.error("HTTP server error:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("Shutting down...");
  httpServer.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  httpServer.close(() => process.exit(0));
});
