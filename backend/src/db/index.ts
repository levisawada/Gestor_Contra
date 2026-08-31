import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

const DB_FILE = process.env.DB_FILE_NAME ?? 'sqlite.db';

export const sqlite = new Database(DB_FILE);

export const db = drizzle(sqlite, { schema });
