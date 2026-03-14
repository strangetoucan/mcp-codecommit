# 🔍 Findings & Research Log

## 2026-03-14: Initial Research

### Existing Implementations
- **`0462/mcp-codecommit`** (Python, FastMCP): Only 3 tools (list repos, create PR, get PR). Very minimal. No file ops, no branch management, no commit support. Stdio only.
- **`awslabs/mcp`**: Official AWS MCP servers — broader AWS coverage but no dedicated CodeCommit server with full CRUD.

### AWS CodeCommit API Coverage (via `@aws-sdk/client-codecommit`)
Full CRUD available across:
- **Repositories:** list, get, create, delete, update description/name
- **Branches:** list, get, create, delete, update default branch
- **Files:** get_file, get_folder, put_file, delete_file, get_blob
- **Commits:** get_commit, create_commit, batch_get_commits, get_differences
- **Pull Requests:** create, get, list, update (title/description/status), merge (fast-forward, squash, three-way)
- **Comments:** post on PR, post on commit comparison, update, delete, reply

### Technology Decision: TypeScript
**Why TypeScript over Python:**
1. Official `@modelcontextprotocol/sdk` has first-class TypeScript support with stdio + Streamable HTTP
2. `@aws-sdk/client-codecommit` (v3) — modern, tree-shakeable, TypeScript-native
3. User wants CLI — TypeScript compiles to standalone CLI via `npx` or global install
4. Better type safety for schema validation with Zod
5. Easier distribution via npm

### MCP SDK Transport Support
- `StdioServerTransport` — for local subprocess usage (Claude Desktop, Cursor, etc.)
- `StreamableHTTPServerTransport` — for remote HTTP-based connections
- Both supported in `@modelcontextprotocol/sdk`
