import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const sqlClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY, 
      expires_at TIMESTAMP NOT NULL, 
      token TEXT NOT NULL UNIQUE, 
      created_at TIMESTAMP NOT NULL DEFAULT NOW(), 
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(), 
      ip_address TEXT, 
      user_agent TEXT, 
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY, 
      account_id TEXT NOT NULL, 
      provider_id TEXT NOT NULL, 
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
      access_token TEXT, 
      refresh_token TEXT, 
      id_token TEXT, 
      access_token_expires_at TIMESTAMP, 
      refresh_token_expires_at TIMESTAMP, 
      scope TEXT, 
      password TEXT, 
      created_at TIMESTAMP NOT NULL DEFAULT NOW(), 
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY, 
      identifier TEXT NOT NULL, 
      value TEXT NOT NULL, 
      expires_at TIMESTAMP NOT NULL, 
      created_at TIMESTAMP DEFAULT NOW(), 
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Done');
  process.exit(0);
}

main().catch(console.error);
