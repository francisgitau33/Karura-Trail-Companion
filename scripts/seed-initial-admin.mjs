import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const required = ['DATABASE_URL', 'INITIAL_ADMIN_EMAIL', 'INITIAL_ADMIN_PASSWORD'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

if (process.env.INITIAL_ADMIN_PASSWORD.length < 12) {
  console.error('INITIAL_ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});

const email = process.env.INITIAL_ADMIN_EMAIL.toLowerCase().trim();
const passwordHash = await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD, 12);

try {
  await pool.query(
    `
      insert into admin_users (email, password_hash, role, is_active)
      values ($1, $2, 'PLATFORM_OWNER', true)
      on conflict (email) do update
      set password_hash = excluded.password_hash,
          role = 'PLATFORM_OWNER',
          is_active = true,
          updated_at = now()
    `,
    [email, passwordHash],
  );

  await pool.query(
    `
      insert into audit_log (actor_email, action, entity_type, metadata)
      values ($1, 'INITIAL_ADMIN_SEEDED', 'admin_users', $2::jsonb)
    `,
    [email, JSON.stringify({ source: 'scripts/seed-initial-admin.mjs' })],
  );

  console.log(`Seeded PLATFORM_OWNER admin: ${email}`);
} finally {
  await pool.end();
}
