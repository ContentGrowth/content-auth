import { Hono } from 'hono';
import { createAuthApp } from '@contentgrowth/content-auth/backend';
import { AuthForm } from '@contentgrowth/content-auth/frontend';
import { renderToString } from 'react-dom/server';
import React from 'react';

const app = new Hono();

// Mock D1 database for example
const mockDb = {} as any;

const { app: authApp } = createAuthApp({
    database: mockDb,
    secret: 'test-secret',
    baseUrl: 'http://localhost:5173'
});

app.route('/', authApp);

app.get('/', (c) => {
    const html = renderToString(
        <html>
            <head>
                <title>Content Auth Example</title>
                <link rel="stylesheet" href="/styles.css" />
                <script type="module" src="/client.js"></script>
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
