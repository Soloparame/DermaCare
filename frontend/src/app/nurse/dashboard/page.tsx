"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";
import { Users, CheckCircle, Video, Activity, FileText, ChevronRight, AlertCircle, Phone, HeartPulse, Clock } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <HeartPulse className="h-10 w-10 text-rose-500 animate-pulse" />
          <p className="text-slate-500 font-semibold tracking-wide">Loading nursing station...</p>
        </div>
      </div>
    );
  }

  const confirmedCount = appointments.filter((a) => a.status === "Confirmed").length;
  const virtualCount = appointments.filter((a) => a.mode === "Virtual").length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header and Quick Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-900 to-rose-700 p-8 sm:p-10 text-white shadow-xl shadow-rose-900/20">
        <div className="absolute right-0 top-0 h-full w-full sm:w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-60"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-rose-100 mb-3">
              <HeartPulse className="h-4 w-4" /> Nursing Station
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Today's Shift</h1>
            <p className="text-rose-100/80 font-medium">Manage patient queues, check schedules, and record clinical vitals.</p>
          </div>
          <Link
            href="/nurse/vitals"
            className="inline-flex items-center justify-center gap-2 bg-white text-rose-800 font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex-shrink-0"
          >
            <Activity className="h-5 w-5" /> Record Vitals
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Today's Patients */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-teal-50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black text-slate-800 mb-1 tracking-tight">{appointments.length}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Today's Queue</p>
          </div>
        </div>

        {/* Confirmed */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black text-slate-800 mb-1 tracking-tight">{confirmedCount}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Confirmed</p>
          </div>
        </div>

        {/* Virtual */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black text-slate-800 mb-1 tracking-tight">{virtualCount}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Virtual Visits</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200 p-4 flex items-center gap-3 text-red-700 shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Today's Schedule & Queue</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Time</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Patient Details</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Attending Doctor</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Mode</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Clinical History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Users className="h-12 w-12 text-slate-200 mb-3" />
                      <p className="font-medium text-slate-600">No patients in queue</p>
                      <p className="text-xs mt-1">There are no appointments scheduled for today.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 text-base">{a.time}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 mb-0.5">{a.patientName}</span>
                        {a.patientPhone && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="h-3 w-3" /> {a.patientPhone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                      {a.doctorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${a.mode === "Virtual" ? "bg-blue-50 text-blue-700 border border-blue-200/50" : "bg-slate-100 text-slate-700 border border-slate-200/50"
                        }`}>
                        {a.mode === "Virtual" ? <Video className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                        {a.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 min-w-[200px] max-w-xs">
                      {a.dermatologyHistory ? (
                        <div className="flex items-start gap-2 text-slate-600 text-sm">
                          <FileText className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed" title={a.dermatologyHistory}>{a.dermatologyHistory}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-medium text-xs">No history provided</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
