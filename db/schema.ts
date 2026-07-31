import { pgTable, text, timestamp, jsonb, uuid, boolean, integer, index } from 'drizzle-orm/pg-core';

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

// 3. Generations: every static preview and animated clip a user creates.
export const generations = pgTable(
  'generations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'image' for a static preview, 'video' for an animated clip.
    kind: text('kind').notNull(),
    // 'queued' | 'running' | 'succeeded' | 'failed'
    status: text('status').notNull().default('queued'),
    prompt: text('prompt').notNull(),
    templateId: text('template_id'),
    aspectRatio: text('aspect_ratio').notNull().default('9:16'),
    // Set on videos animated from an existing still.
    sourceGenerationId: uuid('source_generation_id'),
    // Provider job handle, used to poll for completion.
    providerJobId: text('provider_job_id'),
    provider: text('provider'),
    mediaUrl: text('media_url'),
    thumbnailUrl: text('thumbnail_url'),
    error: text('error'),
    creditsSpent: integer('credits_spent').notNull().default(0),
    // Free and Starter generations are public; Pro and above are private.
    isPublic: boolean('is_public').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('generations_user_created_idx').on(table.userId, table.createdAt),
    index('generations_public_created_idx').on(table.isPublic, table.createdAt),
  ]
);

// 4. Credit ledger: append-only. Balance is the sum of its deltas, so a spend
// and its refund are both visible rather than one overwriting a counter.
export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Negative to spend, positive to grant or refund.
    delta: integer('delta').notNull(),
    // 'grant' | 'spend' | 'refund' | 'topup'
    reason: text('reason').notNull(),
    generationId: uuid('generation_id'),
    // Billing period the grant belongs to, so monthly refills are idempotent.
    periodKey: text('period_key'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('credit_ledger_user_idx').on(table.userId, table.createdAt)]
);

// 5. API Keys Table
export const userApiKeys = pgTable('user_api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  googleKey: text('google_key'),
  openaiKey: text('openai_key'),
  anthropicKey: text('anthropic_key'),
});