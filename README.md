# @contentgrowth/content-auth

A wrapper around [Better Auth](https://better-auth.com) designed specifically for **Cloudflare Workers** and **Cloudflare Pages**, providing both backend Hono middleware and pre-built React frontend components.

## Features

- 🔐 **Secure Authentication**: Powered by Better Auth.
- ⚡ **Cloudflare Ready**: Optimized for Workers and Pages (D1 Database support).
- 🧩 **Hono Integration**: Easy middleware integration for your Hono API.
- ⚛️ **React Components**: Pre-built, customizable UI components for login/signup.
- 📦 **Type Safe**: Full TypeScript support.

## Installation

```bash
npm install @contentgrowth/content-auth better-auth drizzle-orm hono
# or
yarn add @contentgrowth/content-auth better-auth drizzle-orm hono
# or
pnpm add @contentgrowth/content-auth better-auth drizzle-orm hono
```

## Usage

### 1. Backend Setup (Cloudflare Workers/Pages + Hono)

Create your authentication API using the `createAuthApp` helper. This sets up the necessary routes for Better Auth.

```typescript
// src/index.ts
import { Hono } from 'hono';
import { createAuthApp } from '@contentgrowth/content-auth/backend';

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.mount('/api/auth', async (c) => {
    // Initialize the auth app
    const { app: authApp } = createAuthApp({
        database: c.env.DB,
        secret: c.env.BETTER_AUTH_SECRET,
        baseUrl: c.env.BASE_URL, // e.g., http://localhost:5173 or https://your-app.pages.dev
    });
    
    return authApp.fetch(c.req.raw, c.env, c.executionCtx);
});

export default app;
```

#### Configuration Options (`createAuthApp`)

| Option | Type | Description |
| source | --- | --- |
| `database` | `D1Database` \| `any` | Your Cloudflare D1 binding or a Drizzle instance. |
| `secret` | `string` | A secret key for signing tokens. |
| `baseUrl` | `string` | The base URL of your application. |
| `provider` | `'sqlite'` \| `'postgres'` \| `'mysql'` | (Optional) Database provider. Defaults to `'sqlite'` (for D1). |
| `...` | `BetterAuthOptions` | Any other [Better Auth configuration](https://better-auth.com/docs/configuration) options. |

### Using without Hono (Standard Cloudflare Worker)

If you are not using Hono, you can use the `createAuth` function directly in your `fetch` handler.

```typescript
import { createAuth } from '@contentgrowth/content-auth/backend';

export default {
  async fetch(request, env, ctx) {
    const auth = createAuth({
      database: env.DB,
      secret: env.BETTER_AUTH_SECRET,
      baseUrl: env.BASE_URL
    });

    // Manually handle the auth routes
    if (request.url.includes("/api/auth")) {
      return auth.handler(request);
    }

    return new Response("Hello World");
  }
}
```

### Using with Other Databases (Postgres/MySQL)

You can use this package with any database supported by Drizzle ORM (Postgres, MySQL, etc.) on any platform (Node.js, Bun, etc.).

1. Initialize your Drizzle instance.
2. Pass it to `createAuthApp`.
3. Set the `provider` option.

```typescript
import { Hono } from 'hono';
import { createAuthApp } from '@contentgrowth/content-auth/backend';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
await client.connect();
const db = drizzle(client);

const app = new Hono();

const { app: authApp } = createAuthApp({
    database: db,
    secret: process.env.BETTER_AUTH_SECRET,
    baseUrl: process.env.BASE_URL,
    provider: "postgres", // or "mysql"
});

app.route('/api/auth', authApp);
```

### 2. Frontend Setup (React)

Use the provided `AuthForm` component to render a sign-in/sign-up form.

```tsx
// src/App.tsx
import React from 'react';
import { AuthForm } from '@contentgrowth/content-auth/frontend';
import '@contentgrowth/content-auth/styles.css'; // Import default styles

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>
        
        <AuthForm 
          type="signin" // or "signup"
          onSuccess={() => {
            console.log('User authenticated!');
            window.location.href = '/dashboard';
          }}
        />
      </div>
    </div>
  );
}
```

#### Client Client

You can also use the `authClient` directly for custom implementations:

```typescript
import { authClient } from '@contentgrowth/content-auth/client';

// Example: Sign in with email
await authClient.signIn.email({
    email: "user@example.com",
    password: "password123"
});
```

## Database Setup

This package uses **Drizzle ORM** with **Cloudflare D1**. You will need to run the Better Auth migrations to set up your database schema.

Refer to the [Better Auth Drizzle Adapter documentation](https://better-auth.com/docs/adapters/drizzle) for schema details.

## License

MIT
