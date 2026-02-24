"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";

interface Appointment {
  id: string;
  time: string;
  mode: string;
  status: string;
  patientName: string;
  patientPhone: string;
  dermatologyHistory: string | null;
  doctorName: string;
}

export default function NurseDashboardPage() {
  const { fetch } = useApi();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetch<Appointment[]>("/nurse/appointments");
        setAppointments(data);
      } catch (err) {
        setError((err as ApiError).message ?? "Failed to load appointments.");
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetch]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Today's patients" value={appointments.length} icon="👥" accent="teal" />
        <StatCard title="Confirmed" value={appointments.filter((a) => a.status === "Confirmed").length} icon="✓" accent="emerald" />
        <StatCard title="Virtual" value={appointments.filter((a) => a.mode === "Virtual").length} icon="🎥" accent="blue" />
      </div>

      <div>
        <a
          href="/nurse/vitals"
          className="inline-block rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Record vitals
        </a>
      </div>

      <h2 className="text-lg font-bold text-slate-900">Today&apos;s queue</h2>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Doctor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Mode</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Dermatology history</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No patients scheduled for today.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.time}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{a.patientName}</div>
                    {a.patientPhone && <div className="text-xs text-slate-500">{a.patientPhone}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{a.doctorName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${a.mode === "Virtual" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>{a.mode}</span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-sm text-slate-600">
                    {a.dermatologyHistory ? <span className="line-clamp-2">{a.dermatologyHistory}</span> : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
