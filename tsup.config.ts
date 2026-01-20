import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/index.ts',
        'src/backend/index.ts',
        'src/frontend/index.ts',
        'src/frontend/client.ts',
        'src/frontend/astro.ts',
        'src/frontend/vue.ts',
        'src/frontend/clients/astro-client.ts',
        'src/frontend/clients/vue-client.ts',
        'src/cli.ts'
    ],
    format: ['esm'],
    dts: true,
    clean: true,
    external: [
        'react',
        'react-dom',
        'better-auth',
        'drizzle-orm',
        'hono',
        'vue',
        'astro',
        /\.vue$/
    ]
});
