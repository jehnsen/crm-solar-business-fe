import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getReferenceData } from "@/lib/api";
import { ApiError } from "@/lib/http";
import { ReferenceProvider } from "@/lib/ReferenceProvider";

/**
 * The authenticated shell. Wraps every real page (everything under this
 * `(app)` route group) but not `/login`, which sits outside the group as a
 * sibling of it — so a signed-out visit to `/login` never reaches this file
 * and never triggers the fetch below.
 *
 * Every page here reads live from the API, so nothing is prerendered. This is
 * a correctness choice before it is a build one: static HTML baked at build
 * time would show whatever the pipeline looked like when someone last
 * deployed, which is exactly the wrong thing for a board whose whole job is
 * telling staff what is stuck *today*. It also keeps `next build` from
 * depending on a running backend.
 */
export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Staff, customers, catalog and warranties, fetched once per request. The
  // seam's synchronous lookups read these, so they have to be in place before
  // any workspace renders.
  //
  // The proxy (src/proxy.ts) already keeps a visitor with no session cookie
  // off every page but /login. What it can't catch is a cookie that exists
  // but no longer works — the token was revoked, or the backend restarted
  // and forgot it. A 401 here means exactly that.
  //
  // This redirects but deliberately does not also clear the cookie: a Server
  // Component render is not a Server Action or Route Handler, and Next
  // forbids writing cookies from one (it throws at runtime, not just lints).
  // The stale cookie sitting there is harmless — it fails into this same
  // branch every time until `/login` overwrites it with a fresh one.
  let reference;
  try {
    reference = await getReferenceData();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }

  return (
    <ReferenceProvider data={reference}>
      <AppShell currentUser={reference.team.find((t) => t.id === reference.currentUserId) ?? null}>
        {children}
      </AppShell>
    </ReferenceProvider>
  );
}
