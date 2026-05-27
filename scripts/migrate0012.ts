import { config } from 'dotenv';
config({ path: '.env.local' });
import mysql2 from 'mysql2/promise';
import { readFileSync } from 'fs';

async function run() {
  const sql = readFileSync('drizzle/migrations/0012_home_reports.sql', 'utf8');
  const conn = await mysql2.createConnection(process.env.DATABASE_URL!);
  try {
    await conn.execute(sql);
    console.log('Migration 0012 applied — homeReports table created');
  } catch (e: any) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('homeReports table already exists — skipping');
    } else {
      throw e;
    }
  } finally {
    await conn.end();
  }
}

run().catch((e) => { console.error('Migration failed:', e.message); process.exit(1); });
