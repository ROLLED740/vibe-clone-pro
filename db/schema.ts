import { pgTable, text, timestamp, jsonb, uuid, boolean } from 'drizzle-orm/pg-core';

// 1. Users Table: The bridge between Clerk Auth and Stripe Billing
export const users = pgTable('users', {
    // We use Clerk's user ID as the primary key for friction-less lookups
    id: text('id').primaryKey(),
    email: text("email").notNull().unique(),
    stripeCustomerId: text("stripe_customer_id").unique(),
    lifetimeAccess: boolean('lifetime_access').default(false).notNull(),
    vibeProfile: jsonb('vibe_profile').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const clones = pgTable('clones', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id),
    // Groups the variants produced by a single build, so usage can be metered
    // per build rather than per generated variant.
    buildId: uuid('build_id'),
    input: jsonb('input').notNull(),
    vibeData: jsonb('vibe_data').notNull(),
    generatedCode: text('generated_code').notNull(),
    variantName: text('variant_name').notNull(),
    previewUrl: text('preview_url'),
    timestamp: timestamp('timestamp').defaultNow(),
});

// 2. Subscriptions Table: Tracks the Stripe lifecycle
export const subscriptions = pgTable("subscriptions", {
  // We use Stripe's Subscription ID as the primary key
  id: text("id").primaryKey(), 
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripePriceId: text("stripe_price_id").notNull(), // Maps to your Pro or Lifetime tier
  status: text("status").notNull(), // 'active', 'past_due', 'canceled', etc.
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. API Keys Table
export const userApiKeys = pgTable('user_api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  googleKey: text('google_key'),
  openaiKey: text('openai_key'),
  anthropicKey: text('anthropic_key'),
});