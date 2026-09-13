import "server-only";
import { getSessionToken } from "./session";

/**
 * The HTTP client behind the seam.
 *
 * `server-only` is load-bearing: every token this module can use lives only
 * in a server closure or an httpOnly cookie, and importing this file from a
 * client component is a build error rather than a silent credential leak.
 * Every caller is a server component or route handler.
 *
 * Token resolution, per request:
 *   1. The signed-in staff member's session cookie, if `/login` set one.
 *   2. `SOLAR_API_TOKEN` from env, as a fallback.
 *
 * The fallback exists so `npm run build`, seed scripts, and anyone who hasn't
 * touched the login page yet keep working exactly as before — it is not a
 * bypass a signed-in request can hit, since (1) always wins once a session
 * exists. Once every caller goes through `/login`, this file is the only
 * place that needs to know the fallback is there at all.
 */

const BASE = process.env.SOLAR_API_URL ?? "http://127.0.0.1:8000/api";
const ENV_TOKEN = process.env.SOLAR_API_TOKEN ?? "";

/** Thrown when the backend is unreachable or answers with an error status. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly path: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function resolveToken(): Promise<string> {
  const sessionToken = await getSessionToken();
  return sessionToken ?? ENV_TOKEN;
}

export interface FetchOptions {
  /** Query string values; null/undefined entries are dropped. */
  query?: Record<string, string | number | null | undefined>;
  /** Seconds to cache. 0 disables caching — use for anything write-adjacent. */
  revalidate?: number;
}

function url(path: string, query?: FetchOptions["query"]): string {
  const u = new URL(`${BASE}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== null && v !== undefined && v !== "") u.searchParams.set(k, String(v));
  }
  return u.toString();
}

/**
 * GET one endpoint and unwrap Laravel's `{ data: ... }` envelope.
 *
 * Failures throw. A dead backend surfaces as an error page rather than as
 * plausible-looking stale numbers — you always know whether what you are
 * reading is live.
 */
export async function apiGet<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = await resolveToken();
  if (!token) {
    throw new ApiError(
      "Not signed in, and SOLAR_API_TOKEN is not set either. Sign in at /login, or copy .env.example to .env.local and mint a token.",
      null,
      path,
    );
  }

  let res: Response;
  try {
    res = await fetch(url(path, options.query), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: options.revalidate ?? 0 },
    });
  } catch {
    throw new ApiError(
      `Cannot reach the Solar API at ${BASE}. Is \`php artisan serve\` running?`,
      null,
      path,
    );
  }

  if (!res.ok) {
    const detail = res.status === 401 ? " (token rejected — sign in again)" : "";
    throw new ApiError(`GET ${path} failed: ${res.status} ${res.statusText}${detail}`, res.status, path);
  }

  const body = (await res.json()) as { data?: T } | T;
  return (body as { data?: T }).data !== undefined ? (body as { data: T }).data : (body as T);
}
