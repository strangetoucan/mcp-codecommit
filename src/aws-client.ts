import { CodeCommitClient } from "@aws-sdk/client-codecommit";
import { fromIni } from "@aws-sdk/credential-providers";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// ─── Multi-Profile Client Cache ───
const clientCache = new Map<string, CodeCommitClient>();
let activeProfile: string | undefined = process.env.AWS_PROFILE || undefined;

/**
 * Get or create a CodeCommitClient for the given profile.
 * Uses a cache to avoid creating duplicate clients.
 *
 * @param profile - AWS profile name. If omitted, uses the active profile.
 *                  If no active profile, uses default credential chain.
 */
export function getCodeCommitClient(profile?: string): CodeCommitClient {
  const effectiveProfile = profile || activeProfile;
  const cacheKey = effectiveProfile || "__default__";

  if (!clientCache.has(cacheKey)) {
    const region = process.env.AWS_REGION || "us-east-1";

    const clientConfig: Record<string, any> = { region };

    if (effectiveProfile) {
      clientConfig.credentials = fromIni({ profile: effectiveProfile });
    }

    clientCache.set(cacheKey, new CodeCommitClient(clientConfig));
  }

  return clientCache.get(cacheKey)!;
}

/**
 * Set the active AWS profile for subsequent tool calls.
 */
export function setActiveProfile(profile: string | undefined): void {
  activeProfile = profile;
}

/**
 * Get the current active profile name.
 */
export function getActiveProfile(): string | undefined {
  return activeProfile;
}

/**
 * List available AWS profiles from ~/.aws/config and ~/.aws/credentials.
 */
export function listAwsProfiles(): string[] {
  const profiles = new Set<string>();

  const configPath = join(homedir(), ".aws", "config");
  const credentialsPath = join(homedir(), ".aws", "credentials");

  // Parse ~/.aws/config (profiles are listed as [profile name] except [default])
  if (existsSync(configPath)) {
    const content = readFileSync(configPath, "utf-8");
    const profileRegex = /^\[(?:profile\s+)?(.+?)\]$/gm;
    let match;
    while ((match = profileRegex.exec(content)) !== null) {
      profiles.add(match[1]);
    }
  }

  // Parse ~/.aws/credentials (profiles are listed as [name])
  if (existsSync(credentialsPath)) {
    const content = readFileSync(credentialsPath, "utf-8");
    const profileRegex = /^\[(.+?)\]$/gm;
    let match;
    while ((match = profileRegex.exec(content)) !== null) {
      profiles.add(match[1]);
    }
  }

  return Array.from(profiles).sort();
}

/**
 * Clear the client cache (useful when switching profiles).
 */
export function clearClientCache(): void {
  clientCache.clear();
}

/**
 * Helper to wrap AWS SDK calls with error handling and retry logic.
 * Implements exponential backoff for throttling errors (max 3 retries).
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Only retry on throttling errors
      if (error.name === "ThrottlingException" && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

/**
 * Format AWS errors into clean, informative messages for MCP clients.
 */
export function formatAwsError(error: any): string {
  const code = error.name || error.Code || "UnknownError";
  const message = error.message || "An unknown error occurred";
  return `AWS CodeCommit Error [${code}]: ${message}`;
}
