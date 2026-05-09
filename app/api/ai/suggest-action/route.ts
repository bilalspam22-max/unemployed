import { NextRequest } from "next/server";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { suggestNextAction } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;
  const body = await req.json().catch(() => null);
  if (!body?.jobTitle) return err("jobTitle required");
  const action = await suggestNextAction(body);
  return ok(action);
}
