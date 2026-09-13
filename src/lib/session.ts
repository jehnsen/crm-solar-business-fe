import "server-only";
import { cookies } from "next/headers";

/**
 * The signed-in staff member's session.
 *
 * Sanctum here issues bearer tokens, not cookie sessions (`supports_credentials:
 * false` in the backend's CORS config — see `backend/config/cors.php`), so
 * there is no cookie Laravel will read for us. Instead the token this cookie
 * carries is minted by `POST /login` and stored **httpOnly** by our own route
 * handler (`src/app/api/auth/login/route.ts`) — it never reaches client JS,
 * the same guarantee `http.ts` gives the static env token.
 *
 * This is a thin wrapper around one cookie, not a real session store: there is
 * no server-side session table, no rotation, no idle timeout. Good enough for
 * an internal tool sitting behind Sanctum's own token expiry, not a substitute
 * for one if this ever faces the public internet.
 */
const COOKIE_NAME = "solar_session";

export interface Session {
  token: string;
  userId: number;
  name: string;
  email: string;
  teamMemberId: string | null;
}

/** Reads the current session cookie, if any. Never throws — an absent or
 *  corrupt cookie just means "not signed in". */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Session;
    if (typeof parsed.token === "string" && parsed.token.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

/** Only the bearer token, for the seam — the common case. */
export async function getSessionToken(): Promise<string | null> {
  const session = await getSession();
  return session?.token ?? null;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

/** Shared cookie options between the login and logout route handlers. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  // Sanctum's default personal access token lifetime is unlimited server-side;
  // this just bounds how long a browser holds onto it before re-login.
  maxAge: 60 * 60 * 24 * 7,
};
