import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminLogs } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";

// ─── Paths ───────────────────────────────────────────────────────────────────

export const DB_PATH = process.env.DATABASE_URL?.replace(/^\.\//, "") ?? "recherche.db";
export const ABSOLUTE_DB_PATH = path.isAbsolute(DB_PATH)
  ? DB_PATH
  : path.join(process.cwd(), DB_PATH);
export const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups");

// ─── Audit log ───────────────────────────────────────────────────────────────

export async function logAdminAction(params: {
  userId: string;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  await db.insert(adminLogs).values({
    id:          generateId(),
    userId:      params.userId,
    action:      params.action,
    description: params.description ?? null,
    ipAddress:   params.ipAddress ?? null,
    metadata:    params.metadata ? JSON.stringify(params.metadata) : null,
  });
}

export function getIpFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// ─── DB stats ────────────────────────────────────────────────────────────────

const COUNTED_TABLES = [
  "user", "session", "account", "verification",
  "sector", "company", "contact", "cv", "application", "followup", "training",
  "admin_log",
];

export function getDbStats() {
  let sizeBytes = 0;
  try { sizeBytes = fs.statSync(ABSOLUTE_DB_PATH).size; } catch { sizeBytes = 0; }

  // Add WAL + SHM if present
  for (const suffix of ["-wal", "-shm"]) {
    try { sizeBytes += fs.statSync(ABSOLUTE_DB_PATH + suffix).size; } catch {}
  }

  const tables: Record<string, { count: number }> = {};
  for (const t of COUNTED_TABLES) {
    try {
      const res = db.all(sql.raw(`SELECT COUNT(*) AS c FROM "${t}"`)) as Array<{ c: number }>;
      tables[t] = { count: Number(res[0]?.c ?? 0) };
    } catch {
      tables[t] = { count: 0 };
    }
  }

  return {
    totalSizeBytes: sizeBytes,
    totalSizeMb: +(sizeBytes / (1024 * 1024)).toFixed(2),
    tables,
  };
}

// ─── Disk stats (Linux/macOS) ────────────────────────────────────────────────

export function getDiskStats() {
  try {
    // fs.statfsSync is Node 18.15+
    type StatFsResult = { bsize: number; blocks: number; bfree: number; bavail: number };
    const stat = (fs as unknown as { statfsSync: (p: string) => StatFsResult }).statfsSync(process.cwd());
    const totalBytes  = stat.blocks * stat.bsize;
    const freeBytes   = stat.bavail * stat.bsize;
    const usedBytes   = totalBytes - freeBytes;
    const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
    return {
      totalBytes,
      freeBytes,
      usedBytes,
      usedPercent,
      totalGb: +(totalBytes / (1024 ** 3)).toFixed(1),
      freeGb:  +(freeBytes  / (1024 ** 3)).toFixed(1),
      usedGb:  +(usedBytes  / (1024 ** 3)).toFixed(1),
    };
  } catch {
    return null;
  }
}

// ─── Backups ─────────────────────────────────────────────────────────────────

export interface BackupInfo {
  filename: string;
  path: string;
  sizeBytes: number;
  sizeMb: number;
  createdAt: string;
  hash: string | null;
  status: "success";
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export function listBackups(): BackupInfo[] {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith(".db") && f.startsWith("recherche-"));
  return files
    .map(filename => {
      const filepath = path.join(BACKUP_DIR, filename);
      const stat = fs.statSync(filepath);
      let hash: string | null = null;
      try {
        const hashFile = filepath + ".sha256";
        if (fs.existsSync(hashFile)) hash = fs.readFileSync(hashFile, "utf8").trim().split(/\s+/)[0];
      } catch {}
      return {
        filename,
        path:       filepath,
        sizeBytes:  stat.size,
        sizeMb:     +(stat.size / (1024 * 1024)).toFixed(2),
        createdAt:  stat.mtime.toISOString(),
        hash,
        status:     "success" as const,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createBackup(): BackupInfo {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `recherche-${timestamp}.db`;
  const filepath = path.join(BACKUP_DIR, filename);

  // Try sqlite3 CLI .backup (transaction-safe) first; fall back to copyFile
  try {
    execSync(`sqlite3 "${ABSOLUTE_DB_PATH}" ".backup '${filepath}'"`, { stdio: "pipe" });
  } catch {
    fs.copyFileSync(ABSOLUTE_DB_PATH, filepath);
  }

  const buf = fs.readFileSync(filepath);
  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  fs.writeFileSync(filepath + ".sha256", hash);

  const stat = fs.statSync(filepath);
  return {
    filename,
    path:      filepath,
    sizeBytes: stat.size,
    sizeMb:    +(stat.size / (1024 * 1024)).toFixed(2),
    createdAt: stat.mtime.toISOString(),
    hash,
    status:    "success",
  };
}

export function restoreBackup(backupFilename: string): { ok: boolean; message: string } {
  ensureBackupDir();
  // Safety: reject paths trying to escape backup dir
  const safe = path.basename(backupFilename);
  const backupPath = path.join(BACKUP_DIR, safe);
  if (!fs.existsSync(backupPath)) return { ok: false, message: "Backup introuvable" };

  // Make a safety backup of current DB first
  try {
    const safetyPath = ABSOLUTE_DB_PATH + ".pre-restore-" + Date.now();
    fs.copyFileSync(ABSOLUTE_DB_PATH, safetyPath);
  } catch {}

  fs.copyFileSync(backupPath, ABSOLUTE_DB_PATH);
  // Remove WAL/SHM to force SQLite to re-read the restored DB
  for (const suffix of ["-wal", "-shm"]) {
    try { fs.unlinkSync(ABSOLUTE_DB_PATH + suffix); } catch {}
  }
  return { ok: true, message: "Restauration réussie. Redémarrage du serveur recommandé." };
}

export function cleanupOldBackups(retentionDays: number): { deleted: number } {
  ensureBackupDir();
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let deleted = 0;
  for (const f of fs.readdirSync(BACKUP_DIR)) {
    const p = path.join(BACKUP_DIR, f);
    try {
      const stat = fs.statSync(p);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(p);
        deleted++;
      }
    } catch {}
  }
  return { deleted };
}

// ─── Estimate days until saturation ──────────────────────────────────────────

export function estimateDaysUntilFull(dbBytes: number, diskFreeBytes: number, growthBytesPerDay = 100_000): number {
  if (growthBytesPerDay <= 0) return Infinity;
  return Math.floor(diskFreeBytes / growthBytesPerDay);
}

// ─── Account info (masked) ───────────────────────────────────────────────────

export function maskString(s: string | undefined | null, visibleStart = 0, visibleEnd = 4): string {
  if (!s) return "(non défini)";
  if (s.length <= visibleStart + visibleEnd) return "•".repeat(s.length);
  const start = s.slice(0, visibleStart);
  const end   = s.slice(-visibleEnd);
  return start + "•".repeat(Math.max(8, s.length - visibleStart - visibleEnd)) + end;
}

// ─── Random password generator ───────────────────────────────────────────────

export function generateRandomPassword(length = 16): string {
  // Avoid ambiguous chars (0/O, 1/l/I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*";
  let out = "";
  const buf = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += chars[buf[i] % chars.length];
  }
  return out;
}
