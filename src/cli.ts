#!/usr/bin/env node
import { cac } from 'cac';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = cac('content-auth');

cli
    .command('init', 'Initialize database schema in your project')
    .option('-o, --output <path>', 'Output path for schema file', { default: './migrations/0000_auth.sql' })
    .option('--force', 'Overwrite existing file')
    .action((options) => {
        const outputPath = resolve(process.cwd(), options.output);
        const outputDir = dirname(outputPath);

        // Check if file already exists
        if (existsSync(outputPath) && !options.force) {
            console.error(`❌ File already exists: ${outputPath}`);
            console.error('   Use --force to overwrite, or specify a different output with -o');
            process.exit(1);
        }

        try {
            // Find the schema file relative to the CLI location
            // When installed, __dirname is in dist/, schema is in schema/
            const schemaPath = join(__dirname, '..', 'schema', 'auth.sql');
            
            if (!existsSync(schemaPath)) {
                console.error(`❌ Schema template not found at: ${schemaPath}`);
                process.exit(1);
            }

            // Create output directory if needed
            if (!existsSync(outputDir)) {
                mkdirSync(outputDir, { recursive: true });
                console.log(`📁 Created directory: ${outputDir}`);
            }

            // Copy the schema
            const schemaContent = readFileSync(schemaPath, 'utf-8');
            writeFileSync(outputPath, schemaContent);

            console.log(`✅ Schema initialized at: ${outputPath}`);
            console.log('');
            console.log('Next steps:');
            console.log('  1. Add your application tables at the bottom of the file');
            console.log('  2. Run migrations:');
            console.log('     wrangler d1 migrations apply DB --local');

        } catch (error) {
            console.error('❌ Failed to initialize schema:', error);
            process.exit(1);
        }
    });

cli
    .command('migrate', 'Run database migrations (deprecated - use wrangler directly)')
    .option('--db <db>', 'Database name (for D1)', { default: 'DB' })
    .action((options) => {
        console.log('Running migrations...');
        try {
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
cli.version('0.0.1');
cli.parse();

