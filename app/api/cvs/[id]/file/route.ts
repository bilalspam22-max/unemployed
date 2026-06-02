import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { cvs, cvFiles } from "@/lib/db/schema";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { generateId } from "@/lib/utils";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// Upload (or replace) the PDF attached to a CV.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;

  // Ensure the CV belongs to the user
  const cvRow = await db.select().from(cvs)
    .where(and(eq(cvs.id, id), eq(cvs.userId, session!.user.id))).limit(1);
  if (!cvRow.length) return err("CV introuvable", 404);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return err("Aucun fichier fourni");

  const name = file.name || "cv.pdf";
  const mime = file.type || "application/pdf";
  if (mime !== "application/pdf" && !name.toLowerCase().endsWith(".pdf")) {
    return err("Seuls les fichiers PDF sont acceptés");
  }
  if (file.size > MAX_SIZE) return err("Fichier trop volumineux (max 10 Mo)");

  const buffer = Buffer.from(await file.arrayBuffer());

  // One file per CV: remove any previous one
  await db.delete(cvFiles).where(eq(cvFiles.cvId, id));
  await db.insert(cvFiles).values({
    id:       generateId(),
    cvId:     id,
    userId:   session!.user.id,
    fileName: name,
    mimeType: mime,
    size:     file.size,
    data:     buffer,
  });

  // Point the CV's pdfUrl at the authed download route
  const pdfUrl = `/api/cvs/${id}/file`;
  await db.update(cvs).set({ pdfUrl }).where(eq(cvs.id, id));

  return ok({ pdfUrl, fileName: name, size: file.size });
}

// Stream the stored PDF (authenticated — only the owner can read it).
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;

  const rows = await db.select().from(cvFiles)
    .where(and(eq(cvFiles.cvId, id), eq(cvFiles.userId, session!.user.id))).limit(1);
  if (!rows.length) return err("Fichier introuvable", 404);

  const f = rows[0];
  const bytes = f.data as Buffer;
  const body = new Uint8Array(bytes);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": f.mimeType || "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(f.fileName)}"`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}

// Remove the attached PDF.
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth();
  if (response) return response;
  const { id } = await params;
  await db.delete(cvFiles).where(and(eq(cvFiles.cvId, id), eq(cvFiles.userId, session!.user.id)));
  await db.update(cvs).set({ pdfUrl: null }).where(and(eq(cvs.id, id), eq(cvs.userId, session!.user.id)));
  return ok({ deleted: true });
}
