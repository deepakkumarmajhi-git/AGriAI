"use client";

import FarmerVoiceAssistant from "@/components/chat/FarmerVoiceAssistant";
import { logout } from "@/lib/auth";
import { AppLanguage, AppTheme, applyLanguage, applyTheme, loadLanguage, loadTheme, savePrefs, supportedLanguages } from "@/lib/preferences";
import { Store, Landmark, Bell, Bot, CloudSun, Droplets, GripVertical, Home, Leaf, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sprout, Stethoscope, Sun, UserRound, Waves, X, Sparkle, Antenna } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type NavTone =
  | "emerald"
  | "sky"
  | "violet"
  | "rose"
  | "cyan"
  | "amber"
  | "lime"
  | "indigo"
  | "fuchsia";

const topNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, tone: "emerald" as NavTone },
  { href: "/weather", label: "Weather", icon: CloudSun, tone: "sky" as NavTone },
  { href: "/with-ai", label: "With AI", icon: Sparkle, tone: "violet" as NavTone },
  { href: "/agro-doctor", label: "Agro Doctor", icon: Stethoscope, tone: "rose" as NavTone },
  { href: "/irrigation", label: "Irrigation", icon: Droplets, tone: "cyan" as NavTone },
  { href: "/marketplace", label: "Marketplace Mgmt", icon: Store, tone: "amber" as NavTone },
  { href: "/waste-management", label: "Waste Mgmt", icon: Sprout, tone: "lime" as NavTone },
  { href: "/schemes", label: "Schemes", icon: Landmark, tone: "indigo" as NavTone },
  { href: "/simulate", label: "Simulators", icon: Antenna, tone: "fuchsia" as NavTone },
];

const navToneClasses: Record<
  NavTone,
  {
    dark: { active: string; idle: string };
    light: { active: string; idle: string };
  }
> = {
  emerald: {
    dark: {
      active: "bg-emerald-500/18 text-emerald-200 ring-1 ring-emerald-300/30 shadow-[0_0_16px_rgba(52,211,153,0.18)]",
      idle: "text-slate-200 hover:bg-emerald-500/12 hover:text-emerald-200",
    },
    light: {
      active: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      idle: "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700",
    },
  },
  sky: {
    dark: {
      active: "bg-sky-500/18 text-sky-200 ring-1 ring-sky-300/30 shadow-[0_0_16px_rgba(56,189,248,0.2)]",
      idle: "text-slate-200 hover:bg-sky-500/12 hover:text-sky-200",
    },
    light: {
      active: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
      idle: "text-slate-700 hover:bg-sky-50 hover:text-sky-700",
    },
  },
  violet: {
    dark: {
      active: "bg-violet-500/18 text-violet-200 ring-1 ring-violet-300/30 shadow-[0_0_16px_rgba(167,139,250,0.2)]",
      idle: "text-slate-200 hover:bg-violet-500/12 hover:text-violet-200",
    },
    light: {
      active: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
      idle: "text-slate-700 hover:bg-violet-50 hover:text-violet-700",
    },
  },
  rose: {
    dark: {
      active: "bg-rose-500/18 text-rose-200 ring-1 ring-rose-300/30 shadow-[0_0_16px_rgba(251,113,133,0.2)]",
      idle: "text-slate-200 hover:bg-rose-500/12 hover:text-rose-200",
    },
    light: {
      active: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
      idle: "text-slate-700 hover:bg-rose-50 hover:text-rose-700",
    },
  },
  cyan: {
    dark: {
      active: "bg-cyan-500/18 text-cyan-200 ring-1 ring-cyan-300/30 shadow-[0_0_16px_rgba(34,211,238,0.2)]",
      idle: "text-slate-200 hover:bg-cyan-500/12 hover:text-cyan-200",
    },
    light: {
      active: "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200",
      idle: "text-slate-700 hover:bg-cyan-50 hover:text-cyan-700",
    },
  },
  amber: {
    dark: {
      active: "bg-amber-500/18 text-amber-200 ring-1 ring-amber-300/30 shadow-[0_0_16px_rgba(251,191,36,0.2)]",
      idle: "text-slate-200 hover:bg-amber-500/12 hover:text-amber-200",
    },
    light: {
      active: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
      idle: "text-slate-700 hover:bg-amber-50 hover:text-amber-700",
    },
  },
  lime: {
    dark: {
      active: "bg-lime-500/18 text-lime-200 ring-1 ring-lime-300/30 shadow-[0_0_16px_rgba(163,230,53,0.2)]",
      idle: "text-slate-200 hover:bg-lime-500/12 hover:text-lime-200",
    },
    light: {
      active: "bg-lime-100 text-lime-700 ring-1 ring-lime-200",
      idle: "text-slate-700 hover:bg-lime-50 hover:text-lime-700",
    },
  },
  indigo: {
    dark: {
      active: "bg-indigo-500/18 text-indigo-200 ring-1 ring-indigo-300/30 shadow-[0_0_16px_rgba(129,140,248,0.2)]",
      idle: "text-slate-200 hover:bg-indigo-500/12 hover:text-indigo-200",
    },
    light: {
      active: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
      idle: "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700",
    },
  },
  fuchsia: {
    dark: {
      active: "bg-fuchsia-500/18 text-fuchsia-200 ring-1 ring-fuchsia-300/30 shadow-[0_0_16px_rgba(232,121,249,0.2)]",
      idle: "text-slate-200 hover:bg-fuchsia-500/12 hover:text-fuchsia-200",
    },
    light: {
      active: "bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200",
      idle: "text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700",
    },
  },
};

type ScanHeadline = {
  id: string;
  disease?: string;
  createdAt?: string;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [notifCount, setNotifCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHeadline[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [theme, setTheme] = useState<AppTheme>("dark");
  const [language, setLanguage] = useState<AppLanguage>("en");

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const name = useMemo(() => {
    if (typeof window === "undefined") return "Farmer";
    return localStorage.getItem("smartAgriName") || "Farmer";
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("smartAgriProfileImage") || "";
    const savedSidebarCollapsed = localStorage.getItem("smartAgriSidebarCollapsed") === "true";
    setProfileImage(saved);
    setSidebarCollapsed(savedSidebarCollapsed);
    setTheme(loadTheme());
    setLanguage(loadLanguage());
  }, []);

  async function loadNotifCount() {
    try {
      const userId = localStorage.getItem("smartAgriUserId");
      if (!userId) return;
      const res = await fetch(`/api/alerts?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      const alerts = data.alerts || [];
      setNotifCount(alerts.filter((a: any) => !a.resolved).length);
    } catch {
      // no-op
    }
  }

  async function loadScanHistory() {
    try {
      const userId = localStorage.getItem("smartAgriUserId");
      if (!userId) return;
      const res = await fetch(`/api/scans?userId=${encodeURIComponent(userId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      setScanHistory((data.scans || []).slice(0, 18));
    } catch {
      // no-op
    }
  }

  useEffect(() => {
    loadNotifCount();
    loadScanHistory();
    const t1 = setInterval(loadNotifCount, 30000);
    const t2 = setInterval(loadScanHistory, 45000);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!profileOpen) return;
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [profileOpen]);

  useEffect(() => {
    function onAlertsUpdated() {
      loadNotifCount();
    }
    window.addEventListener("smartagri:alerts-updated", onAlertsUpdated);
    return () => window.removeEventListener("smartagri:alerts-updated", onAlertsUpdated);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing || !layoutRef.current) return;
      const rect = layoutRef.current.getBoundingClientRect();
      const next = e.clientX - rect.left;
      const clamped = Math.min(460, Math.max(240, next));
      setSidebarWidth(clamped);
    }
    function onMouseUp() {
      setIsResizing(false);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

  function formatScanDate(iso?: string) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }

  function onUploadProfilePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) return;
      setProfileImage(result);
      localStorage.setItem("smartAgriProfileImage", result);
    };
    reader.readAsDataURL(file);
  }

  function onThemeToggle() {
    const next: AppTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    savePrefs(next, language);
  }

  function onLanguageChange(next: AppLanguage) {
    setLanguage(next);
    applyLanguage(next);
    savePrefs(theme, next);
  }

  function onToggleSidebarCollapse() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("smartAgriSidebarCollapsed", String(next));
      return next;
    });
  }

  const headerThemeClass =
    theme === "light"
      ? "border-slate-200 bg-white/90"
      : "border-white/10 bg-[#0b1222]/75";

  const navSurfaceClass =
    theme === "light"
      ? "border-slate-200 bg-slate-100/80"
      : "border-white/10 bg-white/5";

  const topButtonClass =
    theme === "light"
      ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${headerThemeClass}`}>
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNavOpen((v) => !v)}
                className="inline-flex rounded-lg border border-white/10 bg-white/5 p-2 text-slate-200 md:hidden"
                aria-label="Toggle menu"
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <button
                onClick={onToggleSidebarCollapse}
                className={`hidden rounded-lg border p-2 md:inline-flex ${topButtonClass}`}
                aria-label={sidebarCollapsed ? "Expand scan history sidebar" : "Collapse scan history sidebar"}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>

              <Link href="/dashboard" className="group flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                  <Leaf className="h-5 w-5" />
                </span>
                <p className={`font-semibold ${theme === "light" ? "text-slate-900" : "text-slate-100"}`}>SmartAgri</p>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
                className="hidden min-w-[122px] text-xs outline-none md:block"
                title="Language"
                aria-label="Language"
              >
                {supportedLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>

              <button
                onClick={onThemeToggle}
                className={`hidden rounded-lg border p-2 md:inline-flex ${topButtonClass}`}
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

              <button
                onClick={() => router.push("/alerts")}
                className={`relative rounded-lg border p-2 ${topButtonClass}`}
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notifCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                ) : null}
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm font-semibold ${topButtonClass}`}
                  aria-label="Profile menu"
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20" />
                  ) : (
                    <UserRound className="h-5 w-5 text-slate-300" />
                  )}
                  <span className="hidden sm:inline">{name}</span>
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0f1728]/95 shadow-lg backdrop-blur-xl">
                    <div className="border-b border-white/10 px-4 py-4 text-center">
                      <div className="mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full ring-1 ring-white/20">
                        {profileImage ? (
                          <img src={profileImage} alt="User profile" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/10">
                            <UserRound className="h-7 w-7 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-100">{name}</p>
                    </div>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onUploadProfilePhoto}
                    />

                    <button
                      onClick={() => {
                        imageInputRef.current?.click();
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      Upload Profile Photo
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        router.push("/profile");
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        router.push("/settings");
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        router.push("/contact");
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      Contact
                    </button>
                    <div className="h-px bg-white/10" />
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

          <nav className={`mt-3 flex justify-center gap-1 overflow-x-auto rounded-xl border p-1 ${navSurfaceClass}`}>
            {topNavItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const toneSet = navToneClasses[item.tone][theme === "light" ? "light" : "dark"];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5",
                    active ? toneSet.active : toneSet.idle,
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div ref={layoutRef} className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden px-4 py-4">
        <aside
          style={{ width: sidebarWidth }}
          className={[
            "shrink-0 overflow-hidden",
            mobileNavOpen ? "block" : sidebarCollapsed ? "hidden" : "hidden md:block",
          ].join(" ")}
        >
          <div className="h-full overflow-y-auto overscroll-contain no-scrollbar rounded-2xl border bg-white p-3 shadow-sm">
            <div className="px-2 pb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scan History</p>
            </div>

            <nav className="space-y-1">
              {scanHistory.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400">
                  No scans yet.
                </p>
              ) : (
                scanHistory.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => router.push("/scans")}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-emerald-400/10"
                    title={scan.disease || "Scan"}
                  >
                    <p className="truncate text-sm font-semibold text-slate-100">{scan.disease || "Plant scan"}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatScanDate(scan.createdAt)}</p>
                  </button>
                ))
              )}
            </nav>
          </div>
        </aside>

        <div
          onMouseDown={() => setIsResizing(true)}
          className={[
            "mx-1 hidden w-2 cursor-col-resize items-center justify-center rounded-md bg-white/5 text-slate-500 hover:bg-emerald-400/15 md:flex",
            sidebarCollapsed ? "md:hidden" : "",
          ].join(" ")}
          title="Resize sidebar"
          aria-hidden
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain no-scrollbar pr-1">{children}</main>
      </div>

      <FarmerVoiceAssistant />
    </div>
  );
}
