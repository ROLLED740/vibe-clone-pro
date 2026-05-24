import { Pool } from 'pg';

declare global {
  // allow global pool across module reloads in development
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing DATABASE_URL in environment. Set it to your Neon connection string.');
}

const createPool = () => new Pool({ connectionString });

const pool = global.__pgPool ?? createPool();

if (process.env.NODE_ENV !== 'production') global.__pgPool = pool;

export default pool;
