import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export interface ContentAuthClientOptions {
    /**
     * Controls whether the session is re-fetched when the browser window
     * regains focus (e.g. lock/unlock screen, switching apps in a PWA).
     *
     * Defaults to `false`. Re-fetching on focus causes a React re-render
     * cascade that can interrupt active client-side sessions (e.g. vocabulary
     * review flows) by triggering component remounts.
     *
     * Set to `true` only for apps that need the session to be always
     * up-to-date immediately after the user returns to the tab.
     */
    refetchOnWindowFocus?: boolean;
}

export const createClient = (baseUrl?: string, options: ContentAuthClientOptions = {}) => {
    const { refetchOnWindowFocus = false } = options;
    return createAuthClient({
        baseURL: baseUrl,
        plugins: [
            organizationClient()
        ],
        sessionOptions: {
            refetchOnWindowFocus,
        },
    });
};

export const authClient = createClient();
