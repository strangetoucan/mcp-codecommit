# 📜 AWS CodeCommit MCP — Project Constitution (`gemini.md`)

> **This file is LAW.** Only update when schemas change, rules are added, or architecture is modified.

## Project Identity

- **Name:** `mcp-aws-codecommit`
- **Purpose:** MCP server enabling AI assistants to perform full CRUD operations on AWS CodeCommit repositories, branches, files, and pull requests.
- **Stack:** TypeScript, `@modelcontextprotocol/sdk`, `@aws-sdk/client-codecommit`, Node.js 18+
- **Transports:** `stdio` (default) + `Streamable HTTP`
- **License:** MIT

---

## Data Schemas

### Environment Input
```json
{
  "AWS_ACCESS_KEY_ID": "string (optional, uses default credential chain)",
  "AWS_SECRET_ACCESS_KEY": "string (optional)",
  "AWS_REGION": "string (default: us-east-1)",
  "AWS_PROFILE": "string (optional, for SSO)",
  "MCP_TRANSPORT": "stdio | http (default: stdio)",
  "MCP_HTTP_PORT": "number (default: 3000)"
}
```

### Repository Schema
```json
{
  "repositoryId": "string",
  "repositoryName": "string",
  "repositoryDescription": "string | null",
  "defaultBranch": "string",
  "lastModifiedDate": "ISO8601",
  "creationDate": "ISO8601",
  "cloneUrlHttp": "string",
  "cloneUrlSsh": "string",
  "arn": "string"
}
```

### Branch Schema
```json
{
  "branchName": "string",
  "commitId": "string"
}
```

### File Schema
```json
{
  "blobId": "string",
  "absolutePath": "string",
  "relativePath": "string",
  "fileMode": "NORMAL | EXECUTABLE | SYMLINK",
  "fileSize": "number",
  "fileContent": "string (base64 decoded)"
}
```

### Pull Request Schema
```json
{
  "pullRequestId": "string",
  "title": "string",
  "description": "string",
  "pullRequestStatus": "OPEN | CLOSED",
  "authorArn": "string",
  "creationDate": "ISO8601",
  "lastActivityDate": "ISO8601",
  "pullRequestTargets": [
    {
      "repositoryName": "string",
      "sourceReference": "string",
      "destinationReference": "string",
      "mergeMetadata": "object"
    }
  ]
}
```

### Commit Schema
```json
{
  "commitId": "string",
  "treeId": "string",
  "message": "string",
  "author": { "name": "string", "email": "string", "date": "ISO8601" },
  "committer": { "name": "string", "email": "string", "date": "ISO8601" },
  "parents": ["string"]
}
```

---

## Behavioral Rules

1. **NO BRANCH DELETION** unless the user explicitly requests it via the tool parameter `confirmDeletion: true`.
2. **NO FORCE PUSHES** — the system has no mechanism for force push; all file writes go through `putFile` / `createCommit` which are non-destructive.
3. **Rate Limiting:** Implement exponential backoff with max 3 retries on AWS throttling errors (`ThrottlingException`).
4. **Error Transparency:** All errors must surface the original AWS error code + message to the AI client for informed decision-making.
5. **Read-before-Write:** For destructive operations (delete file, delete repo), always return the current state first and require explicit confirmation parameters.

---

## Architectural Invariants

1. **Separation of Concerns:** Each CodeCommit domain (repos, branches, files, PRs, commits) has its own tool module in `tools/`.
2. **No Business Logic in Transport Layer:** The MCP server setup (stdio/HTTP) is purely a transport wrapper — all logic lives in tools.
3. **Deterministic Tools:** Every tool is a pure function: `(validatedInput) → (AWSResponse | Error)`. No LLM reasoning inside tools.
4. **Schema Validation:** All tool inputs are validated via Zod schemas before reaching AWS SDK calls.
5. **Architecture SOP First:** Any logic change requires updating `architecture/*.md` before updating `tools/*.ts`.

---

## Maintenance Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-14 | Initial constitution created | System Pilot |
