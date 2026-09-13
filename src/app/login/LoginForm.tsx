"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

      if (!res.ok || !body.ok) {
        setError(body.error ?? "Couldn't sign you in. Try again.");
        setSubmitting(false);
        return;
      }

      // Full navigation, not router.push — the root layout's reference fetch
      // needs to re-run against the new session, and a client-side transition
      // would reuse the signed-out render it already has cached.
      window.location.assign(redirectTo);
    } catch {
      setError("Couldn't reach the sign-in service. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded border border-danger/25 bg-danger-wash px-3 py-2 text-tiny leading-relaxed text-danger"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.2} />
          {error}
        </p>
      )}

      <div>
        <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="username"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@brightpathsolar.com"
          className="h-9 w-full rounded border border-rule-firm bg-canvas px-2.5 text-sm text-ink placeholder:text-faint focus:border-solar"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor={passwordId} className="block text-sm font-medium text-ink">
            Password
          </label>
        </div>
        <div className="relative">
          <input
            id={passwordId}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-9 w-full rounded border border-rule-firm bg-canvas px-2.5 pr-9 text-sm text-ink placeholder:text-faint focus:border-solar"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted hover:bg-canvas-sunk hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="size-4" strokeWidth={1.9} />
            ) : (
              <Eye className="size-4" strokeWidth={1.9} />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={submitting}
        className={clsx("w-full", submitting && "opacity-70")}
      >
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
