import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { createAuthApp } from '@contentgrowth/content-auth/backend';
import { organization } from 'better-auth/plugins';
import { AuthForm } from '@contentgrowth/content-auth/frontend';
import { renderToString } from 'react-dom/server';
import React from 'react';

type Bindings = {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BASE_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
    const { auth } = createAuthApp({
        database: c.env.DB,
        secret: c.env.BETTER_AUTH_SECRET,
        baseUrl: c.env.BASE_URL || `http://localhost:${process.env.PORT || '5173'}`,
        emailAndPassword: {
            enabled: true
        },
        socialProviders: {
            google: {
                clientId: c.env.GOOGLE_CLIENT_ID || "",
                clientSecret: c.env.GOOGLE_CLIENT_SECRET || ""
            },
            github: {
                clientId: c.env.GITHUB_CLIENT_ID || "",
                clientSecret: c.env.GITHUB_CLIENT_SECRET || ""
            }
        },
        plugins: [
            organization()
        ]
    });
    return auth.handler(c.req.raw);
});

app.get('/', (c) => {
    const html = renderToString(
        <html>
            <head>
                <title>Content Auth Example</title>
                <script type="module" src="/src/client.tsx"></script>
            </head>
            <body>
                <div id="root">
                    <h1>Content Auth Demo</h1>
                    <div id="auth-container"></div>
                </div>
            </body>
        </html>
    );
    return c.html(`<!DOCTYPE html>${html}`);
});

export default app;
