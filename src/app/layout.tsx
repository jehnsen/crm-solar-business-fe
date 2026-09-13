import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { getReferenceData } from "@/lib/api";
import { ReferenceProvider } from "@/lib/ReferenceProvider";

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
 * Every page reads live from the API, so nothing is prerendered.
 *
 * This is a correctness choice before it is a build one: static HTML baked at
 * build time would show whatever the pipeline looked like when someone last
 * deployed, which is exactly the wrong thing for a board whose whole job is
 * telling staff what is stuck *today*. It also keeps `next build` from
 * depending on a running backend.
 */
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Staff, customers, catalog and warranties, fetched once per request. The
  // seam's synchronous lookups read these, so they have to be in place before
  // any workspace renders.
  const reference = await getReferenceData();

  return (
    <html lang="en" className={`${grotesk.variable} h-full`}>
      <body className="min-h-full antialiased">
        <ReferenceProvider data={reference}>
          <AppShell currentUser={reference.team.find((t) => t.id === reference.currentUserId) ?? null}>
            {children}
          </AppShell>
        </ReferenceProvider>
      </body>
    </html>
  );
}
