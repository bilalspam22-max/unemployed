import { NextRequest } from "next/server";
import { requireAuth, ok, err } from "@/lib/api-helpers";
import { suggestFollowupMessages } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;
  const body = await req.json().catch(() => null);
  if (!body?.firstName || !body?.lastName) return err("firstName and lastName required");
  const messages = await suggestFollowupMessages(body);
  return ok(messages);
}
