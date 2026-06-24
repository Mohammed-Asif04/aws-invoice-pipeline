// ============================================================================
// AWS Invoice Pipeline — Secrets Manager Helper
// Caches secrets for Lambda container re-use
// ============================================================================

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { createLogger } from './logger';

const logger = createLogger('secrets-manager');
const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

// In-memory cache for the Lambda execution context (container re-use)
const secretsCache = new Map<string, { value: string; expiresAt: number }>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Retrieve a secret from AWS Secrets Manager with in-memory caching.
 * Secrets are cached for 5 minutes within the Lambda container.
 */
export async function getSecret(secretId: string): Promise<string> {
  // Check cache first
  const cached = secretsCache.get(secretId);
  if (cached && Date.now() < cached.expiresAt) {
    logger.debug('Secret retrieved from cache', { secretId });
    return cached.value;
  }

  try {
    const endTimer = logger.startTimer('Fetching secret from Secrets Manager');

    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await client.send(command);

    endTimer();

    const secretValue = response.SecretString;
    if (!secretValue) {
      throw new Error(`Secret ${secretId} has no string value`);
    }

    // Cache the secret
    secretsCache.set(secretId, {
      value: secretValue,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    logger.info('Secret fetched and cached', { secretId });
    return secretValue;
  } catch (error) {
    logger.error('Failed to retrieve secret', error, { secretId });
    throw error;
  }
}

/**
 * Retrieve a secret and parse it as JSON
 */
export async function getSecretJson<T = Record<string, string>>(
  secretId: string
): Promise<T> {
  const raw = await getSecret(secretId);
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    logger.error('Failed to parse secret as JSON', error, { secretId });
    throw new Error(`Secret ${secretId} is not valid JSON`);
  }
}

/**
 * Clear the secrets cache (useful for testing)
 */
export function clearSecretsCache(): void {
  secretsCache.clear();
  logger.info('Secrets cache cleared');
}
