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
npm install @contentgrowth/content-auth
# or
yarn add @contentgrowth/content-auth
# or
pnpm add @contentgrowth/content-auth
```

## Usage

### 1. Backend Setup (Cloudflare Workers/Pages + Hono)

Create your authentication API using the `createAuthApp` helper. This sets up the necessary routes for Better Auth.

```typescript
// src/index.ts
import { Hono, createAuthApp } from '@contentgrowth/content-auth/backend';

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
// Example: Sign in with email
await authClient.signIn.email({
    email: "user@example.com",
    password: "password123"
});
```

### 3. Frontend Setup (Astro)

Import components directly in your Astro pages. They use standard HTML/JS and don't require any framework integrations.

```astro
---
import { AuthForm } from '@contentgrowth/content-auth/astro/components/AuthForm.astro';
import '@contentgrowth/content-auth/styles.css';
---

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full">
    <h1 class="text-2xl font-bold text-center mb-6">Welcome Back</h1>
    
    <AuthForm 
      view="signin" 
      baseUrl="http://localhost:8787" <!-- Your backend URL -->
      redirectUrl="/dashboard"
    />
  </div>
</div>
```

**Client Usage (Vanilla JS):**

```typescript
import { authClient } from '@contentgrowth/content-auth/astro/client';

await authClient.signIn.email({ ... });
```

### 4. Frontend Setup (Vue)

Import components in your Vue 3 application.

```vue
<script setup>
import { AuthForm } from '@contentgrowth/content-auth/vue';
import '@contentgrowth/content-auth/styles.css';

const handleSuccess = (data) => {
  console.log('User authenticated!', data);
  window.location.href = '/dashboard';
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full">
      <h1 class="text-2xl font-bold text-center mb-6">Welcome Back</h1>
      
      <AuthForm 
        view="signin"
        @success="handleSuccess"
      />
    </div>
  </div>
</template>
```

**Client Usage (Vue):**

```typescript
import { authClient } from '@contentgrowth/content-auth/vue/client';

await authClient.signIn.email({ ... });
```

## Database Setup

This package requires specific database tables to function. We provide a **SQL schema template** that you copy into your project and extend with your own tables.

### Step 1: Initialize the Schema

Use the CLI to initialize the schema in your project:

```bash
npx content-auth init
```

This creates `./migrations/0000_auth.sql` with all required auth tables.

**Options:**
- `-o, --output <path>` — Custom output path (default: `./migrations/0000_auth.sql`)
- `--force` — Overwrite existing file

```bash
# Example: Custom output path
npx content-auth init -o ./db/migrations/0001_auth.sql
```

### Step 2: Add Your Application Tables

Edit the copied file and add your application-specific tables at the bottom:

```sql
-- ... (auth tables from template above) ...

-- ==========================================
-- YOUR APPLICATION TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS my_entity (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,  -- References organization.id
    name TEXT NOT NULL,
    created_at INTEGER
);
```

### Step 3: Run Migrations

```bash
# For Cloudflare D1 (local)
wrangler d1 migrations apply DB --local

# For Cloudflare D1 (remote)
wrangler d1 migrations apply DB --remote
```

### Extending Auth Tables

You can add extra columns to any auth table for your business needs. Just ensure you **keep all existing columns** — they are required by Better Auth.

```sql
-- Example: Adding custom fields to organization
CREATE TABLE IF NOT EXISTS organization (
    -- Required columns (keep these)
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo TEXT,
    createdAt TIMESTAMP NOT NULL,
    metadata TEXT,
    
    -- Your custom columns
    domain TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    billing_tier TEXT DEFAULT 'free'
);
```

### Schema Reference

| Table | Purpose |
|-------|---------|
| `user` | User accounts |
| `session` | Active sessions |
| `account` | OAuth/credential providers |
| `verification` | Email/token verification |
| `organization` | Teams/orgs (org plugin) |
| `member` | Org membership (org plugin) |
| `invitation` | Pending invites (org plugin) |

For detailed field definitions, see `schema/auth.sql` or the [Better Auth Drizzle Adapter documentation](https://better-auth.com/docs/adapters/drizzle).

## License

MIT
