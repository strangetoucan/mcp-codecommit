import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  GetCommitCommand,
  CreateCommitCommand,
  GetDifferencesCommand,
  BatchGetCommitsCommand,
  GetBranchCommand,
} from "@aws-sdk/client-codecommit";
import { getCodeCommitClient, withRetry, formatAwsError } from "../aws-client.js";

export function registerCommitTools(server: McpServer): void {

  // ─── Get Commit ───
  server.tool(
    "get_commit",
    "Get detailed information about a specific commit in a CodeCommit repository.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      commitId: z
        .string()
        .describe("The full commit ID"),
    },
    async ({ repositoryName, commitId }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new GetCommitCommand({ repositoryName, commitId }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.commit, null, 2),
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

  // ─── Create Commit ───
  server.tool(
    "create_commit",
    "Create a multi-file commit in a CodeCommit repository. Can add, update, and delete multiple files in a single commit.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      branchName: z
        .string()
        .describe("The branch to commit to"),
      commitMessage: z
        .string()
        .describe("The commit message"),
      authorName: z
        .string()
        .optional()
        .describe("The name of the commit author"),
      authorEmail: z
        .string()
        .optional()
        .describe("The email of the commit author"),
      putFiles: z
        .array(
          z.object({
            filePath: z.string().describe("Path of the file to create/update"),
            fileContent: z.string().describe("Content of the file"),
            fileMode: z
              .enum(["NORMAL", "EXECUTABLE", "SYMLINK"])
              .optional()
              .describe("File mode (default: NORMAL)"),
          }),
        )
        .optional()
        .describe("Files to add or update"),
      deleteFiles: z
        .array(
          z.object({
            filePath: z.string().describe("Path of the file to delete"),
          }),
        )
        .optional()
        .describe("Files to delete"),
    },
    async ({ repositoryName, branchName, commitMessage, authorName, authorEmail, putFiles, deleteFiles }) => {
      try {
        const client = getCodeCommitClient();
        // Get parent commit ID from branch
        const branchResponse = await withRetry(() =>
          client.send(
            new GetBranchCommand({ repositoryName, branchName }),
          ),
        );

        const parentCommitId = branchResponse.branch?.commitId;

        // Convert file contents to Uint8Array
        const putFilesFormatted = putFiles?.map((f) => ({
          filePath: f.filePath,
          fileContent: new TextEncoder().encode(f.fileContent),
          fileMode: f.fileMode as any,
        }));

        const response = await withRetry(() =>
          client.send(
            new CreateCommitCommand({
              repositoryName,
              branchName,
              parentCommitId,
              commitMessage,
              authorName,
              email: authorEmail,
              putFiles: putFilesFormatted,
              deleteFiles,
            }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  commitId: response.commitId,
                  treeId: response.treeId,
                  filesAdded: response.filesAdded?.map((f) => f.absolutePath),
                  filesUpdated: response.filesUpdated?.map((f) => f.absolutePath),
                  filesDeleted: response.filesDeleted?.map((f) => f.absolutePath),
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

  // ─── Get Differences ───
  server.tool(
    "get_differences",
    "Get the differences between two commit specifiers (branches, tags, or commit IDs). Shows files added, modified, and deleted.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      afterCommitSpecifier: z
        .string()
        .describe("The 'after' commit specifier (branch, tag, or commit ID)"),
      beforeCommitSpecifier: z
        .string()
        .optional()
        .describe(
          "The 'before' commit specifier. If omitted, compares against no previous commit (shows all files).",
        ),
    },
    async ({ repositoryName, afterCommitSpecifier, beforeCommitSpecifier }) => {
      try {
        const client = getCodeCommitClient();
        const differences: any[] = [];
        let nextToken: string | undefined;

        do {
          const response = await withRetry(() =>
            client.send(
              new GetDifferencesCommand({
                repositoryName,
                afterCommitSpecifier,
                beforeCommitSpecifier,
                NextToken: nextToken,
              }),
            ),
          );

          if (response.differences) {
            differences.push(
              ...response.differences.map((d) => ({
                changeType: d.changeType,
                beforeBlob: d.beforeBlob
                  ? { path: d.beforeBlob.path, blobId: d.beforeBlob.blobId, mode: d.beforeBlob.mode }
                  : null,
                afterBlob: d.afterBlob
                  ? { path: d.afterBlob.path, blobId: d.afterBlob.blobId, mode: d.afterBlob.mode }
                  : null,
              })),
            );
          }

          nextToken = response.NextToken;
        } while (nextToken);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { repositoryName, afterCommitSpecifier, beforeCommitSpecifier, differences, count: differences.length },
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

  // ─── Batch Get Commits ───
  server.tool(
    "batch_get_commits",
    "Get information about multiple commits at once from a CodeCommit repository.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      commitIds: z
        .array(z.string())
        .describe("Array of commit IDs to retrieve (max 25)"),
    },
    async ({ repositoryName, commitIds }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new BatchGetCommitsCommand({ commitIds, repositoryName }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  commits: response.commits,
                  errors: response.errors,
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
}
