import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    vibeProfile: jsonb('vibe_profile').default({}),
    createdAt: timestamp('created_at').defaultNow(),
});

export const clones = pgTable('clones', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id),
    input: jsonb('input').notNull(),
    vibeData: jsonb('vibe_data').notNull(),
    generatedCode: text('generated_code').notNull(),
    variantName: text('variant_name').notNull(),
    previewUrl: text('preview_url'),
    timestamp: timestamp('timestamp').defaultNow(),
});