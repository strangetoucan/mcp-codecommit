import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ListBranchesCommand,
  GetBranchCommand,
  CreateBranchCommand,
  DeleteBranchCommand,
  UpdateDefaultBranchCommand,
} from "@aws-sdk/client-codecommit";
import { getCodeCommitClient, withRetry, formatAwsError } from "../aws-client.js";

export function registerBranchTools(server: McpServer): void {

  // ─── List Branches ───
  server.tool(
    "list_branches",
    "List all branches in a CodeCommit repository.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
    },
    async ({ repositoryName }) => {
      try {
        const client = getCodeCommitClient();
        const branches: string[] = [];
        let nextToken: string | undefined;

        do {
          const response = await withRetry(() =>
            client.send(
              new ListBranchesCommand({ repositoryName, nextToken }),
            ),
          );
          if (response.branches) {
            branches.push(...response.branches);
          }
          nextToken = response.nextToken;
        } while (nextToken);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ repositoryName, branches, count: branches.length }, null, 2),
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

  // ─── Get Branch ───
  server.tool(
    "get_branch",
    "Get details of a specific branch in a CodeCommit repository, including the head commit ID.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      branchName: z
        .string()
        .describe("The name of the branch"),
    },
    async ({ repositoryName, branchName }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(new GetBranchCommand({ repositoryName, branchName })),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.branch, null, 2),
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

  // ─── Create Branch ───
  server.tool(
    "create_branch",
    "Create a new branch in a CodeCommit repository.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      branchName: z
        .string()
        .describe("The name of the new branch"),
      commitId: z
        .string()
        .describe("The commit ID to point the new branch to"),
    },
    async ({ repositoryName, branchName, commitId }) => {
      try {
        const client = getCodeCommitClient();
        await withRetry(() =>
          client.send(
            new CreateBranchCommand({ repositoryName, branchName, commitId }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { created: true, repositoryName, branchName, commitId },
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

  // ─── Delete Branch ───
  server.tool(
    "delete_branch",
    "Delete a branch from a CodeCommit repository. REQUIRES explicit confirmation via confirmDeletion parameter. Cannot delete the default branch.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      branchName: z
        .string()
        .describe("The name of the branch to delete"),
      confirmDeletion: z
        .boolean()
        .describe(
          "Must be set to true to confirm branch deletion. This is a destructive operation.",
        ),
    },
    async ({ repositoryName, branchName, confirmDeletion }) => {
      if (!confirmDeletion) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Deletion aborted: confirmDeletion must be set to true. Branch deletion is a destructive operation.",
            },
          ],
          isError: true,
        };
      }

      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new DeleteBranchCommand({ repositoryName, branchName }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  deleted: true,
                  deletedBranch: response.deletedBranch,
                },
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

  // ─── Update Default Branch ───
  server.tool(
    "update_default_branch",
    "Change the default branch for a CodeCommit repository.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      defaultBranchName: z
        .string()
        .describe("The name of the branch to set as default"),
    },
    async ({ repositoryName, defaultBranchName }) => {
      try {
        const client = getCodeCommitClient();
        await withRetry(() =>
          client.send(
            new UpdateDefaultBranchCommand({
              repositoryName,
              defaultBranchName,
            }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { updated: true, repositoryName, defaultBranchName },
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
