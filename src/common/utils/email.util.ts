/**
 * Extract tenant domain from email address
 * Example: john.doe@acme-corp.com -> acme-corp
 * Example: user@company.com -> company
 * Example: user@sub.company.co.uk -> sub.company.co
 */
export function extractTenantDomainFromEmail(email: string): string {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    throw new Error('Invalid email format');
  }

  const domain = parts[1].toLowerCase().trim(); // Get domain part (e.g., "acme-corp.com")

  if (!domain) {
    throw new Error('Invalid email domain');
  }

  // Remove TLD (.com, .org, .net, etc.)
  // Split by dot and take all parts except the last one
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    throw new Error('Invalid email domain format');
  }

  // Remove the last part (TLD) and join the rest
  // This handles cases like: acme-corp.com, sub.company.co.uk
  const tenantDomain = domainParts.slice(0, -1).join('.');

  return tenantDomain;
}

/**
 * Validate that email domain matches the organization's registered domain
 * Example: email "user@test.com" with companyDomain "test" -> true
 * Example: email "user@test.com" with companyDomain "acme" -> false
 */
export function validateEmailDomain(
  email: string,
  companyDomain: string,
): boolean {
  if (!email || !companyDomain) {
    return false;
  }

  try {
    const emailDomain = extractTenantDomainFromEmail(email);
    return emailDomain.toLowerCase() === companyDomain.toLowerCase();
  } catch (error) {
    return false;
  }
}

/**
 * Get full email domain from email address
 * Example: user@test.com -> test.com
 * Example: user@sub.company.co.uk -> sub.company.co.uk
 */
export function getFullEmailDomain(email: string): string {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    throw new Error('Invalid email format');
  }

  return parts[1].toLowerCase().trim();
}
