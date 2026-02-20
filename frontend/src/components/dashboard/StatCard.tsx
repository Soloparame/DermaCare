interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  accent?: "teal" | "blue" | "amber" | "slate" | "emerald" | "rose";
}

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  teal: "bg-teal-500/10 text-teal-700 border-teal-200",
  blue: "bg-blue-500/10 text-blue-700 border-blue-200",
  amber: "bg-amber-500/10 text-amber-700 border-amber-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  rose: "bg-rose-500/10 text-rose-700 border-rose-200",
};

export function StatCard({ title, value, subtitle, icon, accent = "slate" }: StatCardProps) {
  return (
    <div className={`rounded-xl border px-5 py-4 ${accentClasses[accent]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-90">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs opacity-80">{subtitle}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
}
