"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";
import {
  Users, Calendar, CheckCircle, XCircle, Clock, Video,
  Activity, Plus, Phone, Mail, Stethoscope, ChevronDown,
  Search, AlignLeft, AlertCircle, Building2
} from "lucide-react";

interface Patient { id: string; fullName: string; email: string; phone: string }
interface Doctor { id: string; fullName: string; specialization?: string }

interface Appointment {
  id: string;
  date: string;
  time: string;
  mode: string;
  status: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
}

interface Stats {
  pending: number;
  today: number;
  confirmed: number;
  cancelled: number;
}

export default function ReceptionistDashboardPage() {
  const { fetch } = useApi();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "Pending" | "Confirmed" | "Completed">("all");
  const [showBookModal, setShowBookModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [booking, setBooking] = useState({ patientId: "", doctorId: "", date: "", time: "09:00", mode: "In-person" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [apptData, statsData, patientsData, doctorsData] = await Promise.all([
        fetch<Appointment[]>(`/receptionist/appointments${filter !== "all" ? `?status=${filter}` : ""}`),
        fetch<Stats>("/receptionist/stats"),
        fetch<Patient[]>("/receptionist/patients"),
        fetch<Doctor[]>("/doctors"),
      ]);
      setAppointments(apptData);
      setStats(statsData);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to load data.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [fetch, filter]);

  const cancelledCount = stats?.cancelled ?? 0;

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/receptionist/appointments/${id}`, { method: "PATCH", body: { status } });
      await loadData();
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to update.");
    }
  }

  if (loading && !appointments.length) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-10 w-10 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-semibold tracking-wide">Loading reception dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold text-indigo-100 mb-2 backdrop-blur-md">
              <Building2 className="h-3.5 w-3.5" /> Front Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">Reception Overview</h1>
            <p className="text-indigo-100/70 text-sm font-medium">Manage daily appointments and schedules.</p>
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-900 text-sm font-bold px-5 py-2.5 rounded-lg shadow hover:shadow-md hover:scale-105 transition-all flex-shrink-0 group"
          >
            <Plus className="h-4 w-4 bg-indigo-100 text-indigo-700 rounded-full p-0.5 group-hover:rotate-90 transition-transform" />
            Book Appointment
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Today */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-teal-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-teal-100/80 flex items-center justify-center backdrop-blur-sm border border-teal-200/50">
              <Calendar className="h-5 w-5 text-teal-600" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-slate-800 mb-0.5">{stats?.today ?? 0}</p>
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Total Today</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-amber-100/80 flex items-center justify-center backdrop-blur-sm border border-amber-200/50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-slate-800 mb-0.5">{stats?.pending ?? 0}</p>
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Pending</p>
          </div>
        </div>

        {/* Confirmed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-emerald-100/80 flex items-center justify-center backdrop-blur-sm border border-emerald-200/50">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-slate-800 mb-0.5">{stats?.confirmed ?? 0}</p>
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Confirmed</p>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="h-10 w-10 rounded-xl bg-rose-100/80 flex items-center justify-center backdrop-blur-sm border border-rose-200/50">
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-slate-800 mb-0.5">{cancelledCount}</p>
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Cancelled</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200 p-3 flex items-center gap-3 text-red-700 shadow-sm transition-all animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Appointments Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/30 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shadow-sm border border-indigo-200/50">
              <AlignLeft className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Appointments Roster</h2>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">Manage bookings</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 items-center bg-slate-100/80 p-1 rounded-xl backdrop-blur-sm border border-slate-200/60">
            {(["all", "Pending", "Confirmed", "Completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 flex-1 sm:flex-none text-center ${filter === f
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  }`}
              >
                {f === "all" ? "All Bookings" : f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-indigo-500 animate-spin" />
              </div>
            )}
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[9px]">Date & Time</th>
                <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[9px]">Patient details</th>
                <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[9px]">Assigned Doctor</th>
                <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[9px]">Type</th>
                <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider text-[9px]">Status</th>
                <th className="px-4 py-3 text-right font-bold text-slate-400 uppercase tracking-wider text-[9px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loading && appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <Calendar className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-700 text-base">No appointments found</p>
                      <p className="text-xs mt-1">Try adjusting the filter or book a new appointment.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{a.time}</span>
                        <span className="text-[10px] font-semibold text-slate-500 mt-0.5 whitespace-nowrap">
                          {new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800 text-xs">{a.patientName}</span>
                        <div className="flex flex-col gap-0.5">
                          {a.patientPhone && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                              <Phone className="h-2.5 w-2.5 text-slate-400" /> {a.patientPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-semibold border border-indigo-100">
                        <Stethoscope className="h-3 w-3" /> {a.doctorName}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${a.mode === "Virtual" ? "bg-blue-50 text-blue-700 border-blue-200/50" : "bg-slate-100 text-slate-700 border-slate-200/50"
                        }`}>
                        {a.mode === "Virtual" ? <Video className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                        {a.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${a.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" :
                          a.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200/50" :
                            a.status === "Completed" ? "bg-slate-50 text-slate-600 border-slate-200/50" :
                              "bg-rose-50 text-rose-700 border-rose-200/50"
                        }`}>
                        {a.status === "Confirmed" && <div className="h-1 w-1 rounded-full bg-emerald-500"></div>}
                        {a.status === "Pending" && <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse"></div>}
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right align-middle">
                      <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {a.status === "Pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(a.id, "Confirmed")}
                              className="inline-flex items-center justify-center p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border border-emerald-200/50"
                              title="Confirm"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => updateStatus(a.id, "Cancelled")}
                              className="inline-flex items-center justify-center p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all border border-rose-200/50"
                              title="Cancel"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {a.status === "Confirmed" && (
                          <button
                            onClick={() => updateStatus(a.id, "Completed")}
                            className="inline-flex items-center justify-center p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all border border-slate-200/50"
                            title="Complete"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {["Completed", "Cancelled"].includes(a.status) && (
                          <span className="text-[10px] font-bold text-slate-300 mr-2">DONE</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800">New Appointment</h3>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!booking.patientId || !booking.doctorId || !booking.date || !booking.time) return;
                setIsSubmitting(true);
                setError(null);
                try {
                  await fetch("/receptionist/appointments", {
                    method: "POST",
                    body: {
                      patientId: booking.patientId,
                      doctorId: booking.doctorId,
                      date: booking.date,
                      time: booking.time,
                      mode: booking.mode,
                    },
                  });
                  setShowBookModal(false);
                  setBooking({ patientId: "", doctorId: "", date: "", time: "09:00", mode: "In-person" });
                  await loadData();
                } catch (err) {
                  setError((err as ApiError).message ?? "Failed to book.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="p-6 space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" /> Patient</label>
                  <div className="relative">
                    <select
                      required
                      value={booking.patientId}
                      onChange={(e) => setBooking((b) => ({ ...b, patientId: e.target.value }))}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                    >
                      <option value="" disabled>Select a patient</option>
                      {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-slate-400" /> Attending Doctor</label>
                  <div className="relative">
                    <select
                      required
                      value={booking.doctorId}
                      onChange={(e) => setBooking((b) => ({ ...b, doctorId: e.target.value }))}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                    >
                      <option value="" disabled>Select a doctor</option>
                      {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> Date</label>
                    <input
                      type="date"
                      required
                      value={booking.date}
                      onChange={(e) => setBooking((b) => ({ ...b, date: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> Time</label>
                    <input
                      type="time"
                      required
                      value={booking.time}
                      onChange={(e) => setBooking((b) => ({ ...b, time: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Video className="h-4 w-4 text-slate-400" /> Appointment Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 font-bold transition-all ${booking.mode === 'In-person' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                      <input type="radio" value="In-person" checked={booking.mode === 'In-person'} onChange={(e) => setBooking((b) => ({ ...b, mode: e.target.value }))} className="hidden" />
                      <Building2 className="h-4 w-4" /> In-person
                    </label>
                    <label className={`cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 font-bold transition-all ${booking.mode === 'Virtual' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                      <input type="radio" value="Virtual" checked={booking.mode === 'Virtual'} onChange={(e) => setBooking((b) => ({ ...b, mode: e.target.value }))} className="hidden" />
                      <Video className="h-4 w-4" /> Virtual
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="w-1/3 rounded-xl border border-slate-200 bg-white py-3.5 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-lg hover:bg-indigo-700 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Activity className="h-5 w-5 animate-spin" /> Booking...</>
                  ) : (
                    "Confirm Booking"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
