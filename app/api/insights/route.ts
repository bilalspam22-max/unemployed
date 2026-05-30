import { requireAuth, ok } from "@/lib/api-helpers";
import { loadUserData, generateInsights } from "@/lib/insights-engine";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;
  const userId = session!.user.id;

  const data = await loadUserData(userId);
  const insights = generateInsights(data);

  return ok(insights);
}
