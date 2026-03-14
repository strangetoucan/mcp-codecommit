# Repositories SOP

## Goal
Provide full CRUD operations on AWS CodeCommit repositories.

## Tools
| Tool | Action | Safety |
|------|--------|--------|
| `list_repositories` | List all repos | Read-only |
| `get_repository` | Get repo details | Read-only |
| `create_repository` | Create new repo | Write |
| `delete_repository` | Delete repo | Destructive — requires `confirmDeletion: true` |
| `update_repository_description` | Update description | Write |

## Input Validation
- `repositoryName`: Required string, max 100 chars, must match `[a-zA-Z0-9._-]+`
- `confirmDeletion`: Boolean, must be `true` for destructive operations

## Error Handling
| Error | Cause | Action |
|-------|-------|--------|
| `RepositoryDoesNotExistException` | Invalid repo name | Return error to AI client |
| `RepositoryNameExistsException` | Duplicate name on create | Return error to AI client |
| `ThrottlingException` | Rate limit | Exponential backoff, max 3 retries |

## Edge Cases
- Deleting a repository also deletes all branches, commits, and PRs within it
- Repository names are case-sensitive
- `delete_repository` performs read-before-write to surface current state
