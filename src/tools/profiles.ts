import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listAwsProfiles,
  getActiveProfile,
  setActiveProfile,
  clearClientCache,
} from "../aws-client.js";

export function registerProfileTools(server: McpServer): void {
  // ─── List Profiles ───
  server.tool(
    "list_profiles",
    "List all available AWS CLI profiles from ~/.aws/config and ~/.aws/credentials. Shows which profile is currently active.",
    {},
    async () => {
      const profiles = listAwsProfiles();
      const active = getActiveProfile();

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                activeProfile: active || "(default credential chain)",
                availableProfiles: profiles,
                count: profiles.length,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ─── Switch Profile ───
  server.tool(
    "switch_profile",
    "Switch the active AWS profile for all subsequent tool calls. Use list_profiles to see available profiles.",
    {
      profile: z
        .string()
        .describe("AWS profile name to switch to (must exist in ~/.aws/config or ~/.aws/credentials)"),
    },
    async ({ profile }) => {
      const available = listAwsProfiles();

      if (!available.includes(profile)) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: `Profile '${profile}' not found`,
                  availableProfiles: available,
                  hint: "Use list_profiles to see all available profiles",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }

      const previousProfile = getActiveProfile();
      setActiveProfile(profile);
      clearClientCache(); // Clear cache so new profile is used

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                switched: true,
                previousProfile: previousProfile || "(default credential chain)",
                activeProfile: profile,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ─── Get Active Profile ───
  server.tool(
    "get_active_profile",
    "Get the currently active AWS profile being used for CodeCommit operations.",
    {},
    async () => {
      const active = getActiveProfile();
      const region = process.env.AWS_REGION || "us-east-1";

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                activeProfile: active || "(default credential chain)",
                region,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
