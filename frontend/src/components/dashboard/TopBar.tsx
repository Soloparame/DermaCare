"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface TopBarProps {
  title: string;
  roleLabel: string;
  description?: string;
}

export function TopBar({ title, roleLabel, description }: TopBarProps) {
  const router = useRouter();

  function handleSignOut() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("derma_token");
      window.localStorage.removeItem("derma_role");
      router.push("/");
    }
  }

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-lg bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
            {roleLabel}
          </span>
          <span className="text-sm font-medium text-slate-500">DermaCare</span>
        </div>
        <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm text-slate-600">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50/50"
        >
          Home
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
