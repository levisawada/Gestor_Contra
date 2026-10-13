import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as dotenv from 'dotenv';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

dotenv.config();

function getDatabasePath(): string {
    if (process.env.DB_PATH) {
        return process.env.DB_PATH;
    }
    // En producción o aplicación de escritorio, guardar siempre en AppData del usuario
    if (process.env.APPDATA) {
        const appDir = path.join(process.env.APPDATA, 'GestorContrasenas');
        if (!fs.existsSync(appDir)) {
            fs.mkdirSync(appDir, { recursive: true });
        }
        const prodDb = path.join(appDir, process.env.DB_FILE_NAME ?? 'sqlite.db');

        // Si la base de datos de producción no existe pero existe una local de desarrollo, migrarla automáticamente
        if (!fs.existsSync(prodDb)) {
            const possibleDevPaths = [
                path.resolve(process.cwd(), 'sqlite.db'),
                path.resolve(process.cwd(), '../backend/sqlite.db'),
                path.resolve(__dirname, '../../sqlite.db'),
            ];
            for (const devPath of possibleDevPaths) {
                if (fs.existsSync(devPath)) {
                    try {
                        fs.copyFileSync(devPath, prodDb);
                        console.log(`[db] Base de datos migrada desde: ${devPath}`);
                        break;
                    } catch {
                        // continuar si falla
                    }
                }
            }
        }

        return prodDb;
    }
    return process.env.DB_FILE_NAME ?? 'sqlite.db';
}

const dbPath = getDatabasePath();
export const sqlite = new Database(dbPath);

// Inicialización automática de tablas en caso de ser una máquina o base de datos nueva
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    session_pin TEXT,
    session_pin_expires_at TEXT,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
  );

  CREATE TABLE IF NOT EXISTS passwords (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    site_url TEXT,
    username TEXT NOT NULL,
    encrypted_password TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
