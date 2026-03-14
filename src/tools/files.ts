import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  GetFileCommand,
  GetFolderCommand,
  PutFileCommand,
  DeleteFileCommand,
  GetBranchCommand,
} from "@aws-sdk/client-codecommit";
import { getCodeCommitClient, withRetry, formatAwsError } from "../aws-client.js";

export function registerFileTools(server: McpServer): void {

  // ─── Get File ───
  server.tool(
    "get_file",
    "Get the content of a file from a CodeCommit repository. Returns the file content decoded as UTF-8 text.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      filePath: z
        .string()
        .describe("The full path to the file (e.g., 'src/index.ts')"),
      commitSpecifier: z
        .string()
        .optional()
        .describe(
          "Branch name, tag, or commit ID to read from. Defaults to the repository default branch.",
        ),
    },
    async ({ repositoryName, filePath, commitSpecifier }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new GetFileCommand({
              repositoryName,
              filePath,
              commitSpecifier,
            }),
          ),
        );

        // Decode file content from Uint8Array to string
        const content = response.fileContent
          ? new TextDecoder().decode(response.fileContent)
          : "";

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  filePath: response.filePath,
                  fileSize: response.fileSize,
                  blobId: response.blobId,
                  commitId: response.commitId,
                  fileMode: response.fileMode,
                  fileContent: content,
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

  // ─── Get Folder ───
  server.tool(
    "get_folder",
    "List the contents of a folder/directory in a CodeCommit repository. Returns files, subfolders, symbolic links, and submodules.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      folderPath: z
        .string()
        .describe("The full path to the folder (use '/' for root)"),
      commitSpecifier: z
        .string()
        .optional()
        .describe(
          "Branch name, tag, or commit ID. Defaults to the repository default branch.",
        ),
    },
    async ({ repositoryName, folderPath, commitSpecifier }) => {
      try {
        const client = getCodeCommitClient();
        const response = await withRetry(() =>
          client.send(
            new GetFolderCommand({
              repositoryName,
              folderPath,
              commitSpecifier,
            }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  folderPath: response.folderPath,
                  commitId: response.commitId,
                  files: response.files?.map((f) => ({
                    absolutePath: f.absolutePath,
                    relativePath: f.relativePath,
                    fileMode: f.fileMode,
                    blobId: f.blobId,
                  })),
                  subFolders: response.subFolders?.map((f) => ({
                    absolutePath: f.absolutePath,
                    relativePath: f.relativePath,
                  })),
                  symbolicLinks: response.symbolicLinks?.map((l) => ({
                    absolutePath: l.absolutePath,
                    relativePath: l.relativePath,
                    fileMode: l.fileMode,
                  })),
                  subModules: response.subModules?.map((m) => ({
                    absolutePath: m.absolutePath,
                    relativePath: m.relativePath,
                    commitId: m.commitId,
                  })),
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

  // ─── Put File ───
  server.tool(
    "put_file",
    "Create or update a file in a CodeCommit repository. This creates a new commit with the file change.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      branchName: z
        .string()
        .describe("The branch to commit the file to"),
      filePath: z
        .string()
        .describe("The full path for the file (e.g., 'src/utils.ts')"),
      fileContent: z
        .string()
        .describe("The content to write to the file"),
      commitMessage: z
        .string()
        .describe("The commit message for this file change"),
      name: z
        .string()
        .optional()
        .describe("The name of the commit author"),
      email: z
        .string()
        .optional()
        .describe("The email of the commit author"),
    },
    async ({ repositoryName, branchName, filePath, fileContent, commitMessage, name, email }) => {
      try {
        const client = getCodeCommitClient();
        // Get the latest commit ID for the branch (needed as parentCommitId)
        const branchResponse = await withRetry(() =>
          client.send(
            new GetBranchCommand({ repositoryName, branchName }),
          ),
        );

        const parentCommitId = branchResponse.branch?.commitId;

        const fileContentBuffer = new TextEncoder().encode(fileContent);

        const response = await withRetry(() =>
          client.send(
            new PutFileCommand({
              repositoryName,
              branchName,
              filePath,
              fileContent: fileContentBuffer,
              commitMessage,
              parentCommitId,
              name,
              email,
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
                  blobId: response.blobId,
                  treeId: response.treeId,
                  filePath,
                  branchName,
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

  // ─── Delete File ───
  server.tool(
    "delete_file",
    "Delete a file from a CodeCommit repository. REQUIRES explicit confirmation. Creates a commit that removes the file.",
    {
      repositoryName: z
        .string()
        .describe("The name of the repository"),
      branchName: z
        .string()
        .describe("The branch to delete the file from"),
      filePath: z
        .string()
        .describe("The full path to the file to delete"),
      commitMessage: z
        .string()
        .describe("The commit message for the file deletion"),
      confirmDeletion: z
        .boolean()
        .describe("Must be set to true to confirm file deletion"),
      name: z
        .string()
        .optional()
        .describe("The name of the commit author"),
      email: z
        .string()
        .optional()
        .describe("The email of the commit author"),
    },
    async ({ repositoryName, branchName, filePath, commitMessage, confirmDeletion, name, email }) => {
      if (!confirmDeletion) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Deletion aborted: confirmDeletion must be set to true.",
            },
          ],
          isError: true,
        };
      }

      try {
        const client = getCodeCommitClient();
        // Read-before-write: get the current file state
        const fileResponse = await withRetry(() =>
          client.send(
            new GetFileCommand({ repositoryName, filePath }),
          ),
        );

        // Get the latest commit ID for the branch
        const branchResponse = await withRetry(() =>
          client.send(
            new GetBranchCommand({ repositoryName, branchName }),
          ),
        );

        const response = await withRetry(() =>
          client.send(
            new DeleteFileCommand({
              repositoryName,
              branchName,
              filePath,
              parentCommitId: branchResponse.branch?.commitId,
              commitMessage,
              name,
              email,
            }),
          ),
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  deleted: true,
                  commitId: response.commitId,
                  blobId: response.blobId,
                  filePath: response.filePath,
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
