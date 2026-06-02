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

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
