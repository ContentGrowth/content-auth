import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const createClient = (baseUrl?: string) => {
    return createAuthClient({
        baseURL: baseUrl,
        plugins: [
            organizationClient()
        ]
    });
};

export const authClient = createClient();
