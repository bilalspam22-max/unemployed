import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

// Resolve to an absolute path so the DB file is the same regardless of the
// process working directory at runtime (relative paths are fragile in Next.js).
const RAW_DB = process.env.DATABASE_URL ?? "recherche.db";
const DB_PATH = path.isAbsolute(RAW_DB) ? RAW_DB : path.resolve(process.cwd(), RAW_DB);

if (process.env.NODE_ENV !== "production") {
  console.log("[db] Using SQLite file:", DB_PATH);
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 10000");

// ─── Idempotent additive migrations ──────────────────────────────────────────
// Adds columns that may be missing on self-hosted deployments where Drizzle
// migrations don't run. Safe to run on every startup (checks before altering).
function ensureColumns() {
  const additive: Array<{ table: string; column: string; ddl: string }> = [
    { table: "application", column: "sourceUrl",            ddl: "ALTER TABLE application ADD COLUMN sourceUrl text" },
    { table: "followup",    column: "myMessage",            ddl: "ALTER TABLE followup ADD COLUMN myMessage text" },
    { table: "followup",    column: "interlocutorResponse", ddl: "ALTER TABLE followup ADD COLUMN interlocutorResponse text" },
    { table: "contact",     column: "phone",                ddl: "ALTER TABLE contact ADD COLUMN phone text" },
  ];
  for (const { table, column, ddl } of additive) {
    try {
      const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
      if (cols.length && !cols.some(c => c.name === column)) {
        sqlite.exec(ddl);
        console.log(`[db] migration: added ${table}.${column}`);
      }
    } catch (e) {
      console.error(`[db] migration check failed for ${table}.${column}:`, e);
    }
  }
}
ensureColumns();

// Idempotent table creation (new tables don't exist on older self-hosted DBs).
function ensureTables() {
  try {
    sqlite.exec(`CREATE TABLE IF NOT EXISTS cv_file (
      id text PRIMARY KEY NOT NULL,
      cvId text NOT NULL,
      userId text NOT NULL,
      fileName text NOT NULL,
      mimeType text DEFAULT 'application/pdf' NOT NULL,
      size integer DEFAULT 0 NOT NULL,
      data blob NOT NULL,
      createdAt integer DEFAULT (unixepoch()) NOT NULL
    )`);
  } catch (e) {
    console.error("[db] ensureTables failed:", e);
  }
}
ensureTables();

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
