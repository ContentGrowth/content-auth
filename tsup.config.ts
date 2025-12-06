import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/index.ts',
        'src/backend/index.ts',
        'src/frontend/index.ts',
        'src/frontend/client.ts'
    ],
    format: ['esm'],
    dts: true,
    clean: true,
    external: ['react', 'react-dom', 'better-auth', 'drizzle-orm', 'hono'],
});
