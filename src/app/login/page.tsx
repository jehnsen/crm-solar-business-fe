import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in — Solar Ops" };

/**
 * The one screen in this app that gets a centered layout.
 *
 * The brief rules out a centered hero everywhere else because every other
 * screen is mid-pipeline — there's always a job, a lead, a customer to show
 * "where does this stand right now." A login screen has none of that yet; it
 * is correctly the one place with no board behind it.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Already signed in and landed here anyway (back button, stale tab) — send
  // them on rather than showing the form again.
  const session = await getSession();
  if (session) redirect("/");

  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-structural px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-lg bg-solar text-[#241704]">
            <SunMark />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">Brightpath</p>
            <p className="text-tiny text-slate-400">Solar operations</p>
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-surface px-6 py-7 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <h1 className="text-xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-muted">
            Use your Brightpath staff email and password.
          </p>

          <LoginForm redirectTo={next && next.startsWith("/") ? next : "/"} />
        </div>

        <p className="mt-5 text-center text-tiny text-slate-500">
          Locked out? Ask an admin to reset your password from the office.
        </p>
      </div>
    </div>
  );
}

function SunMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2v2.2M12 19.8V22M22 12h-2.2M4.2 12H2M19.07 4.93l-1.56 1.56M6.49 17.51l-1.56 1.56M19.07 19.07l-1.56-1.56M6.49 6.49 4.93 4.93" />
      </g>
    </svg>
  );
}
