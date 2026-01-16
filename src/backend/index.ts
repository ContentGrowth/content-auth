import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import { Context, Hono } from "hono";
export { Hono };
export * from "better-auth";

// Export utilities for direct use
export { verifyTurnstile } from "./turnstile";
export { normalizeEmail, isGmailAddress } from "./email-normalize";

export interface TurnstileConfig {
    /** Cloudflare Turnstile secret key */
    secretKey: string;
}

export interface EmailNormalizationConfig {
    /** Enable email normalization for duplicate detection. Default: false */
    enabled: boolean;
    /** Column name in users table. Default: 'normalized_email' */
    columnName?: string;
}

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
    /**
     * Cloudflare Turnstile configuration for bot protection on email signups.
     * When configured, the AuthForm frontend will show a Turnstile challenge.
     */
    turnstile?: TurnstileConfig;
    /**
     * Email normalization for duplicate prevention (Gmail dot trick, plus-addressing).
     * Requires a 'normalized_email' column in the users table.
     */
    emailNormalization?: EmailNormalizationConfig;
    // Allow passing other better-auth options
    [key: string]: any;
}

import * as defaultSchema from "./schema";
import { hashPassword, verifyPassword } from "./native-hashing";
import { verifyTurnstile } from "./turnstile";
import { normalizeEmail } from "./email-normalize";

export const createAuth = (config: AuthConfig) => {
    let db;
    let rawDb = config.database; // Keep raw D1 reference for hooks
    let provider = config.provider || "sqlite";

    // Check if it's a D1 binding (has prepare method)
    if (config.database && typeof config.database.prepare === 'function') {
        db = drizzle(config.database, { schema: defaultSchema });
    } else {
        // Assume it's a pre-initialized Drizzle instance
        db = config.database;
    }

    const {
        database,
        secret,
        baseUrl,
        provider: _,
        useCloudflareNativeHashing = true,
        emailVerification,
        turnstile: turnstileConfig,
        emailNormalization,
        ...rest
    } = config;

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
    const { emailAndPassword, hooks: userHooks, ...otherOptions } = rest as any;

    const emailPasswordOptions = {
        ...emailConfig
    };

    if (useCloudflareNativeHashing) {
        emailPasswordOptions.password = {
            hash: hashPassword,
            verify: verifyPassword
        };
    }

    // Build hooks with Turnstile and email normalization support
    const normalizedEmailColumn = emailNormalization?.columnName || 'normalized_email';

    const contentAuthHooks: any = {
        before: async (context: any) => {
            const path = context.path || "";

            // --- Email Signup Protection: Turnstile & Normalization ---
            if (path.includes("/sign-up/email")) {
                try {
                    let body;
                    if (context.body) {
                        body = context.body;
                    } else {
                        try {
                            body = await context.request.clone().json();
                        } catch (e) {
                            // Not JSON body, skip
                        }
                    }

                    if (body) {
                        // 1. Verify Turnstile token (if configured)
                        if (turnstileConfig?.secretKey) {
                            const turnstileToken = body.turnstileToken;
                            if (!turnstileToken) {
                                console.warn('[ContentAuth] Email signup missing Turnstile token');
                                return {
                                    status: 400,
                                    body: JSON.stringify({
                                        success: false,
                                        code: 'TURNSTILE_REQUIRED',
                                        message: 'Please complete the security challenge'
                                    }),
                                    headers: { 'Content-Type': 'application/json' }
                                };
                            }

                            const { success, error } = await verifyTurnstile(turnstileConfig.secretKey, turnstileToken);
                            if (!success) {
                                console.warn(`[ContentAuth] Turnstile verification failed: ${error}`);
                                return {
                                    status: 400,
                                    body: JSON.stringify({
                                        success: false,
                                        code: 'TURNSTILE_FAILED',
                                        message: error || 'Security challenge failed. Please try again.'
                                    }),
                                    headers: { 'Content-Type': 'application/json' }
                                };
                            }
                        }

                        // 2. Email normalization check for duplicates
                        if (emailNormalization?.enabled && body.email && rawDb?.prepare) {
                            const normalized = normalizeEmail(body.email);
                            const existing = await rawDb.prepare(
                                `SELECT id FROM users WHERE ${normalizedEmailColumn} = ?`
                            ).bind(normalized).first();

                            if (existing) {
                                console.warn(`[ContentAuth] Duplicate normalized email detected: ${normalized}`);
                                return {
                                    status: 400,
                                    body: JSON.stringify({
                                        success: false,
                                        code: 'EMAIL_EXISTS',
                                        message: 'An account with this email already exists'
                                    }),
                                    headers: { 'Content-Type': 'application/json' }
                                };
                            }
                        }
                    }
                } catch (e: any) {
                    console.error('[ContentAuth] Email signup hook error:', e.message);
                }
            }

            // Call user-provided before hook if exists
            if (userHooks?.before) {
                return userHooks.before(context);
            }
            return;
        },
        after: async (context: any) => {
            const path = context.path || "";
            const user = context.user || context.response?.user || context.data?.user ||
                (context as any).context?.returned?.user || (context as any).context?.newSession?.user;

            // --- Set normalized_email for new users ---
            if (emailNormalization?.enabled && rawDb?.prepare) {
                if ((path.includes('/sign-up') || path.includes('/callback')) && user?.id && user?.email) {
                    try {
                        const normalized = normalizeEmail(user.email);
                        await rawDb.prepare(
                            `UPDATE users SET ${normalizedEmailColumn} = ? WHERE id = ? AND (${normalizedEmailColumn} IS NULL OR ${normalizedEmailColumn} != ?)`
                        ).bind(normalized, user.id, normalized).run();
                    } catch (e: any) {
                        console.error(`[ContentAuth] Failed to set normalized_email: ${e.message}`);
                    }
                }
            }

            // Call user-provided after hook if exists
            if (userHooks?.after) {
                return userHooks.after(context);
            }
            return {};
        }
    };

    const auth = betterAuth({
        database: drizzleAdapter(db, adapterOptions),
        secret: secret,
        baseURL: baseUrl,
        emailAndPassword: emailPasswordOptions,
        // Pass emailVerification config if provided
        ...(emailVerification ? { emailVerification } : {}),
        // Merge content-auth hooks with user hooks
        hooks: contentAuthHooks,
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
