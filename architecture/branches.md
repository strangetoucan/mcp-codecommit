# Branches SOP

## Goal
Manage branches within CodeCommit repositories — list, create, delete, and update the default branch.

## Tools
| Tool | Action | Safety |
|------|--------|--------|
| `list_branches` | List all branches (paginated) | Read-only |
| `get_branch` | Get branch details + head commit | Read-only |
| `create_branch` | Create branch from commit ID | Write |
| `delete_branch` | Delete branch | Destructive — requires `confirmDeletion: true` |
| `update_default_branch` | Change default branch | Write |

## Input Validation
- `branchName`: Required string
- `commitId`: Full 40-char SHA for create operations
- `confirmDeletion`: Boolean, must be `true` for delete operations

## Error Handling
| Error | Cause | Action |
|-------|-------|--------|
| `BranchDoesNotExistException` | Invalid branch name | Return error |
| `BranchNameExistsException` | Duplicate branch | Return error |
| `DefaultBranchCannotBeDeletedException` | Trying to delete default | Return error |
| `ThrottlingException` | Rate limit | Exponential backoff |

## Edge Cases
- `list_branches` uses pagination to handle repos with many branches
- Cannot delete the default branch — AWS blocks this automatically
- `create_branch` requires an existing commit ID to point to
