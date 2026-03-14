import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ListPullRequestsCommand,
  GetPullRequestCommand,
  CreatePullRequestCommand,
  UpdatePullRequestDescriptionCommand,
  UpdatePullRequestTitleCommand,
  UpdatePullRequestStatusCommand,
  MergePullRequestByFastForwardCommand,
  MergePullRequestBySquashCommand,
  MergePullRequestByThreeWayCommand,
  PostCommentForPullRequestCommand,
  GetCommentsForPullRequestCommand,
} from "@aws-sdk/client-codecommit";
import { getCodeCommitClient, withRetry, formatAwsError } from "../aws-client.js";

export function registerPullRequestTools(server: McpServer): void {

  // ─── List Pull Requests ───
  server.tool(
    "list_pull_requests",
    "List pull requests in a CodeCommit repository. Can filter by status (OPEN or CLOSED).",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      pullRequestStatus: z
        .enum(["OPEN", "CLOSED"])
        .optional()
        .describe("Filter by pull request status"),
    },
    async ({ repositoryName, pullRequestStatus }) => {
      try {
        const client = getCodeCommitClient();
        const pullRequestIds: string[] = [];
        let nextToken: string | undefined;

        do {
          const response = await withRetry(() =>
            client.send(
              new ListPullRequestsCommand({
                repositoryName,
                pullRequestStatus: pullRequestStatus as any,
                nextToken,
              }),
            ),
          );
          if (response.pullRequestIds) {
            pullRequestIds.push(...response.pullRequestIds);
          }
          nextToken = response.nextToken;
        } while (nextToken);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { repositoryName, pullRequestIds, count: pullRequestIds.length },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: formatAwsError(error) }],
          isError: true,
        };
      }
    },
  );

  // ─── Get Pull Request ───
  server.tool(
    "get_pull_request",
    "Get detailed information about a specific pull request, including targets, status, and merge metadata.",
    {
      pullRequestId: z
        .string()
        .describe("The system-generated ID of the pull request"),
    },
    async ({ pullRequestId }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(new GetPullRequestCommand({ pullRequestId })),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.pullRequest, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: formatAwsError(error) }],
          isError: true,
        };
      }
    },
  );

  // ─── Create Pull Request ───
  server.tool(
    "create_pull_request",
    "Create a new pull request in a CodeCommit repository.",
    {
      title: z
        .string()
        .describe("The title of the pull request"),
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      sourceBranch: z
        .string()
        .describe("The source branch (branch with changes)"),
      destinationBranch: z
        .string()
        .describe("The destination branch (branch to merge into)"),
      description: z
        .string()
        .optional()
        .describe("A description of the pull request"),
    },
    async ({ title, repositoryName, sourceBranch, destinationBranch, description }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new CreatePullRequestCommand({
              title,
              description,
              targets: [
                {
                  repositoryName,
                  sourceReference: sourceBranch,
                  destinationReference: destinationBranch,
                },
              ],
            }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.pullRequest, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: formatAwsError(error) }],
          isError: true,
        };
      }
    },
  );

  // ─── Update Pull Request Title ───
  server.tool(
    "update_pull_request_title",
    "Update the title of an existing pull request.",
    {
      pullRequestId: z
        .string()
        .describe("The system-generated ID of the pull request"),
      title: z
        .string()
        .describe("The new title for the pull request"),
    },
    async ({ pullRequestId, title }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new UpdatePullRequestTitleCommand({ pullRequestId, title }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.pullRequest, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: formatAwsError(error) }],
          isError: true,
        };
      }
    },
  );

  // ─── Update Pull Request Description ───
  server.tool(
    "update_pull_request_description",
    "Update the description of an existing pull request.",
    {
      pullRequestId: z
        .string()
        .describe("The system-generated ID of the pull request"),
      description: z
        .string()
        .describe("The new description for the pull request"),
    },
    async ({ pullRequestId, description }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new UpdatePullRequestDescriptionCommand({
              pullRequestId,
              description,
            }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.pullRequest, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: formatAwsError(error) }],
          isError: true,
        };
      }
    },
  );

  // ─── Update Pull Request Status ───
  server.tool(
    "update_pull_request_status",
    "Close or reopen a pull request by updating its status.",
    {
      pullRequestId: z
        .string()
        .describe("The system-generated ID of the pull request"),
      pullRequestStatus: z
        .enum(["OPEN", "CLOSED"])
        .describe("The new status for the pull request"),
    },
    async ({ pullRequestId, pullRequestStatus }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new UpdatePullRequestStatusCommand({
              pullRequestId,
              pullRequestStatus: pullRequestStatus as any,
            }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.pullRequest, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: formatAwsError(error) }],
          isError: true,
        };
      }
    },
  );

  // ─── Merge Pull Request ───
  server.tool(
    "merge_pull_request",
    "Merge a pull request using the specified merge strategy (fast-forward, squash, or three-way).",
    {
      pullRequestId: z
        .string()
        .describe("The system-generated ID of the pull request"),
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      mergeStrategy: z
        .enum(["fast-forward", "squash", "three-way"])
        .optional()
        .default("fast-forward")
        .describe("The merge strategy to use (default: fast-forward)"),
    },
    async ({ pullRequestId, repositoryName, mergeStrategy }) => {
      try {
        const client = getCodeCommitClient();
        let response;

        switch (mergeStrategy) {
          case "squash":
            response = await withRetry(() =>
              client.send(
                new MergePullRequestBySquashCommand({
                  pullRequestId,
                  repositoryName,
                }),
              ),
            );
            break;
          case "three-way":
            response = await withRetry(() =>
              client.send(
                new MergePullRequestByThreeWayCommand({
                  pullRequestId,
                  repositoryName,
                }),
              ),
            );
            break;
          case "fast-forward":
          default:
            response = await withRetry(() =>
              client.send(
                new MergePullRequestByFastForwardCommand({
                  pullRequestId,
                  repositoryName,
                }),
              ),
            );
            break;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.pullRequest, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: formatAwsError(error) }],
          isError: true,
        };
      }
    },
  );

  // ─── Post Comment on Pull Request ───
  server.tool(
    "post_comment_on_pull_request",
    "Post a comment on a pull request.",
    {
      pullRequestId: z
        .string()
        .describe("The system-generated ID of the pull request"),
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      beforeCommitId: z
        .string()
        .describe("The commit ID of the 'before' state"),
      afterCommitId: z
        .string()
        .describe("The commit ID of the 'after' state"),
      content: z
        .string()
        .describe("The content of the comment"),
    },
    async ({ pullRequestId, repositoryName, beforeCommitId, afterCommitId, content }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new PostCommentForPullRequestCommand({
              pullRequestId,
              repositoryName,
              beforeCommitId,
              afterCommitId,
              content,
            }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.comment, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: formatAwsError(error) }],
          isError: true,
        };
      }
    },
  );

  // ─── Get Comments for Pull Request ───
  server.tool(
    "get_comments_for_pull_request",
    "Get all comments posted on a pull request.",
    {
      pullRequestId: z
        .string()
        .describe("The system-generated ID of the pull request"),
    },
    async ({ pullRequestId }) => {
      try {
        const client = getCodeCommitClient();
        const comments: any[] = [];
        let nextToken: string | undefined;

        do {
          const response = await withRetry(() =>
            client.send(
              new GetCommentsForPullRequestCommand({
                pullRequestId,
                nextToken,
              }),
            ),
          );
          if (response.commentsForPullRequestData) {
            comments.push(...response.commentsForPullRequestData);
          }
          nextToken = response.nextToken;
        } while (nextToken);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { pullRequestId, comments, count: comments.length },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text" as const, text: formatAwsError(error) }],
          isError: true,
        };
      }
    },
  );
}
