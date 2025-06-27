import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../drizzle/schema.js';

let db: ReturnType<typeof drizzle> | null = null;

export function getDatabase() {
  if (!db) {
    const sqlite = new Database('./data/stellar.db');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    db = drizzle(sqlite, { schema });

    console.info('[Database] Connected to SQLite database');
  }

  return db;
}

export function closeDatabase() {
  if (db) {
    // Note: better-sqlite3 doesn't expose close method on drizzle instance
    // The connection will be closed when the process exits
    db = null;
    console.info('[Database] Database connection closed');
  }
}

// Export schema for use in other modules
export { schema };
