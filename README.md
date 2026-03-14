# 🔌 MCP AWS CodeCommit

> MCP server for full CRUD operations on AWS CodeCommit — repositories, branches, files, commits, and pull requests.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

## Features

- 🏗️ **27 tools** across 5 domains (repos, branches, files, commits, PRs)
- 🔀 **Dual transport**: `stdio` (default) + `Streamable HTTP`
- 🛡️ **Safety guards**: confirmation required for destructive operations
- ♻️ **Auto-retry**: exponential backoff on AWS throttling
- 🔐 **Full credential chain**: env vars → AWS profile → SSO → instance role

## Quick Start

### Install

```bash
npm install
npm run build
```

### Run (stdio mode)

```bash
node dist/index.js
```

### Run (HTTP mode)

```bash
MCP_TRANSPORT=http MCP_HTTP_PORT=3000 node dist/index.js
```

### Development

```bash
npm run dev
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key (optional if using profile/SSO) | — |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | — |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_PROFILE` | AWS CLI profile (for SSO) | — |
| `MCP_TRANSPORT` | Transport mode | `stdio` |
| `MCP_HTTP_PORT` | HTTP server port | `3000` |

## Integration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aws-codecommit": {
      "command": "node",
      "args": ["/path/to/mcp-aws-codecommit/dist/index.js"],
      "env": {
        "AWS_REGION": "us-east-1",
        "AWS_PROFILE": "your-profile"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "aws-codecommit": {
      "command": "node",
      "args": ["/path/to/mcp-aws-codecommit/dist/index.js"],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "aws-codecommit": {
      "command": "node",
      "args": ["/path/to/mcp-aws-codecommit/dist/index.js"],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

## Available Tools

### 📦 Repositories
| Tool | Description |
|------|-------------|
| `list_repositories` | List all CodeCommit repositories |
| `get_repository` | Get repository details |
| `create_repository` | Create a new repository |
| `delete_repository` | Delete a repository (requires confirmation) |
| `update_repository_description` | Update repository description |

### 🌿 Branches
| Tool | Description |
|------|-------------|
| `list_branches` | List all branches in a repository |
| `get_branch` | Get branch details and head commit |
| `create_branch` | Create a new branch |
| `delete_branch` | Delete a branch (requires confirmation) |
| `update_default_branch` | Change the default branch |

### 📄 Files
| Tool | Description |
|------|-------------|
| `get_file` | Get file content from a repository |
| `get_folder` | List folder contents |
| `put_file` | Create or update a file |
| `delete_file` | Delete a file (requires confirmation) |

### 📝 Commits
| Tool | Description |
|------|-------------|
| `get_commit` | Get commit details |
| `create_commit` | Create a multi-file commit |
| `get_differences` | Compare two commit specifiers |
| `batch_get_commits` | Get multiple commits at once |

### 🔀 Pull Requests
| Tool | Description |
|------|-------------|
| `list_pull_requests` | List pull requests (filterable by status) |
| `get_pull_request` | Get pull request details |
| `create_pull_request` | Create a new pull request |
| `update_pull_request_title` | Update PR title |
| `update_pull_request_description` | Update PR description |
| `update_pull_request_status` | Close or reopen a PR |
| `merge_pull_request` | Merge PR (fast-forward, squash, or three-way) |
| `post_comment_on_pull_request` | Post a comment on a PR |
| `get_comments_for_pull_request` | Get all comments on a PR |

## Safety

- **No branch deletion** without `confirmDeletion: true`
- **No file/repo deletion** without `confirmDeletion: true`
- **No force pushes** — all writes go through `putFile`/`createCommit`
- **Read-before-write** on destructive operations
- **Exponential backoff** on AWS throttling (max 3 retries)

## Architecture

```
src/
├── index.ts            # Entry point + tool registration
├── aws-client.ts       # AWS SDK factory + retry logic
├── transport.ts        # Stdio + HTTP transport setup
└── tools/
    ├── repositories.ts # Repository CRUD (5 tools)
    ├── branches.ts     # Branch management (5 tools)
    ├── files.ts        # File read/write (4 tools)
    ├── commits.ts      # Commit operations (4 tools)
    └── pull-requests.ts# PR lifecycle (9 tools)
```

## License

MIT
