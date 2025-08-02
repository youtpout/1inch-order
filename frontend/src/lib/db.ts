// lib/db.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Disable prefetch as it is not supported for "Transaction" pool mode 
const client = postgres(process.env.POSTGRE_DB_URL!, { prepare: false })
export const db = drizzle({ client });

