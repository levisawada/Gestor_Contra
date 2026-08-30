import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

const DB_FILE = process.env.DB_FILE_NAME ?? 'sqlite.db';

// Raw better-sqlite3 connection (exported for health-check queries)
export const sqlite = new Database(DB_FILE);

// Drizzle instance with the full schema
export const db = drizzle(sqlite, { schema });
