import { defineConfig } from 'vite'
import devServer, { defaultOptions } from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'

const port = parseInt(process.env.PORT || '5173')

export default defineConfig({
    server: {
        port,
        fs: {
            allow: ['../..'],
        },
    },
    plugins: [
        devServer({
            adapter,
            entry: 'src/index.tsx',
            exclude: [...defaultOptions.exclude, '/src/**'],
            injectClientScript: false,
        }),
    ],
})
