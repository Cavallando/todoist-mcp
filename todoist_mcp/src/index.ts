import "dotenv/config";
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";

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

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  const server = createServer();

  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
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
