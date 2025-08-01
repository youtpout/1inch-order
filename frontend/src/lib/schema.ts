// lib/schema.ts
import { pgTable, text, json } from 'drizzle-orm/pg-core';

export const orders = pgTable('order', {
    hash: text('hash').notNull().primaryKey(),
    order: json('order').notNull(),
    extension: text('extension').notNull(),
    signature: text('signature').notNull(),
    status: text('status').notNull(),
});
