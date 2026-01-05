
/**
 * Generates a formatted invitation link from the Better-Auth invitation data.
 * 
 * Handles:
 * 1. Default Better-Auth fields (link, url)
 * 2. Fallback construction using baseUrl and invitation ID
 * 3. Markdown formatting for email clients causing auto-link issues
 * 
 * @param data The data object received in the sendInvitationEmail hook
 * @param baseUrl The base URL of the application (e.g., https://app.example.com)
 * @returns An object containing the raw link and the markdown formatted link
 */
export function getInvitationLink(data: any, baseUrl: string) {
    // 1. Try to find the link in the data
    let rawLink = data.link || data.url;

    // 2. Fallback: Construct it manually if missing
    if (!rawLink) {
        // Remove trailing slash from baseUrl if present
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        // Assume standard route /accept-invitation/:id
        rawLink = `${cleanBaseUrl}/accept-invitation/${data.id}`;
    }

    // 3. (REMOVED) Format as Markdown for email clients
    // This is now handled automatically by the EmailService

    return {
        link: rawLink
    };
}

/**
 * Extracts the session token from the request.
 * Checks "Authorization: Bearer <token>" header first.
 * Then checks cookies for "better-auth.session_token", "session_token", and "__Secure-better-auth.session_token".
 * 
 * @param req The Request object
 * @returns The session token or null if not found
 */
export function getSessionToken(req: Request): string | null {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    const cookieHeader = req.headers.get('Cookie');
    if (!cookieHeader) return null;

    // Parse cookies manually to be framework agnostic
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(c => {
        const [key, value] = c.trim().split('=');
        if (key && value) {
            cookies[key] = value;
        }
    });

    return cookies['better-auth.session_token'] ||
        cookies['session_token'] ||
        cookies['__Secure-better-auth.session_token'] ||
        null;
}

/**
 * Programmatically triggers a password reset email for a user.
 * This bypasses the need for an HTTP call by using better-auth's internal API.
 * 
 * @param auth The auth instance created by createAuth()
 * @param email The user's email address
 * @returns Promise that resolves when the reset email is triggered
 */
export async function triggerPasswordReset(auth: any, email: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Use better-auth's internal forgetPassword API
        const result = await auth.api.forgetPassword({
            body: { email }
        });

        return { success: true };
    } catch (e: any) {
        console.error('[triggerPasswordReset] Failed:', e);
        return { success: false, error: e.message || 'Failed to trigger password reset' };
    }
}
