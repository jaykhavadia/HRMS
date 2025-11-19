/**
 * Utility functions for encoding/decoding tenant information in tokens
 */

/**
 * Encode tenant domain into token
 * Format: {tenantDomain}:{token}
 * Example: acme-corp:550e8400-e29b-41d4-a716-446655440000
 */
export function encodeTokenWithTenant(
  tenantDomain: string,
  token: string,
): string {
  return `${tenantDomain}:${token}`;
}

/**
 * Decode tenant domain and token from encoded string
 * Returns { tenantDomain, token } or null if invalid format
 */
export function decodeTokenWithTenant(
  encodedToken: string,
): { tenantDomain: string; token: string } | null {
  if (!encodedToken || !encodedToken.includes(':')) {
    return null;
  }

  const parts = encodedToken.split(':');
  if (parts.length !== 2) {
    return null;
  }

  const [tenantDomain, token] = parts;
  if (!tenantDomain || !token) {
    return null;
  }

  return { tenantDomain: tenantDomain.trim(), token: token.trim() };
}

