// lib/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, json, timestamp } from 'drizzle-orm/pg-core';

export const orders = pgTable('order', {
    hash: text('hash').notNull().primaryKey(),
    order: json('order').notNull(),
    extension: text('extension').notNull(),
    signature: text('signature').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
