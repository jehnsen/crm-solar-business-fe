import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/session";

/**
 * Bridges the login form to Laravel's `POST /login`.
 *
 * The form can't call the Laravel API directly and hold the result: the
 * bearer token it gets back has to end up in an httpOnly cookie, which only a
 * server context can set, and browser JS can never be allowed to read it back
 * out. So the client posts here, and this route does the real call and turns
 * the response into a cookie instead of a value it hands back.
 */

const BASE = process.env.SOLAR_API_URL ?? "http://127.0.0.1:8000/api";

interface LoginResponse {
  token: string;
  user: { id: number; name: string; email: string; teamMemberId: string | null };
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are both required." }, { status: 422 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: `Cannot reach the Solar API at ${BASE}. Is \`php artisan serve\` running?` },
      { status: 502 },
    );
  }

  if (upstream.status === 422 || upstream.status === 401) {
    // Laravel's validation-exception shape: { message, errors: { email: [...] } }
    const payload = await upstream.json().catch(() => null);
    const message: string =
      payload?.errors?.email?.[0] ?? payload?.message ?? "Those credentials do not match our records.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Login failed (${upstream.status}). Try again in a moment.` },
      { status: 502 },
    );
  }

  const data = (await upstream.json()) as LoginResponse;

  const store = await cookies();
  store.set(
    SESSION_COOKIE_NAME,
    JSON.stringify({
      token: data.token,
      userId: data.user.id,
      name: data.user.name,
      email: data.user.email,
      teamMemberId: data.user.teamMemberId,
    }),
    SESSION_COOKIE_OPTIONS,
  );

  return NextResponse.json({ ok: true });
}
