"use client";

import FarmerVoiceAssistant from "@/components/chat/FarmerVoiceAssistant";
import { logout } from "@/lib/auth";
import { AppLanguage, AppTheme, applyLanguage, applyTheme, loadLanguage, loadTheme, savePrefs, supportedLanguages } from "@/lib/preferences";
import { Bell, Bot, CloudSun, Droplets, GripVertical, Home, Leaf, Menu, Moon, Sprout, Sun, UserRound, Waves, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const topNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/weather", label: "Weather", icon: CloudSun },
  { href: "/with-ai", label: "With AI", icon: Bot },
  { href: "/irrigation", label: "Irrigation", icon: Droplets },
  { href: "/marketplace", label: "Marketplace", icon: Waves },
  { href: "/waste-management", label: "Waste Mgmt", icon: Sprout },
  { href: "/schemes", label: "Schemes", icon: Home },
  {href: "/simulate", label: "simulator", icon: UserRound },
];

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
    setProfileImage(saved);
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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold",
                    active
                      ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/25"
                      : "text-slate-200 hover:bg-emerald-400/10 hover:text-emerald-100",
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
          className={["shrink-0 overflow-hidden", mobileNavOpen ? "block" : "hidden md:block"].join(" ")}
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
          className="mx-1 hidden w-2 cursor-col-resize items-center justify-center rounded-md bg-white/5 text-slate-500 hover:bg-emerald-400/15 md:flex"
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
