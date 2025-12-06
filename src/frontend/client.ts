import { createAuthClient } from "better-auth/react";

export const createClient = (baseUrl?: string) => {
    return createAuthClient({
        baseURL: baseUrl,
    });
};

export const authClient = createClient();
