import { NextRequest } from "next/server";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { extractJobOffer } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;
  const body = await req.json().catch(() => null);
  if (!body?.text) return err("text required");
  const result = await extractJobOffer(body.text);
  return ok(result);
}
