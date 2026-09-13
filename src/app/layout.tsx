import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Solar Ops — internal CRM",
  description:
    "Lead to PTO in one pipeline: surveys, proposals, contracts, permitting, installs, monitoring and service.",
};

/**
 * The true root. Deliberately thin: html shell, font, global CSS — nothing
 * that needs an authenticated fetch.
 *
 * The authenticated shell (reference data, AppShell, the redirect-on-401
 * guard) lives one level down in `(app)/layout.tsx`, wrapping every real
 * page but not `/login`. Doing the reference fetch here instead was the bug:
 * every route shares this layout, `/login` included, so a signed-out visit
 * to `/login` triggered `getReferenceData()`, got a 401, and redirected to
 * `/login` — from `/login`. The route group is what actually excludes it,
 * not a pathname check, which would have to be re-remembered by hand for
 * every future exception.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
