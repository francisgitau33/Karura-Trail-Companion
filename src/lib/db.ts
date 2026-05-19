import { Pool } from 'pg';
import type { QueryResultRow } from 'pg';

let pool: Pool | null = null;

export class CmsConfigurationError extends Error {
  constructor(message = 'CMS database is not configured.') {
    super(message);
    this.name = 'CmsConfigurationError';
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new CmsConfigurationError('DATABASE_URL is not configured.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}
