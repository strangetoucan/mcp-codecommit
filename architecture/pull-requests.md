# Pull Requests SOP

## Goal
Full PR lifecycle management — create, update, merge, comment.

## Tools
| Tool | Action | Safety |
|------|--------|--------|
| `list_pull_requests` | List PRs (paginated, filterable) | Read-only |
| `get_pull_request` | Get PR details + merge metadata | Read-only |
| `create_pull_request` | Create new PR | Write |
| `update_pull_request_title` | Update PR title | Write |
| `update_pull_request_description` | Update PR description | Write |
| `update_pull_request_status` | Close/reopen PR | Write |
| `merge_pull_request` | Merge via fast-forward/squash/three-way | Write |
| `post_comment_on_pull_request` | Post comment on PR | Write |
| `get_comments_for_pull_request` | Get all PR comments (paginated) | Read-only |

## Key Logic
- **`merge_pull_request`**: Supports 3 merge strategies via separate AWS commands
- **`list_pull_requests`**: Returns PR IDs (use `get_pull_request` for details)
- **`list_pull_requests`**: Full pagination support

## Merge Strategies
| Strategy | Command | Behavior |
|----------|---------|----------|
| `fast-forward` | `MergePullRequestByFastForwardCommand` | Linear history, no merge commit |
| `squash` | `MergePullRequestBySquashCommand` | All changes in one commit |
| `three-way` | `MergePullRequestByThreeWayCommand` | Standard merge with merge commit |

## Error Handling
| Error | Cause | Action |
|-------|-------|--------|
| `PullRequestDoesNotExistException` | Invalid PR ID | Return error |
| `PullRequestAlreadyClosedException` | PR already closed | Return error |
| `ManualMergeRequiredException` | Conflicts exist | Return error with context |
| `TipOfSourceReferenceIsDifferentException` | Source branch updated | May need new merge attempt |
