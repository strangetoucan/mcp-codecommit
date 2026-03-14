# Commits SOP

## Goal
Read commit information and create multi-file commits.

## Tools
| Tool | Action | Safety |
|------|--------|--------|
| `get_commit` | Get commit details | Read-only |
| `batch_get_commits` | Get multiple commits (max 25) | Read-only |
| `create_commit` | Multi-file add/update/delete in one commit | Write |
| `get_differences` | Compare two commit specifiers (paginated) | Read-only |

## Key Logic
- **`create_commit`**: Resolves `parentCommitId` from branch head automatically
- **`create_commit`**: Converts string `fileContent` to `Uint8Array` for AWS SDK
- **`get_differences`**: Uses pagination to handle large diffs

## Input Validation
- `commitId`: Full 40-char SHA
- `commitIds` (batch): Array of commit IDs, max 25 per call
- `putFiles`: Array of `{ filePath, fileContent, fileMode? }`
- `deleteFiles`: Array of `{ filePath }`

## Error Handling
| Error | Cause | Action |
|-------|-------|--------|
| `CommitDoesNotExistException` | Invalid commit ID | Return error |
| `NoChangeException` | Nothing to commit | Return error |
| `ParentCommitIdOutdatedException` | Concurrent commit | Retry may resolve |
