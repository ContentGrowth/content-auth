/**
 * Email Normalization Utilities
 * 
 * Normalizes email addresses to prevent duplicate accounts through
 * the "Gmail dot trick" and plus-addressing.
 */

/**
 * Normalizes an email address for duplicate detection.
 * - Gmail addresses: strips dots and plus-addressing, normalizes googlemail.com
 * - Other addresses: lowercases only
 * 
 * @param email - The email address to normalize
 * @returns The normalized email address
 */
export function normalizeEmail(email: string): string {
    const lowerEmail = email.toLowerCase().trim();
    const atIndex = lowerEmail.indexOf('@');

    if (atIndex === -1) {
        return lowerEmail; // Invalid email, return as-is
    }

    const local = lowerEmail.substring(0, atIndex);
    const domain = lowerEmail.substring(atIndex + 1);

    // Normalize googlemail.com to gmail.com
    const normalizedDomain = domain === 'googlemail.com' ? 'gmail.com' : domain;

    if (normalizedDomain === 'gmail.com') {
        // Strip plus-addressing (e.g., user+alias@gmail.com -> user)
        const localWithoutPlus = local.split('+')[0];
        // Strip all dots from local part
        const normalizedLocal = localWithoutPlus.replace(/\./g, '');
        return `${normalizedLocal}@gmail.com`;
    }

    // For non-Gmail addresses, just lowercase
    return lowerEmail;
}

/**
 * Checks if an email is a Gmail address (including googlemail.com)
 */
export function isGmailAddress(email: string): boolean {
    const lowerEmail = email.toLowerCase();
    return lowerEmail.endsWith('@gmail.com') || lowerEmail.endsWith('@googlemail.com');
}
