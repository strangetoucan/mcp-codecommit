import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { randomUUID } from "node:crypto";

/**
 * Start the MCP server with stdio transport.
 * Used for local subprocess communication (Claude Desktop, Cursor, CLI).
 */
export async function startStdioTransport(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp-aws-codecommit] Server running on stdio transport");
}

/**
 * Start the MCP server with Streamable HTTP transport.
 * Used for remote HTTP-based connections.
 */
export async function startHttpTransport(
  server: McpServer,
  port: number,
): Promise<void> {
  const app = express();
  app.use(express.json());

  // Map to store transports by session ID
  const transports = new Map<string, StreamableHTTPServerTransport>();

  // Handle MCP requests
  app.post("/mcp", async (req, res) => {
    const sessionId =
      (req.headers["mcp-session-id"] as string) || randomUUID();

    let transport = transports.get(sessionId);

    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
      });

      transports.set(sessionId, transport);
      await server.connect(transport);

      // Clean up on close
      transport.onclose = () => {
        transports.delete(sessionId);
      };
    }

    await transport.handleRequest(req, res, req.body);
  });

  // Handle GET for SSE streams
  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    const transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      res.status(400).json({ error: "No active session. Send a POST first." });
      return;
    }

    await transport.handleRequest(req, res);
  });

  // Handle DELETE to close sessions
  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    const transport = sessionId ? transports.get(sessionId) : undefined;

    if (transport) {
      await transport.handleRequest(req, res);
      transports.delete(sessionId);
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  });

  app.listen(port, () => {
    console.error(
      `[mcp-aws-codecommit] Server running on HTTP transport at http://localhost:${port}/mcp`,
    );
  });
}
