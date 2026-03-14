# 🚀 AWS CodeCommit MCP — Task Plan

## Phase 1: Blueprint ← CURRENT
- [x] Discovery questions answered
- [x] Research complete
- [x] Data schemas defined in `gemini.md`
- [ ] Implementation plan approved

## Phase 2: Link (Connectivity)
- [ ] Initialize TypeScript project (`package.json`, `tsconfig.json`)
- [ ] Install dependencies (`@modelcontextprotocol/sdk`, `@aws-sdk/client-codecommit`, `zod`)
- [ ] Build AWS client factory with credential chain support
- [ ] Verify AWS SDK connectivity with a handshake test

## Phase 3: Architect (3-Layer Build)
- [ ] Write architecture SOPs for each domain
- [ ] Build MCP server entry point with dual transport (stdio + HTTP)
- [ ] Build Repository tools (list, get, create, delete, update)
- [ ] Build Branch tools (list, get, create, delete, update default)
- [ ] Build File tools (get_file, get_folder, put_file, delete_file)
- [ ] Build Commit tools (get, create, list differences)
- [ ] Build Pull Request tools (create, get, list, update, merge)
- [ ] Build Comment tools (post on PR, reply)

## Phase 4: Stylize (Refinement)
- [ ] Clean error formatting
- [ ] Professional tool descriptions
- [ ] README.md with setup instructions
- [ ] Claude Desktop / Cursor config examples

## Phase 5: Trigger (Deployment)
- [ ] npm package configuration
- [ ] CLI entry point (`npx mcp-aws-codecommit`)
- [ ] Final `gemini.md` update
