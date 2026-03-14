import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ListRepositoriesCommand,
  GetRepositoryCommand,
  CreateRepositoryCommand,
  DeleteRepositoryCommand,
  UpdateRepositoryDescriptionCommand,
} from "@aws-sdk/client-codecommit";
import { getCodeCommitClient, withRetry, formatAwsError } from "../aws-client.js";

export function registerRepositoryTools(server: McpServer): void {

  // ─── List Repositories ───
  server.tool(
    "list_repositories",
    "List all AWS CodeCommit repositories in the configured region. Returns repository names and IDs.",
    {
      sortBy: z
        .enum(["repositoryName", "lastModifiedDate"])
        .optional()
        .describe("Sort repositories by name or last modified date"),
      order: z
        .enum(["ascending", "descending"])
        .optional()
        .describe("Sort order"),
    },
    async ({ sortBy, order }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new ListRepositoriesCommand({
              sortBy: sortBy as any,
              order: order as any,
            }),
          ),
        );

        const repos = response.repositories || [];
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(repos, null, 2),
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

  // ─── Get Repository ───
  server.tool(
    "get_repository",
    "Get detailed information about a specific CodeCommit repository including clone URLs, default branch, and metadata.",
    {
      repositoryName: z
        .string()
        .describe("The name of the CodeCommit repository"),
    },
    async ({ repositoryName }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(new GetRepositoryCommand({ repositoryName })),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.repositoryMetadata, null, 2),
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

  // ─── Create Repository ───
  server.tool(
    "create_repository",
    "Create a new AWS CodeCommit repository.",
    {
      repositoryName: z
        .string()
        .describe("The name for the new repository"),
      repositoryDescription: z
        .string()
        .optional()
        .describe("A description of the repository"),
      tags: z
        .record(z.string())
        .optional()
        .describe("Tags to associate with the repository (key-value pairs)"),
    },
    async ({ repositoryName, repositoryDescription, tags }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new CreateRepositoryCommand({
              repositoryName,
              repositoryDescription,
              tags,
            }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response.repositoryMetadata, null, 2),
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

  // ─── Delete Repository ───
  server.tool(
    "delete_repository",
    "Delete an AWS CodeCommit repository. REQUIRES explicit confirmation via confirmDeletion parameter. This action is irreversible.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository to delete"),
      confirmDeletion: z
        .boolean()
        .describe(
          "Must be set to true to confirm deletion. This is a destructive operation.",
        ),
    },
    async ({ repositoryName, confirmDeletion }) => {
      if (!confirmDeletion) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Deletion aborted: confirmDeletion must be set to true. This is a destructive and irreversible operation.",
            },
          ],
          isError: true,
        };
      }

      try {
        const client = getCodeCommitClient();
        // Read-before-write: show current state
        const getResponse = await withRetry(() =>
          client.send(new GetRepositoryCommand({ repositoryName })),
        );

        const response = await withRetry(() =>
          client.send(new DeleteRepositoryCommand({ repositoryName })),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  deleted: true,
                  repositoryId: response.repositoryId,
                  deletedRepository: getResponse.repositoryMetadata?.repositoryName,
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

  // ─── Update Repository Description ───
  server.tool(
    "update_repository_description",
    "Update the description of an existing CodeCommit repository.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository to update"),
      repositoryDescription: z
        .string()
        .describe("The new description for the repository"),
    },
    async ({ repositoryName, repositoryDescription }) => {
      try {
        const client = getCodeCommitClient();
        await withRetry(() =>
          client.send(
            new UpdateRepositoryDescriptionCommand({
              repositoryName,
              repositoryDescription,
            }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  updated: true,
                  repositoryName,
                  newDescription: repositoryDescription,
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
