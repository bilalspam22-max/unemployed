import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, sectors } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";

// Find-or-create a sector by name for this user (mirrors resolveCompanyId).
export async function resolveSectorId(
  userId: string,
  sectorName: string | null | undefined,
  existingSectorId?: string | null,
): Promise<string | null> {
  if (existingSectorId) return existingSectorId;
  if (!sectorName?.trim()) return null;

  const name = sectorName.trim();
  const existing = await db.select().from(sectors)
    .where(and(eq(sectors.userId, userId), eq(sectors.name, name)))
    .limit(1);
  if (existing.length > 0) return existing[0].id;

  const created = await db.insert(sectors).values({
    id:       generateId(),
    userId,
    name,
    color:    "#3D5BE3",
    priority: 2,
  }).returning();
  return created[0].id;
}

export async function resolveCompanyId(
  userId: string,
  companyName: string | null | undefined,
  sectorId?: string | null,
  location?: string | null,
  website?: string | null,
  existingCompanyId?: string | null,
): Promise<string | null> {
  if (existingCompanyId) return existingCompanyId;
  if (!companyName?.trim()) return null;

  const name = companyName.trim();

  const existing = await db.select().from(companies)
    .where(and(eq(companies.userId, userId), eq(companies.name, name)))
    .limit(1);

  if (existing.length > 0) {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (sectorId && !existing[0].sectorId) updates.sectorId = sectorId;
    if (location && !existing[0].location) updates.location = location;
    if (website && !existing[0].website) updates.website = website;
    if (Object.keys(updates).length > 1) {
      await db.update(companies).set(updates).where(eq(companies.id, existing[0].id));
    }
    return existing[0].id;
  }

  const newCompany = await db.insert(companies).values({
    id:           generateId(),
    userId,
    name,
    sectorId:     sectorId ?? null,
    location:     location ?? null,
    website:      website ?? null,
    technologies: "[]",
    status:       "to_contact",
  }).returning();

  return newCompany[0].id;
}
