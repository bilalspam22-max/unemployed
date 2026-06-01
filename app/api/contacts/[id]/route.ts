import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { resolveCompanyId } from "@/app/api/contacts/company-resolver";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Extract company-creation fields from body
  const { companyName, companySectorId, companyLocation, companyWebsite, ...rest } = body;

  let finalBody = { ...rest, updatedAt: new Date() };

  if (companyName !== undefined) {
    const resolvedId = await resolveCompanyId(
      session!.user.id, companyName, companySectorId, companyLocation, companyWebsite, rest.companyId
    );
    finalBody = { ...finalBody, companyId: resolvedId };
  }

  const row = await db.update(contacts)
    .set(finalBody)
    .where(and(eq(contacts.id, id), eq(contacts.userId, session!.user.id)))
    .returning();
  if (!row.length) return err("Not found", 404);
  return ok(row[0]);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, session!.user.id)));
  return ok({ deleted: true });
}
