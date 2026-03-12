import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './lib/db/schema.ts', // Adjust if your schema lives elsewhere
  out: './drizzle',
  dialect: 'postgresql', // 'driver: "pg"' is deprecated
  dbCredentials: {
    url: process.env.DATABASE_URL!, // 'connectionString' is deprecated
  },
});
