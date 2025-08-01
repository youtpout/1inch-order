import { defineConfig } from 'drizzle-kit';

console.log("env", process.env.SUPABASE_DB_URL);

export default defineConfig({
    schema: './src/lib/schema.ts',
    out: '.src/lib/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.SUPABASE_DB_URL!,
    },
});
