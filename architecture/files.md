# Files SOP

## Goal
Read and write files within CodeCommit repositories.

## Tools
| Tool | Action | Safety |
|------|--------|--------|
| `get_file` | Read file content (UTF-8 decoded) | Read-only |
| `get_folder` | List directory tree | Read-only |
| `put_file` | Create/update a file (auto-commit) | Write |
| `delete_file` | Delete a file (auto-commit) | Destructive — requires `confirmDeletion: true` |

## Key Logic
- **`put_file`**: Automatically resolves `parentCommitId` by reading the branch head first
- **`get_file`**: Decodes `Uint8Array` to UTF-8 string for human-readable output
- **`delete_file`**: Read-before-write pattern — fetches current file state before deleting
- **`get_folder`**: Returns files, subFolders, symbolicLinks, and subModules separately

## Input Validation
- `filePath`: Must be a relative path from repo root (e.g., `src/index.ts`)
- `commitSpecifier`: Optional — branch name, tag, or commit ID
- `fileContent`: String content to write
- `confirmDeletion`: Must be `true` for file deletions

## Error Handling
| Error | Cause | Action |
|-------|-------|--------|
| `FileDoesNotExistException` | File not found | Return error |
| `FolderDoesNotExistException` | Folder not found | Return error |
| `SameFileContentException` | No change in content | Return error |
| `ParentCommitIdOutdatedException` | Concurrent edit conflict | Retry may resolve |
| `ThrottlingException` | Rate limit | Exponential backoff |
