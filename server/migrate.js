import { pool } from './db.js';

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_credentials (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL,
      profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  console.log('Migrations done.');
}
