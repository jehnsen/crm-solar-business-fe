import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE_NAME } from "@/lib/session";

const BASE = process.env.SOLAR_API_URL ?? "http://127.0.0.1:8000/api";

/**
 * Revokes the Sanctum token server-side, then drops the session cookie either
 * way — a customer clicking "sign out" should never stay logged in locally
 * just because the API call failed.
 */
export async function POST() {
  const session = await getSession();

  if (session) {
    try {
      await fetch(`${BASE}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}`, Accept: "application/json" },
        cache: "no-store",
      });
    } catch {
      // Token revocation is best-effort; the cookie still comes off below.
    }
  }

  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);

  return NextResponse.json({ ok: true });
}
