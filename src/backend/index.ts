import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import { Context, Hono } from "hono";
export { Hono };
export * from "better-auth";

// Export utilities for direct use
export { verifyTurnstile } from "./turnstile";
export { normalizeEmail, isGmailAddress } from "./email-normalize";
export { hashPassword, verifyPassword } from "./native-hashing";

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

export interface SignInTrackingConfig {
    /** Enable sign-in tracking (lastSignedInAt column). Default: false */
    enabled: boolean;
    /** Column name for last sign-in timestamp. Default: 'lastSignedInAt' */
    columnName?: string;
}

/**
 * Field attribute for additional fields in custom schema
 */
export interface FieldAttribute {
    type: string | string[];
    required?: boolean;
    defaultValue?: any;
    input?: boolean;
}

/**
 * Table mapping configuration for a single model
 */
export interface TableMapping {
    /** Custom table name in the database */
    tableName?: string;
    /** Map Better Auth field names to your database column names */
    fields?: Record<string, string>;
    /** Additional fields in your custom table */
    additionalFields?: Record<string, FieldAttribute>;
}

/**
 * Custom schema mapping to use existing tables with Better Auth.
 * This allows you to map Better Auth's default table/column names to your existing database schema.
 * 
 * @example
 * ```typescript
 * schemaMapping: {
 *   user: {
 *     tableName: "tenant_admins",
 *     fields: { id: "firebase_uid", createdAt: "created_at" },
 *     additionalFields: { role: { type: "string" }, tenant_id: { type: "string" } }
 *   },
 *   organization: {
 *     tableName: "tenants",
 *     fields: { id: "tenant_id", metadata: "settings" }
 *   }
 * }
 * ```
 */
export interface SchemaMapping {
    /** Map Better Auth's 'user' model */
    user?: TableMapping;
    /** Map Better Auth's 'session' model */
    session?: TableMapping;
    /** Map Better Auth's 'account' model */
    account?: TableMapping;
    /** Map Better Auth's 'verification' model */
    verification?: TableMapping;
    /** Map Better Auth's 'organization' model (from organization plugin) */
    organization?: TableMapping;
    /** Map Better Auth's 'member' model (from organization plugin) */
    member?: TableMapping;
    /** Map Better Auth's 'invitation' model (from organization plugin) */
    invitation?: TableMapping;
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
     * Enable debug logging to see what config is passed to Better Auth.
     * Useful for troubleshooting configuration issues.
     * Default: false
     */
    debug?: boolean;
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
    /**
     * Sign-in tracking to record when users last signed in.
     * Useful for engagement analytics and identifying inactive users.
     * Requires a 'lastSignedInAt' column (or custom name) in the users table.
     */
    signInTracking?: SignInTrackingConfig;
    /**
     * Custom schema mapping to use existing tables with Better Auth.
     * Maps Better Auth's default table/column names to your existing database schema.
     * If not provided, uses default table names (users, sessions, accounts, etc.).
     */
    schemaMapping?: SchemaMapping;
    /**
     * Callback triggered when a new user signs up.
     * This includes email signups and OAuth signups (first time).
     */
    onSignup?: (user: any) => Promise<void> | void;
    /**
     * Callback triggered when a user signs in.
     * This triggers on every successful session creation (including signup).
     */
    onSignin?: (user: any) => Promise<void> | void;
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
        debug = false,
        provider: _,
        useCloudflareNativeHashing = true,
        emailVerification,
        turnstile: turnstileConfig,
        emailNormalization,
        signInTracking,
        onSignup,
        onSignin,
        schemaMapping,
        user,
        session,
        account,
        verification,
        organization,
        member,
        invitation,
        ...rest
    } = config;

    // Resolve table names and create dynamic Drizzle schema
    const userTableName = schemaMapping?.user?.tableName || "users";
    const sessionTableName = schemaMapping?.session?.tableName || "sessions";
    const accountTableName = schemaMapping?.account?.tableName || "accounts";
    const verificationTableName = schemaMapping?.verification?.tableName || "verifications";
    const orgTableName = schemaMapping?.organization?.tableName || "organizations";
    const memberTableName = schemaMapping?.member?.tableName || "members";
    const invitationTableName = schemaMapping?.invitation?.tableName || "invitations";

    // Merge additionalFields from both schemaMapping and direct config
    const mergedUserAdditionalFields = { ...schemaMapping?.user?.additionalFields, ...user?.additionalFields };
    const mergedSessionAdditionalFields = { ...schemaMapping?.session?.additionalFields, ...session?.additionalFields };
    const mergedAccountAdditionalFields = { ...schemaMapping?.account?.additionalFields, ...account?.additionalFields };
    const mergedVerificationAdditionalFields = { ...schemaMapping?.verification?.additionalFields, ...verification?.additionalFields };
    const mergedOrgAdditionalFields = { ...schemaMapping?.organization?.additionalFields, ...organization?.additionalFields };
    const mergedMemberAdditionalFields = { ...schemaMapping?.member?.additionalFields, ...member?.additionalFields };
    const mergedInvitationAdditionalFields = { ...schemaMapping?.invitation?.additionalFields, ...invitation?.additionalFields };

    // Create table objects (respecting dependency order) with merged additionalFields
    const usersTable = defaultSchema.createUsersTable(userTableName, schemaMapping?.user?.fields, mergedUserAdditionalFields);
    const organizationsTable = defaultSchema.createOrganizationsTable(orgTableName, schemaMapping?.organization?.fields, mergedOrgAdditionalFields);
    const sessionsTable = defaultSchema.createSessionsTable(sessionTableName, usersTable, schemaMapping?.session?.fields, mergedSessionAdditionalFields);
    const accountsTable = defaultSchema.createAccountsTable(accountTableName, usersTable, schemaMapping?.account?.fields, mergedAccountAdditionalFields);
    const verificationsTable = defaultSchema.createVerificationsTable(verificationTableName, schemaMapping?.verification?.fields, mergedVerificationAdditionalFields);
    const membersTable = defaultSchema.createMembersTable(memberTableName, organizationsTable, usersTable, schemaMapping?.member?.fields, mergedMemberAdditionalFields);
    const invitationsTable = defaultSchema.createInvitationsTable(invitationTableName, organizationsTable, usersTable, schemaMapping?.invitation?.fields, mergedInvitationAdditionalFields);

    // Determine keys for the schema object (Better Auth uses tableName as modelName if provided)
    const userKey = schemaMapping?.user?.tableName || "user";
    const sessionKey = schemaMapping?.session?.tableName || "session";
    const accountKey = schemaMapping?.account?.tableName || "account";
    const verificationKey = schemaMapping?.verification?.tableName || "verification";
    const orgKey = schemaMapping?.organization?.tableName || "organization";
    const memberKey = schemaMapping?.member?.tableName || "member";
    const invitationKey = schemaMapping?.invitation?.tableName || "invitation";

    // Map pluralized schema to singular (or custom) better-auth model names
    let adapterOptions: any = {
        provider: provider as any,
        schema: {
            [userKey]: usersTable,
            [sessionKey]: sessionsTable,
            [accountKey]: accountsTable,
            [verificationKey]: verificationsTable,
            [orgKey]: organizationsTable,
            [memberKey]: membersTable,
            [invitationKey]: invitationsTable,
        }
    };

    // Build Better Auth model configs from schemaMapping
    // These use modelName and fields to customize table/column names
    const buildModelConfig = (mapping?: TableMapping) => {
        if (!mapping) return undefined;
        const config: any = {};
        if (mapping.tableName) {
            config.modelName = mapping.tableName;
        }
        if (mapping.fields) {
            config.fields = mapping.fields;
        }
        if (mapping.additionalFields) {
            config.additionalFields = mapping.additionalFields;
        }
        return Object.keys(config).length > 0 ? config : undefined;
    };

    // Model configs for Better Auth (using schemaMapping if provided)
    const userConfig = buildModelConfig(schemaMapping?.user);
    const sessionConfig = buildModelConfig(schemaMapping?.session);
    const accountConfig = buildModelConfig(schemaMapping?.account);
    const verificationConfig = buildModelConfig(schemaMapping?.verification);

    if (debug) {
        console.log('[ContentAuth-DEBUG] ========================================');
        console.log('[ContentAuth-DEBUG] Configuration passed to content-auth:');
        console.log('[ContentAuth-DEBUG] - baseUrl:', baseUrl);
        console.log('[ContentAuth-DEBUG] - provider:', provider);
        console.log('[ContentAuth-DEBUG] - useCloudflareNativeHashing:', useCloudflareNativeHashing);
        console.log('[ContentAuth-DEBUG] - emailVerification:', JSON.stringify(emailVerification || 'not configured'));
        console.log('[ContentAuth-DEBUG] - turnstile:', turnstileConfig ? 'configured' : 'not configured');
        console.log('[ContentAuth-DEBUG] - emailNormalization:', JSON.stringify(emailNormalization || 'not configured'));
        console.log('[ContentAuth-DEBUG] - signInTracking:', JSON.stringify(signInTracking || 'not configured'));
        console.log('[ContentAuth-DEBUG] - onSignup:', onSignup ? 'provided' : 'not provided');
        console.log('[ContentAuth-DEBUG] - onSignin:', onSignin ? 'provided' : 'not provided');
        console.log('[ContentAuth-DEBUG] ========================================');
        console.log('[ContentAuth-DEBUG] Schema Mapping:');
        console.log('[ContentAuth-DEBUG] - schemaMapping:', JSON.stringify(schemaMapping, null, 2));
        console.log('[ContentAuth-DEBUG] ========================================');
        console.log('[ContentAuth-DEBUG] Direct model configs passed:');
        console.log('[ContentAuth-DEBUG] - user:', JSON.stringify(user, null, 2));
        console.log('[ContentAuth-DEBUG] - session:', JSON.stringify(session || 'not provided'));
        console.log('[ContentAuth-DEBUG] - account:', JSON.stringify(account || 'not provided'));
        console.log('[ContentAuth-DEBUG] - verification:', JSON.stringify(verification || 'not provided'));
        console.log('[ContentAuth-DEBUG] - organization:', JSON.stringify(organization || 'not provided'));
        console.log('[ContentAuth-DEBUG] - member:', JSON.stringify(member || 'not provided'));
        console.log('[ContentAuth-DEBUG] - invitation:', JSON.stringify(invitation || 'not provided'));
        console.log('[ContentAuth-DEBUG] ========================================');
        console.log('[ContentAuth-DEBUG] Built model configs (from schemaMapping):');
        console.log('[ContentAuth-DEBUG] - userConfig:', JSON.stringify(userConfig, null, 2));
        console.log('[ContentAuth-DEBUG] - sessionConfig:', JSON.stringify(sessionConfig || 'not built'));
        console.log('[ContentAuth-DEBUG] - accountConfig:', JSON.stringify(accountConfig || 'not built'));
        console.log('[ContentAuth-DEBUG] - verificationConfig:', JSON.stringify(verificationConfig || 'not built'));
        console.log('[ContentAuth-DEBUG] ========================================');
        console.log('[ContentAuth-DEBUG] Merged additionalFields for Drizzle schema:');
        console.log('[ContentAuth-DEBUG] - user additionalFields:', JSON.stringify(mergedUserAdditionalFields, null, 2));
        console.log('[ContentAuth-DEBUG] - session additionalFields:', JSON.stringify(mergedSessionAdditionalFields || 'none'));
        console.log('[ContentAuth-DEBUG] - account additionalFields:', JSON.stringify(mergedAccountAdditionalFields || 'none'));
        console.log('[ContentAuth-DEBUG] ========================================');
    }

    // Get the user table name for email normalization queries
    const userIdColumn = schemaMapping?.user?.fields?.id || 'id';

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

    // Use createAuthMiddleware to properly intercept and block requests
    const contentAuthBeforeHook = createAuthMiddleware(async (ctx) => {
        const path = ctx.path || "";

        // --- Email Signup Protection: Turnstile & Normalization ---
        if (path.includes("/sign-up/email")) {
            const body = ctx.body;

            if (body) {
                // 1. Verify Turnstile token (if configured)
                if (turnstileConfig?.secretKey) {
                    const turnstileToken = (body as any).turnstileToken;
                    if (!turnstileToken) {
                        console.warn('[ContentAuth] Email signup missing Turnstile token');
                        throw new APIError("BAD_REQUEST", {
                            message: 'Please complete the security challenge',
                        });
                    }

                    const { success, error } = await verifyTurnstile(turnstileConfig.secretKey, turnstileToken);
                    if (!success) {
                        console.warn(`[ContentAuth] Turnstile verification failed: ${error}`);
                        throw new APIError("BAD_REQUEST", {
                            message: error || 'Security challenge failed. Please try again.',
                        });
                    }
                }

                // 2. Email normalization check for duplicates
                if (emailNormalization?.enabled && (body as any).email && rawDb?.prepare) {
                    const normalized = normalizeEmail((body as any).email);
                    const existing = await rawDb.prepare(
                        `SELECT ${userIdColumn} FROM ${userTableName} WHERE ${normalizedEmailColumn} = ?`
                    ).bind(normalized).first();

                    if (existing) {
                        console.warn(`[ContentAuth] Duplicate normalized email detected: ${normalized}`);
                        throw new APIError("BAD_REQUEST", {
                            message: 'An account with this email already exists',
                        });
                    }
                }
            }
        }

        // Call user-provided before hook if exists
        if (userHooks?.before) {
            return userHooks.before(ctx);
        }
        return;
    });

    const contentAuthHooks: any = {
        before: contentAuthBeforeHook,
        after: async (context: any) => {
            const path = context.path || "";
            const user = context.user || context.response?.user || context.data?.user ||
                (context as any).context?.returned?.user || (context as any).context?.newSession?.user;

            if (user) {
                // --- Set normalized_email for new users ---
                if (emailNormalization?.enabled && rawDb?.prepare) {
                    if ((path.includes('/sign-up') || path.includes('/callback')) && user.id && user.email) {
                        try {
                            const normalized = normalizeEmail(user.email);
                            await rawDb.prepare(
                                `UPDATE ${userTableName} SET ${normalizedEmailColumn} = ? WHERE ${userIdColumn} = ? AND (${normalizedEmailColumn} IS NULL OR ${normalizedEmailColumn} != ?)`
                            ).bind(normalized, user.id, normalized).run();
                        } catch (e: any) {
                            console.error(`[ContentAuth] Failed to set normalized_email: ${e.message}`);
                        }
                    }
                }

                // --- Trigger onSignup hook ---
                if (onSignup) {
                    let isNewUser = false;
                    // Email signup
                    if (path.includes('/sign-up/email')) {
                        isNewUser = true;
                    }
                    // OAuth callback - check if user was just created
                    // better-auth doesn't explicitly return isNewUser, so we check createdAt
                    else if (path.includes('/callback')) {
                        if (user.createdAt) {
                            const createdAt = new Date(user.createdAt).getTime();
                            const now = Date.now();
                            // If created within last 10 seconds, treat as new user
                            if (now - createdAt < 10000) {
                                isNewUser = true;
                            }
                        }
                    }

                    if (isNewUser) {
                        try {
                            // Await onSignup to ensure it completes, especially for Cloudflare Workers
                            await onSignup(user);
                        } catch (e: any) {
                            console.error(`[ContentAuth] onSignup hook failed: ${e.message}`);
                        }
                    }
                }

                if (onSignin) {
                    if (path.includes('/sign-in') || path.includes('/sign-up') || path.includes('/callback')) {
                        try {
                            await onSignin(user);
                        } catch (e: any) {
                            console.error(`[ContentAuth] onSignin hook failed: ${e.message}`);
                        }
                    }
                }
            }

            // --- Update lastSignedInAt on sign-in ---
            // Note: sign-up also logs usage as sign-in if we want, but usually separated.
            // However, better-auth session creation happens here too.
            // Let's keep existing logic.
            if (signInTracking?.enabled && rawDb?.prepare && user?.id) {
                // Track sign-ins (sign-in, sign-up, and OAuth callbacks all create sessions)
                if (path.includes('/sign-in') || path.includes('/sign-up') || path.includes('/callback')) {
                    try {
                        const lastSignedInColumn = signInTracking.columnName || 'lastSignedInAt';
                        const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
                        await rawDb.prepare(
                            `UPDATE ${userTableName} SET ${lastSignedInColumn} = ? WHERE ${userIdColumn} = ?`
                        ).bind(now, user.id).run();
                    } catch (e: any) {
                        console.error(`[ContentAuth] Failed to update lastSignedInAt: ${e.message}`);
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
        // Model configs: Merge schema mapping config with user provided config
        ...(userConfig || user ? { user: { ...userConfig, ...user } } : {}),
        ...(sessionConfig || session ? { session: { ...sessionConfig, ...session } } : {}),
        ...(accountConfig || account ? { account: { ...accountConfig, ...account } } : {}),
        ...(verificationConfig || verification ? { verification: { ...verificationConfig, ...verification } } : {}),
        ...(orgKey || organization ? { organization: { ...(schemaMapping?.organization?.tableName ? { modelName: schemaMapping.organization.tableName } : {}), ...organization } } : {}),
        ...(memberKey || member ? { member: { ...(schemaMapping?.member?.tableName ? { modelName: schemaMapping.member.tableName } : {}), ...member } } : {}),
        ...(invitationKey || invitation ? { invitation: { ...(schemaMapping?.invitation?.tableName ? { modelName: schemaMapping.invitation.tableName } : {}), ...invitation } } : {}),
        // Merge content-auth hooks with user hooks
        hooks: contentAuthHooks,
        ...otherOptions,
    });

    if (debug) {
        console.log('[ContentAuth-DEBUG] ========================================');
        console.log('[ContentAuth-DEBUG] Final config passed to betterAuth():');
        console.log('[ContentAuth-DEBUG] - baseURL:', baseUrl);
        console.log('[ContentAuth-DEBUG] - emailAndPassword:', JSON.stringify(emailPasswordOptions));
        console.log('[ContentAuth-DEBUG] - emailVerification:', emailVerification ? 'passed' : 'not passed');
        console.log('[ContentAuth-DEBUG] ========================================');
        console.log('[ContentAuth-DEBUG] Merged model configs passed to betterAuth():');
        
        const mergedUserConfig = userConfig || user ? { ...userConfig, ...user } : undefined;
        console.log('[ContentAuth-DEBUG] - user:', JSON.stringify(mergedUserConfig, null, 2));
        
        const mergedSessionConfig = sessionConfig || session ? { ...sessionConfig, ...session } : undefined;
        console.log('[ContentAuth-DEBUG] - session:', JSON.stringify(mergedSessionConfig || 'not passed'));
        
        const mergedAccountConfig = accountConfig || account ? { ...accountConfig, ...account } : undefined;
        console.log('[ContentAuth-DEBUG] - account:', JSON.stringify(mergedAccountConfig || 'not passed'));
        
        const mergedVerificationConfig = verificationConfig || verification ? { ...verificationConfig, ...verification } : undefined;
        console.log('[ContentAuth-DEBUG] - verification:', JSON.stringify(mergedVerificationConfig || 'not passed'));
        
        console.log('[ContentAuth-DEBUG] - organization:', organization ? 'passed' : 'not passed');
        console.log('[ContentAuth-DEBUG] - member:', member ? 'passed' : 'not passed');
        console.log('[ContentAuth-DEBUG] - invitation:', invitation ? 'passed' : 'not passed');
        console.log('[ContentAuth-DEBUG] ========================================');
        console.log('[ContentAuth-DEBUG] Other options passed to betterAuth():', Object.keys(otherOptions).join(', '));
        console.log('[ContentAuth-DEBUG] ========================================');
    }

    // Add helper method to create users programmatically
    (auth as any).createUser = async (options: {
        email: string;
        password: string;
        name?: string;
        emailVerified?: boolean;
    }) => {
        const { email, password, name, emailVerified = false } = options;
        
        // Call Better Auth's sign-up endpoint internally
        const signupRequest = new Request(`${baseUrl}/api/auth/sign-up/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.toLowerCase().trim(),
                password,
                name: name || email.split('@')[0],
                callbackURL: '/',
            }),
        });
        
        const signupResponse = await auth.handler(signupRequest);
        
        if (!signupResponse.ok) {
            const errorData = await signupResponse.json() as any;
            throw new Error(`Failed to create user: ${JSON.stringify(errorData)}`);
        }
        
        const signupData = await signupResponse.json() as any;
        
        // If emailVerified should be true, update it
        if (emailVerified && signupData.user?.id && rawDb?.prepare) {
            await rawDb.prepare(
                `UPDATE ${userTableName} SET ${userIdColumn === 'id' ? 'emailVerified' : schemaMapping?.user?.fields?.emailVerified || 'emailVerified'} = 1 WHERE ${userIdColumn} = ?`
            ).bind(signupData.user.id).run();
        }
        
        return signupData.user;
    };

    // Add helper method to reset user password (admin operation)
    (auth as any).resetUserPassword = async (userId: string, newPassword: string) => {
        if (!rawDb?.prepare) {
            throw new Error('Password reset requires database access');
        }
        
        // Hash the new password using the configured hash function
        const hashedPassword = await hashPassword(newPassword);
        
        // Update the password in the accounts table
        const accountIdField = schemaMapping?.account?.fields?.userId || 'userId';
        const passwordField = schemaMapping?.account?.fields?.password || 'password';
        const updatedAtField = schemaMapping?.account?.fields?.updatedAt || 'updatedAt';
        
        await rawDb.prepare(
            `UPDATE ${accountTableName} SET ${passwordField} = ?, ${updatedAtField} = ? WHERE ${accountIdField} = ? AND providerId = 'credential'`
        ).bind(hashedPassword, Date.now(), userId).run();
        
        return { success: true };
    };

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
