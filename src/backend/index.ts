import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import { Context, Hono } from "hono";
export { Hono };
export * from "better-auth";

export interface AuthConfig {
    /**
     * The database instance or D1 binding.
     * If passing a D1Database binding, the 'd1' provider will be used automatically.
     * If passing a pre-initialized Drizzle instance, you must specify the provider if it's not 'sqlite'.
     */
    database: D1Database | any;
    secret: string;
    baseUrl?: string;
    /**
     * Explicitly specify the database provider.
     * Defaults to 'sqlite' (which works for D1).
     * Use 'postgres' or 'mysql' if passing a Drizzle instance for those DBs.
     */
    provider?: "sqlite" | "postgres" | "mysql";
    /**
     * Use Cloudflare native crypto.subtle for password hashing to avoid CPU limits.
     * Defaults to true. Set to false to use Better Auth's default (Scrypt/Argon2).
     */
    useCloudflareNativeHashing?: boolean;
    /**
     * Email verification configuration.
     * For email/password signups, you can enable automatic verification emails.
     * OAuth signups (Google, GitHub) automatically set emailVerified = true.
     */
    emailVerification?: {
        /** Send verification email automatically on signup. Default: false */
        sendOnSignUp?: boolean;
        /** Auto sign in user after email verification. Default: true */
        autoSignInAfterVerification?: boolean;
        /** Callback to send verification email */
        sendVerificationEmail?: (data: { user: any; url: string; token: string }, request: any) => Promise<void> | void;
    };
    // Allow passing other better-auth options
    [key: string]: any;
}

import * as defaultSchema from "./schema";
import { hashPassword, verifyPassword } from "./native-hashing";

export const createAuth = (config: AuthConfig) => {
    let db;
    let provider = config.provider || "sqlite";

    // Check if it's a D1 binding (has prepare method)
    if (config.database && typeof config.database.prepare === 'function') {
        db = drizzle(config.database, { schema: defaultSchema });
    } else {
        // Assume it's a pre-initialized Drizzle instance
        db = config.database;
    }

    const { database, secret, baseUrl, provider: _, useCloudflareNativeHashing = true, emailVerification, ...rest } = config;

    // Map pluralized schema to singular better-auth model names
    let adapterOptions: any = {
        provider: provider as any,
        schema: {
            user: defaultSchema.users,
            session: defaultSchema.sessions,
            account: defaultSchema.accounts,
            verification: defaultSchema.verifications,
            organization: defaultSchema.organizations,
            member: defaultSchema.members,
            invitation: defaultSchema.invitations,
        }
    };

    // Extract emailAndPassword from rest if it exists, to merge deeply
    const emailConfig = (rest as any).emailAndPassword || { enabled: true };
    const { emailAndPassword, ...otherOptions } = rest as any;

    const emailPasswordOptions = {
        ...emailConfig
    };

    if (useCloudflareNativeHashing) {
        emailPasswordOptions.password = {
            hash: hashPassword,
            verify: verifyPassword
        };
    }

    const auth = betterAuth({
        database: drizzleAdapter(db, adapterOptions),
        secret: secret,
        baseURL: baseUrl,
        emailAndPassword: emailPasswordOptions,
        // Pass emailVerification config if provided
        ...(emailVerification ? { emailVerification } : {}),
        ...otherOptions,
    });

    return auth;
};

export const authMiddleware = (auth: any) => {
    return async (c: Context) => {
        return auth.handler(c.req.raw);
    };
};

export const createAuthApp = (config: AuthConfig) => {
    const auth = createAuth(config);
    const app = new Hono();

    app.all("/api/auth/*", async (c) => {
        return auth.handler(c.req.raw);
    });

    return { app, auth };
}

export * as schema from "./schema";
export * from "./utils";
