"use client";

import { setReference, type ReferenceData } from "./reference";

/**
 * Hands the reference tables to the browser.
 *
 * The store is populated during the module's first render rather than in an
 * effect, because the workspaces below it call the synchronous lookups while
 * they render — an effect would run too late and the first paint would show
 * "Unknown customer" everywhere.
 *
 * This carries no credentials: it is the same staff/customer/catalog data the
 * tables already display.
 */
export function ReferenceProvider({
  data,
  children,
}: {
  data: ReferenceData;
  children: React.ReactNode;
}) {
  setReference(data);
  return <>{children}</>;
}
