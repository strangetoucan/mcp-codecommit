#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { startStdioTransport, startHttpTransport } from "./transport.js";
import { registerRepositoryTools } from "./tools/repositories.js";
import { registerBranchTools } from "./tools/branches.js";
import { registerFileTools } from "./tools/files.js";
import { registerCommitTools } from "./tools/commits.js";
import { registerPullRequestTools } from "./tools/pull-requests.js";
import { registerProfileTools } from "./tools/profiles.js";

// ─── Server Configuration ───
const SERVER_NAME = "mcp-aws-codecommit";
const SERVER_VERSION = "1.0.0";

async function main(): Promise<void> {
  // Create MCP Server
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register all tool modules
  registerProfileTools(server);
  registerRepositoryTools(server);
  registerBranchTools(server);
  registerFileTools(server);
  registerCommitTools(server);
  registerPullRequestTools(server);

  // Select transport based on environment
  const transport = process.env.MCP_TRANSPORT || "stdio";

  if (transport === "http") {
    const port = parseInt(process.env.MCP_HTTP_PORT || "3000", 10);
    await startHttpTransport(server, port);
  } else {
    await startStdioTransport(server);
  }
}

// Start the server
main().catch((error) => {
  console.error("[mcp-aws-codecommit] Fatal error:", error);
  process.exit(1);
});
