import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function getAuthSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}

export async function requireAdmin() {
  const session = await getAuthSession();
  if (!session?.user) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return { session: null, response: NextResponse.json({ error: "Admin role required" }, { status: 403 }) };
  }
  return { session, response: null };
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
