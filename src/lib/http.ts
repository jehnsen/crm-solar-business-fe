import "server-only";

/**
 * The HTTP client behind the seam.
 *
 * `server-only` is load-bearing: the API token lives in this module's closure,
 * and importing it from a client component is a build error rather than a
 * silent credential leak. Every caller is a server component or route handler.
 */

const BASE = process.env.SOLAR_API_URL ?? "http://127.0.0.1:8000/api";
const TOKEN = process.env.SOLAR_API_TOKEN ?? "";

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
  if (!TOKEN) {
    throw new ApiError(
      "SOLAR_API_TOKEN is not set. Copy .env.example to .env.local and mint a token.",
      null,
      path,
    );
  }

  let res: Response;
  try {
    res = await fetch(url(path, options.query), {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
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
    const detail = res.status === 401 ? " (token rejected — mint a new one)" : "";
    throw new ApiError(`GET ${path} failed: ${res.status} ${res.statusText}${detail}`, res.status, path);
  }

  const body = (await res.json()) as { data?: T } | T;
  return (body as { data?: T }).data !== undefined ? (body as { data: T }).data : (body as T);
}
