"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { UserContext } from "@/lib/UserContext";
import PhaseStepper from "@/components/ui/PhaseStepper";

const SIDEBAR_NAV = [
  {
    group: "Analytics",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboardIcon },
      { href: "/dashboard/visibility", label: "Visibility", icon: EyeIcon },
      { href: "/dashboard/sentiment", label: "Sentiment", icon: HeartIcon },
    ],
  },
  {
    group: "Monitor",
    items: [
      {
        href: "/dashboard/hallucinations",
        label: "Hallucinations",
        icon: AlertTriangleIcon,
      },
      { href: "/dashboard/prompts", label: "Prompts", icon: MessageSquareIcon },
      { href: "/dashboard/shopping", label: "Shopping", icon: ShoppingBagIcon },
    ],
  },
  {
    group: "Action",
    items: [
      {
        href: "/dashboard/opportunities",
        label: "Action Queue",
        icon: LightbulbIcon,
      },
      { href: "/dashboard/content", label: "Content", icon: FileTextIcon },
      { href: "/dashboard/competitors", label: "Competitors", icon: UsersIcon },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/dashboard/agents", label: "Agent Operations", icon: ActivityIcon },
      { href: "/dashboard/ethics", label: "Ethics Monitor", icon: ShieldIcon },
      { href: "/dashboard/corrections", label: "Corrections", icon: GitBranchIcon },
      { href: "/dashboard/roi", label: "Growth & ROI", icon: TrendingUpIcon },
    ],
  },
  {
    group: null,
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

function getInitials(
  displayName: string | undefined,
  email: string | undefined,
): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/visibility": "Visibility",
  "/dashboard/sentiment": "Sentiment",
  "/dashboard/hallucinations": "Hallucinations",
  "/dashboard/prompts": "Prompts",
  "/dashboard/shopping": "Shopping",
  "/dashboard/opportunities": "Action Queue",
  "/dashboard/content": "Content",
  "/dashboard/competitors": "Competitors",
  "/dashboard/agents": "Agent Operations",
  "/dashboard/ethics": "Ethics Monitor",
  "/dashboard/corrections": "Correction Timeline",
  "/dashboard/roi": "Growth & ROI",
  "/dashboard/settings": "Settings",
};

function LayoutDashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function GitBranchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  collapsed?: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        isActive
          ? "bg-white/10 text-white"
          : "text-gray-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName =
    (user?.user_metadata as Record<string, string> | undefined)?.display_name ||
    (user?.user_metadata as Record<string, string> | undefined)?.full_name ||
    user?.email ||
    "";
  const initials = getInitials(
    displayName || undefined,
    user?.email ?? undefined,
  );

  const handleLogout = async () => {
    setLoggingOut(true);
    document.cookie = "geomav_onboarded=; path=/; max-age=0";
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
  };

  const pageTitle =
    PAGE_TITLES[pathname] ??
    pathname
      .split("/")
      .pop()
      ?.replace(/^./, (c) => c.toUpperCase()) ??
    "Dashboard";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform bg-[#1a1225] transition-all duration-200 ease-in-out lg:translate-x-0 ${
          collapsed ? "w-[68px]" : "w-60"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
            {!collapsed && (
              <Link
                href="/"
                className="text-lg font-semibold text-white hover:text-gray-200 transition-colors"
              >
                GeoMav
              </Link>
            )}
            {/* Mobile close */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {/* Desktop collapse toggle */}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="hidden rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white lg:block"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
              >
                <path d="M11 19l-7-7 7-7" />
                <path d="M18 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <nav
            className={`flex-1 overflow-y-auto ${collapsed ? "px-2 py-4" : "p-4"}`}
          >
            {SIDEBAR_NAV.map((section) => (
              <div key={section.group ?? "settings"} className="mb-6">
                {section.group && !collapsed && (
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {section.group}
                  </p>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <NavLink
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        collapsed={collapsed}
                        isActive={
                          item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(item.href)
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className={`border-t border-white/10 ${collapsed ? "px-2 py-4" : "p-4"}`}>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              title={collapsed ? "Sign Out" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50 ${collapsed ? "justify-center" : ""}`}
            >
              <svg
                className="h-5 w-5 shrink-0"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!collapsed && (loggingOut ? "Signing out..." : "Sign Out")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex flex-1 flex-col transition-all duration-200 ${collapsed ? "lg:pl-[68px]" : "lg:pl-60"}`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-gray-900 lg:ml-0">
            {pageTitle}
          </h1>

          <div className="hidden lg:block">
            <PhaseStepper />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Notifications"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <Link
              href="/dashboard/settings"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-300"
              aria-label="Account settings"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <UserContext.Provider value={{ userId: user?.id ?? null }}>
            {children}
          </UserContext.Provider>
        </main>
      </div>
    </div>
  );
}
