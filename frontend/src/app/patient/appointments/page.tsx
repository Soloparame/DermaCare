"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";

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
    if (!confirm("Cancel this appointment?")) return;
    try {
      await fetch(`/patient/appointments/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to cancel.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Appointments</h2>
        <button
          onClick={() => setShowBookModal(true)}
          className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
        >
          + Book appointment
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total" value={appointments.length} accent="teal" />
        <StatCard title="Pending/Confirmed" value={appointments.filter((a) => ["Pending", "Confirmed"].includes(a.status)).length} accent="amber" />
        <StatCard title="Completed" value={appointments.filter((a) => a.status === "Completed").length} accent="emerald" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Doctor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Mode</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Payment</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No appointments. Book one above.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.date}</td>
                  <td className="px-4 py-3 text-slate-700">{a.time}</td>
                  <td className="px-4 py-3 text-slate-700">{a.doctorName}</td>
                  <td className="px-4 py-3 text-slate-700">{a.mode}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      a.status === "Confirmed" ? "bg-emerald-100 text-emerald-800" :
                      a.status === "Pending" ? "bg-amber-100 text-amber-800" :
                      a.status === "Completed" ? "bg-slate-200 text-slate-700" : "bg-rose-100 text-rose-800"
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      a.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" :
                      a.paymentStatus === "Failed" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                    }`}>{a.paymentStatus ?? "Pending"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.status === "Pending" && (
                      <button
                        onClick={() => handleCancel(a.id)}
                        className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Book appointment</h3>
            <form onSubmit={handleBook} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Doctor</label>
                <select
                  required
                  value={booking.doctorId}
                  onChange={(e) => setBooking((b) => ({ ...b, doctorId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  disabled={doctors.length === 0}
                >
                  <option value="">
                    {doctors.length === 0 ? "No doctors. Register users as Doctor." : "Select doctor"}
                  </option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.fullName} ({d.specialization ?? "Dermatology"})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Date</label>
                  <input
                    type="date"
                    required
                    value={booking.date}
                    onChange={(e) => setBooking((b) => ({ ...b, date: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Time</label>
                  <input
                    type="time"
                    required
                    value={booking.time}
                    onChange={(e) => setBooking((b) => ({ ...b, time: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Mode</label>
                <select
                  value={booking.mode}
                  onChange={(e) => setBooking((b) => ({ ...b, mode: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  <option value="In-person">In-person</option>
                  <option value="Virtual">Online</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowBookModal(false)} className="flex-1 rounded-lg border py-2 font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-teal-600 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-60">
                  {isSubmitting ? "Booking..." : "Book"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
