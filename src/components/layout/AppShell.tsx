"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { logout } from "@/lib/auth";
import { Sparkles } from "lucide-react";

const navItems = [
{ href: "/farm-ai", label: "Farm AI", icon: <Sparkles size={18} /> },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/weather", label: "Weather" },
  {href: "/soil", label: "Soil" },
  // { href: "/market", label: "Market" },
  { href: "/irrigation", label: "Irrigation" },
  { href: "/scan", label: "Scan Leaf" },
  { href: "/scans", label: "Scan History" },
  { href: "/simulate", label: "Simulator" },
  { href: "/assistant", label: "AI Assistant" },
  { href: "/schemes", label: "Schemes" },
];

function BellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function UserIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 10-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [notifCount, setNotifCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const name = useMemo(() => {
    if (typeof window === "undefined") return "User";
    return localStorage.getItem("smartAgriName") || "User";
  }, []);

  async function loadNotifCount() {
    try {
      const userId = localStorage.getItem("smartAgriUserId");
      if (!userId) return;

      const res = await fetch(`/api/alerts?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) return;

      const alerts = data.alerts || [];
      const unresolved = alerts.filter((a: any) => !a.resolved).length;
      setNotifCount(unresolved);
    } catch {
      // ignore
    }
  }

  // Load notifications count on mount + poll every 30 seconds
  useEffect(() => {
    loadNotifCount();
    const t = setInterval(loadNotifCount, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!profileOpen) return;
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [profileOpen]);

  // ✅ Instant update listener (resolve/unresolve/new alert)
useEffect(() => {
  function onAlertsUpdated() {
    loadNotifCount();
  }
  window.addEventListener("smartagri:alerts-updated", onAlertsUpdated);
  return () => window.removeEventListener("smartagri:alerts-updated", onAlertsUpdated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-bold text-slate-900">
            SmartAgri MVP
          </Link>

          {/* Right side: Notifications + Profile dropdown */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              onClick={() => router.push("/alerts")}
              className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
              aria-label="Notifications"
              title="Notifications"
            >
              <BellIcon />
              {notifCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                  {notifCount > 99 ? "99+" : notifCount}
                </span>
              ) : null}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                aria-label="Profile menu"
              >
                <UserIcon className="h-5 w-5" />
                <span className="hidden sm:inline">{name}</span>
              </button>

              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border bg-white shadow-lg">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/settings");
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Settings
                  </button>

                  <div className="h-px bg-slate-100" />

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                      router.push("/");
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-12">
        {/* Sidebar */}
        <aside className="md:col-span-3">
          <div className="rounded-2xl border bg-white p-3 shadow-sm">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Menu
            </p>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "rounded-xl px-3 py-2 text-sm font-semibold",
                      active ? "bg-green-50 text-green-800" : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-4 rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-900">Hackathon Tips</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Show real-time monitoring via Simulator + DB</li>
              <li>Explain privacy & ethics</li>
              <li>Leaf scan saves image + result</li>
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="md:col-span-9">{children}</main>
      </div>
    </div>
  );
}