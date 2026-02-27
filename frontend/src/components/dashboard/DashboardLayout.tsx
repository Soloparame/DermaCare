"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, ChevronLeft, ChevronRight, Activity } from "lucide-react";

type Role = "patient" | "doctor" | "nurse" | "receptionist" | "admin";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const roleNav: Record<Role, NavItem[]> = {
  patient: [
    { href: "/patient/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/patient/appointments", label: "Consultations", icon: "📅" },
    { href: "/patient/preassessment", label: "Pre-assessment", icon: "📝" },
    { href: "/patient/chat", label: "Chat", icon: "💬" },
    { href: "/patient/medical-history", label: "Medical History", icon: "📋" },
    { href: "/patient/profile", label: "Profile", icon: "👤" },
  ],
  doctor: [
    { href: "/doctor/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/doctor/appointments", label: "Consultations", icon: "📅" },
    { href: "/doctor/chat", label: "Chat", icon: "💬" },
    { href: "/doctor/profile", label: "Profile", icon: "👤" },
  ],
  nurse: [
    { href: "/nurse/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/nurse/chat", label: "Chat", icon: "💬" },
    { href: "/nurse/profile", label: "Profile", icon: "👤" },
  ],
  receptionist: [
    { href: "/receptionist/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/receptionist/chat", label: "Chat", icon: "💬" },
    { href: "/receptionist/profile", label: "Profile", icon: "👤" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/chat", label: "Chat", icon: "💬" },
    { href: "/admin/profile", label: "Profile", icon: "👤" },
  ],
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  role: Role;
  description?: string;
}

export function DashboardLayout({ children, title, role, description }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("derma_token");
    const storedRole = window.localStorage.getItem("derma_role");
    if (!token || !storedRole) {
      router.replace("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const envApi = typeof process !== "undefined" ? (process.env?.NEXT_PUBLIC_API_URL as string | undefined) : undefined;
    const base = envApi || "http://localhost:4000/api";
    const token = window.localStorage.getItem("derma_token");
    if (!token) return;
    const url = `${String(base).replace(/\/api\/?$/, "")}/api/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    es.addEventListener("chat_message", () => {
      const chatPath = `/${role}/chat`;
      if (!pathname.startsWith(chatPath)) {
        setUnread((u) => u + 1);
      }
    });
    return () => es.close();
  }, [pathname, role]);

  function handleSignOut() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("derma_token");
      window.localStorage.removeItem("derma_role");
      router.push("/");
    }
  }

  const navItems = roleNav[role] ?? roleNav.patient;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          ${sidebarOpen ? "w-72" : "w-20"}`}
      >
        <div className="flex h-20 flex-shrink-0 items-center justify-between px-5">
          {sidebarOpen ? (
            <Link href="/" className="flex items-center gap-3 w-full">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">DermaCare</span>
            </Link>
          ) : (
            <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md">
              <Activity className="h-5 w-5 text-white" />
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-teal-600 hover:scale-110 z-50`}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        </div>

        <div className="flex flex-col flex-1 px-3 py-6 overflow-y-auto">
          <p className={`mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 ${!sidebarOpen && "sr-only"}`}>
            Menu
          </p>
          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (item.label === "Chat") setUnread(0);
                  }}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${isActive
                      ? "bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-500/10"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-teal-500" />
                  )}
                  <span className={`flex h-6 w-6 items-center justify-center text-xl transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <span className="flex flex-1 items-center justify-between truncate">
                      {item.label}
                      {item.label === "Chat" && unread > 0 && (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                          {unread}
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 ${!sidebarOpen && "justify-center"}`}
          >
            <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${sidebarOpen ? "ml-72" : "ml-20"}`}>
        <header className="sticky top-0 z-30 flex min-h-[5rem] flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/70 px-8 backdrop-blur-xl">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {description && <p className="text-sm font-medium text-slate-500 mt-0.5">{description}</p>}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 px-3 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {role}
              </span>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white ring-2 ring-white shadow-sm font-semibold">
              {role.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
