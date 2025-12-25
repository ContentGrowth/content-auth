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
    // Allow passing other better-auth options
    [key: string]: any;
}

import * as defaultSchema from "./schema";

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

    const { database, secret, baseUrl, provider: _, ...rest } = config;

    // Use default schema if provider is sqlite and no schema was implicitly part of db (hard to know, but safe to pass for D1 case)
    let adapterOptions: any = {
        provider: provider as any,
    };

    if (provider === "sqlite") {
        adapterOptions.schema = defaultSchema;
    }

    const auth = betterAuth({
        database: drizzleAdapter(db, adapterOptions),
        secret: secret,
        baseURL: baseUrl,
        ...rest,
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
