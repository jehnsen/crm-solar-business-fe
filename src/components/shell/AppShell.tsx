"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  ClipboardCheck,
  Contact as ContactIcon,
  FileSignature,
  FileText,
  HardHat,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Menu,
  Search,
  Settings,
  Share2,
  Stamp,
  Sun,
  Users,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { TEAM_ROLE } from "@/lib/labels";
import type { TeamMember } from "@/lib/types";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Follow-ups", icon: ListChecks },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/surveys", label: "Site Surveys", icon: ClipboardCheck },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/contracts", label: "Contracts", icon: FileSignature },
  { href: "/permitting", label: "Permitting", icon: Stamp },
  { href: "/installations", label: "Installations", icon: HardHat },
  { href: "/monitoring", label: "Monitoring", icon: Activity },
  { href: "/service", label: "Service & Warranty", icon: LifeBuoy },
  { href: "/referrals", label: "Referrals", icon: Share2 },
  { href: "/contacts", label: "Contacts", icon: ContactIcon },
] as const;

export function AppShell({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  /** Resolved server-side from the API and passed down, so the shell renders
   *  the real signed-in staff member rather than reaching into fixtures. */
  currentUser: TeamMember | null;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Persistent sidebar — lg and up */}
      <aside className="chrome sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r border-black/30 bg-structural lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Drawer — below lg */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="animate-scrim-in absolute inset-0 cursor-default bg-structural/50"
          />
          <aside className="chrome animate-panel-in relative flex h-full w-[264px] flex-col bg-structural">
            {/* Navigating closes the drawer — handled on the link itself rather
                than in an effect, which would cascade an extra render. */}
            <SidebarContent
              pathname={pathname}
              onClose={() => setDrawerOpen(false)}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenDrawer={() => setDrawerOpen(true)} currentUser={currentUser} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onClose,
  onNavigate,
}: {
  pathname: string;
  onClose?: () => void;
  /** Set only in the mobile drawer, so tapping a link dismisses it. */
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center gap-2.5 border-b border-white/8 px-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded bg-solar text-[#241704]">
          <Sun className="size-[17px]" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight text-white">Brightpath</p>
          <p className="truncate text-micro text-slate-400">Solar operations</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex size-7 items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        )}
      </div>

      <nav className="scrollbar-dark flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "group relative flex items-center gap-2.5 rounded px-2.5 py-[7px] text-sm transition-colors",
                    active
                      ? "bg-structural-hover font-semibold text-white"
                      : "font-medium text-slate-300 hover:bg-structural-hi hover:text-white",
                  )}
                >
                  {/* Active marker is the accent's one job in the sidebar. */}
                  <span
                    className={clsx(
                      "absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r",
                      active ? "bg-solar" : "bg-transparent",
                    )}
                  />
                  <Icon
                    className={clsx(
                      "size-4 shrink-0",
                      active ? "text-solar" : "text-slate-400 group-hover:text-slate-200",
                    )}
                    strokeWidth={1.9}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 border-t border-white/8 pt-3">
          <Link
            href="/settings"
            onClick={onNavigate}
            aria-current={pathname.startsWith("/settings") ? "page" : undefined}
            className={clsx(
              "group relative flex items-center gap-2.5 rounded px-2.5 py-[7px] text-sm transition-colors",
              pathname.startsWith("/settings")
                ? "bg-structural-hover font-semibold text-white"
                : "font-medium text-slate-300 hover:bg-structural-hi hover:text-white",
            )}
          >
            <span
              className={clsx(
                "absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r",
                pathname.startsWith("/settings") ? "bg-solar" : "bg-transparent",
              )}
            />
            <Settings
              className={clsx(
                "size-4 shrink-0",
                pathname.startsWith("/settings")
                  ? "text-solar"
                  : "text-slate-400 group-hover:text-slate-200",
              )}
              strokeWidth={1.9}
            />
            Settings
          </Link>
        </div>
      </nav>

      <div className="border-t border-white/8 px-3 py-3">
        <p className="text-micro leading-relaxed text-slate-500">
          Jobs move left to right. If something is stuck, it shows up on the Dashboard.
        </p>
      </div>
    </>
  );
}

function TopBar({
  onOpenDrawer,
  currentUser,
}: {
  onOpenDrawer: () => void;
  currentUser: TeamMember | null;
}) {
  const me = currentUser;

  return (
    <header className="chrome sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-black/25 bg-structural px-3 sm:px-5">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open navigation"
        className="flex size-8 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
      >
        <Menu className="size-[18px]" strokeWidth={2} />
      </button>

      <div className="relative min-w-0 max-w-md flex-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          strokeWidth={2}
        />
        <input
          type="search"
          placeholder="Search customers, jobs, permit numbers…"
          aria-label="Search"
          className={clsx(
            "h-9 w-full rounded border border-white/12 bg-white/6 pl-8.5 pr-3 text-sm text-white",
            "placeholder:text-slate-500 hover:bg-white/10 focus:bg-white/12",
          )}
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          className="relative flex size-8 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white"
          aria-label="Notifications — 3 unread"
        >
          <Bell className="size-[17px]" strokeWidth={1.9} />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-solar ring-2 ring-structural" />
        </button>

        {me && (
          <div className="flex items-center gap-2 rounded pl-1.5 sm:pr-1">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-solar text-micro font-bold text-[#241704]">
              {me.initials}
            </span>
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block truncate text-tiny font-semibold text-white">{me.name}</span>
              <span className="block truncate text-micro text-slate-400">
                {TEAM_ROLE[me.role]}
              </span>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
