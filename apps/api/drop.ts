import { db } from './src/db/client';
import { sql } from 'drizzle-orm';
await db.execute(sql`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
console.log('Dropped schema public');
