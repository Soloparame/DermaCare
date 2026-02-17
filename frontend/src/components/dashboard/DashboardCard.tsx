import type { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  accent?: "emerald" | "sky" | "slate" | "amber" | "rose" | "teal";
  icon?: string;
  children?: ReactNode;
}

const accentClasses: Record<
  NonNullable<DashboardCardProps["accent"]>,
  string
> = {
  teal: "border-teal-200 bg-gradient-to-br from-teal-50 to-white shadow-teal-100/50",
  emerald:
    "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-emerald-100/50",
  sky: "border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sky-100/50",
  slate:
    "border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-slate-100/50",
  amber:
    "border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-amber-100/50",
  rose:
    "border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-rose-100/50",
};

export function DashboardCard({
  title,
  subtitle,
  accent = "slate",
  icon,
  children,
}: DashboardCardProps) {
  const classes = accentClasses[accent] ?? accentClasses.slate;

  return (
    <section
      className={`flex flex-col gap-4 rounded-2xl border px-5 py-4 shadow-sm transition hover:shadow-md ${classes}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          {icon && <span className="text-2xl">{icon}</span>}
          <p className="text-sm font-bold text-slate-900">{title}</p>
          {subtitle && (
            <p className="text-xs text-slate-600">{subtitle}</p>
          )}
        </div>
      </header>
      {children && (
        <div className="flex-1 text-sm text-slate-700">{children}</div>
      )}
    </section>
  );
}
