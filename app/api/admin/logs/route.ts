import { NextRequest } from "next/server";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminLogs, users } from "@/lib/db/schema";
import { requireAdmin, ok } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const from   = url.searchParams.get("from");  // ISO date
  const to     = url.searchParams.get("to");
  const limit  = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);

  const conditions: SQL[] = [];
  if (action) conditions.push(eq(adminLogs.action, action));
  if (from)   conditions.push(gte(adminLogs.createdAt, new Date(from)));
  if (to)     conditions.push(lte(adminLogs.createdAt, new Date(to)));

  const rows = await db
    .select({
      id:          adminLogs.id,
      action:      adminLogs.action,
      description: adminLogs.description,
      ipAddress:   adminLogs.ipAddress,
      metadata:    adminLogs.metadata,
      createdAt:   adminLogs.createdAt,
      userId:      adminLogs.userId,
      userName:    users.name,
      userEmail:   users.email,
    })
    .from(adminLogs)
    .leftJoin(users, eq(adminLogs.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(adminLogs.createdAt))
    .limit(limit);

  return ok({
    logs: rows.map(r => ({
      ...r,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
    })),
    count: rows.length,
  });
}
