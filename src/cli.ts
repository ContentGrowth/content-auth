#!/usr/bin/env node
import { cac } from 'cac';
import { execSync } from 'child_process';

const cli = cac('content-auth');

cli
    .command('migrate', 'Run database migrations')
    .option('--db <db>', 'Database name (for D1)', { default: 'DB' })
    .action((options) => {
        console.log('Running migrations...');
        try {
            // For now, we'll use the better-auth CLI directly
            // In a real implementation, we might want to generate the schema first
            // But better-auth cli generate requires a config file.

            // Let's try to run the better-auth migrate command
            // Assuming the user has a better-auth config or we can infer it.

            // Actually, for D1, we usually need to generate SQL and then run wrangler d1 execute.
            // But better-auth has a 'generate' command.

            console.log('Generating schema...');
            execSync('npx @better-auth/cli generate', { stdio: 'inherit' });

            console.log('Migration generation complete. Please check for generated SQL files.');
            console.log('To apply to D1, run: npx wrangler d1 execute <DATABASE_NAME> --local --file=<MIGRATION_FILE>');

        } catch (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    });

cli.help();
cli.parse();
