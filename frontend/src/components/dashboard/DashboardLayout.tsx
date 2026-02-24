"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("derma_token");
    const storedRole = window.localStorage.getItem("derma_role");
    if (!token || !storedRole) {
      router.replace("/auth/login");
    }
  }, [router]);

  function handleSignOut() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("derma_token");
      window.localStorage.removeItem("derma_role");
      router.push("/");
    }
  }

  const navItems = roleNav[role] ?? roleNav.patient;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white shadow-lg transition-all duration-200`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          {sidebarOpen ? (
            <Link href="/" className="text-lg font-bold text-teal-600">DermaCare Online</Link>
          ) : (
            <span className="text-xl">🏥</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-2">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-200`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 shadow-sm backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {description && <p className="text-sm text-slate-500">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 capitalize">
              {role}
            </span>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
