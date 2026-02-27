"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";
import {
  Calendar, Clock, CheckCircle, Video, CreditCard, XCircle,
  Stethoscope, Building2, ChevronDown, Activity, CalendarPlus,
  ShieldCheck, AlertCircle, Trash2
} from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  time: string;
  mode: string;
  status: string;
  doctorName: string;
  paymentStatus?: string;
}

interface Doctor {
  id: string;
  fullName: string;
  specialization?: string;
}

export default function PatientAppointmentsPage() {
  const { fetch } = useApi();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [booking, setBooking] = useState({ doctorId: "", date: "", time: "09:00", mode: "In-person" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [apptData, docData] = await Promise.all([
        fetch<Appointment[]>("/patient/appointments"),
        fetch<Doctor[]>("/doctors"),
      ]);
      setAppointments(apptData);
      setDoctors(docData);
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to load data.");
      setAppointments([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [fetch]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!booking.doctorId || !booking.date || !booking.time) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await fetch("/patient/appointments", {
        method: "POST",
        body: { doctorId: booking.doctorId, date: booking.date, time: booking.time, mode: booking.mode },
      });
      setShowBookModal(false);
      setBooking({ doctorId: "", date: "", time: "09:00", mode: "In-person" });
      await loadData();
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to book.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await fetch(`/patient/appointments/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to cancel.");
    }
  }

  const pendingCount = appointments.filter((a) => ["Pending", "Confirmed"].includes(a.status)).length;
  const completedCount = appointments.filter((a) => a.status === "Completed").length;

  if (loading && !appointments.length) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-10 w-10 text-teal-500 animate-spin" />
          <p className="text-slate-500 font-semibold tracking-wide">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-indigo-900 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-teal-100 mb-3 backdrop-blur-md">
              <Calendar className="h-4 w-4" /> My Appointments
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Bookings & History</h1>
            <p className="text-teal-100/80 font-medium">Schedule new visits and review past consultations.</p>
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-white text-teal-900 font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex-shrink-0 group"
          >
            <CalendarPlus className="h-5 w-5 bg-teal-100 text-teal-700 rounded-full p-0.5 group-hover:rotate-12 transition-transform" />
            Book Now
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total stats */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black text-slate-800 mb-1 tracking-tight">{appointments.length}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Total Appointments</p>
          </div>
        </div>

        {/* Pending stats */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black text-slate-800 mb-1 tracking-tight">{pendingCount}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Pending & Confirmed</p>
          </div>
        </div>

        {/* Completed stats */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-black text-slate-800 mb-1 tracking-tight">{completedCount}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Completed</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200 p-4 flex items-center gap-3 text-red-700 shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Appointment History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-slate-200 bg-white shadow-sm text-slate-600 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Booking History</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date & Time</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Medical Professional</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Mode</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Appointment Status</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Payment</th>
                <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loading && appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Calendar className="h-12 w-12 text-slate-200 mb-3" />
                      <p className="font-medium text-slate-600 text-lg">No appointments yet</p>
                      <p className="text-sm mt-1">Book an appointment to easily view and manage your clinic visits.</p>
                      <button
                        onClick={() => setShowBookModal(true)}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition-colors"
                      >
                        Book Now
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-base">{a.time}</span>
                        <span className="text-xs font-semibold text-slate-500">{new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <span className="font-bold">{a.doctorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${a.mode === "Virtual" ? "bg-blue-50 text-blue-700 border-blue-200/50" : "bg-slate-100 text-slate-700 border-slate-200/50"
                        }`}>
                        {a.mode === "Virtual" ? <Video className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                        {a.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${a.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" :
                          a.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200/50" :
                            a.status === "Completed" ? "bg-slate-50 text-slate-600 border-slate-200/50 shadow-sm" :
                              "bg-rose-50 text-rose-700 border-rose-200/50 shadow-sm"
                        }`}>
                        {a.status === "Confirmed" && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>}
                        {a.status === "Pending" && <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div>}
                        {a.status === "Completed" && <CheckCircle className="h-3 w-3" />}
                        {a.status === "Cancelled" && <XCircle className="h-3 w-3" />}
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${a.paymentStatus === "Paid" ? "text-emerald-600" :
                          a.paymentStatus === "Failed" ? "text-rose-600" : "text-amber-600"
                        }`}>
                        <CreditCard className="h-4 w-4" />
                        {a.paymentStatus ?? "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {a.status === "Pending" ? (
                        <button
                          onClick={() => handleCancel(a.id)}
                          className="inline-flex items-center justify-center p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all shadow-sm border border-rose-200/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Cancel Appointment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase mr-3">No Actions</span>
                      )}
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
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-xl">
                  <CalendarPlus className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800">New Booking</h3>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleBook} className="p-6 space-y-5">

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-slate-400" /> Professional</label>
                <div className="relative">
                  <select
                    required
                    value={booking.doctorId}
                    onChange={(e) => setBooking((b) => ({ ...b, doctorId: e.target.value }))}
                    disabled={doctors.length === 0}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 cursor-pointer disabled:opacity-50"
                  >
                    <option value="" disabled>{doctors.length === 0 ? "No doctors available" : "Select a specialist"}</option>
                    {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName} ({d.specialization ?? "Dermatology"})</option>)}
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> Time</label>
                  <input
                    type="time"
                    required
                    value={booking.time}
                    onChange={(e) => setBooking((b) => ({ ...b, time: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2"><Building2 className="h-4 w-4 text-slate-400" /> Mode of Visit</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 font-bold transition-all ${booking.mode === 'In-person' ? 'bg-teal-50 border-teal-200 text-teal-700 ring-2 ring-teal-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    <input type="radio" value="In-person" checked={booking.mode === 'In-person'} onChange={(e) => setBooking((b) => ({ ...b, mode: e.target.value }))} className="hidden" />
                    In-person
                  </label>
                  <label className={`cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 font-bold transition-all ${booking.mode === 'Virtual' ? 'bg-teal-50 border-teal-200 text-teal-700 ring-2 ring-teal-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                    <input type="radio" value="Virtual" checked={booking.mode === 'Virtual'} onChange={(e) => setBooking((b) => ({ ...b, mode: e.target.value }))} className="hidden" />
                    Virtual
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 font-bold text-slate-700 hover:bg-slate-50 flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || doctors.length === 0}
                  className="w-full rounded-xl bg-teal-600 py-3.5 font-bold text-white shadow-lg hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed flex-1 flex items-center justify-center"
                >
                  {isSubmitting ? "Booking..." : "Confirm Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
