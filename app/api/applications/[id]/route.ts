import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { resolveCompanyId } from "@/app/api/contacts/company-resolver";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Strip the inline company-creation fields (not real columns) and resolve them.
  const { companyName, companySectorId, ...rest } = body;
  let toSet = { ...rest, updatedAt: new Date() };
  if (companyName !== undefined) {
    const resolvedId = await resolveCompanyId(
      session!.user.id, companyName, companySectorId, null, null, rest.companyId,
    );
    toSet = { ...toSet, companyId: resolvedId };
  }

  const row = await db.update(applications)
    .set(toSet)
    .where(and(eq(applications.id, id), eq(applications.userId, session!.user.id)))
    .returning();
  if (!row.length) return err("Not found", 404);
  return ok(row[0]);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  await db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, session!.user.id)));
  return ok({ deleted: true });
}
