import { pgTable, text, timestamp, uuid, boolean, integer, index } from 'drizzle-orm/pg-core';

// Bridges Clerk auth to Stripe billing. Clerk's user ID is the primary key so
// no extra lookup is needed anywhere else.
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tracks the Stripe subscription lifecycle, keyed by Stripe's subscription ID.
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripePriceId: text('stripe_price_id').notNull(),
  status: text('status').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Every static preview and animated clip a user creates.
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

// Append-only credit ledger. Balance is the sum of its deltas, so a spend and
// its refund are both visible rather than one overwriting a counter.
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
