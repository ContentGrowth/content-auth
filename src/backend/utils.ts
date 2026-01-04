
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
