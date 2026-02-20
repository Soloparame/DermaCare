"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total today" value={stats?.today ?? 0} icon="📅" accent="teal" />
        <StatCard title="Pending confirmations" value={stats?.pending ?? 0} icon="⏳" accent="amber" />
        <StatCard title="Confirmed" value={stats?.confirmed ?? 0} icon="✓" accent="emerald" />
        <StatCard title="Cancelled" value={cancelledCount} icon="✕" accent="rose" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900">Appointments</h2>
        <button
          onClick={() => setShowBookModal(true)}
          className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
        >
          + Book for patient
        </button>
        <div className="flex gap-2">
          {(["all", "Pending", "Confirmed", "Completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === f ? "bg-teal-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Doctor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Mode</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No appointments.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.date}</td>
                  <td className="px-4 py-3 text-slate-700">{a.time}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{a.patientName}</div>
                    <div className="text-xs text-slate-500">{a.patientPhone || a.patientEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{a.doctorName}</td>
                  <td className="px-4 py-3 text-slate-700">{a.mode}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      a.status === "Confirmed" ? "bg-emerald-100 text-emerald-800" :
                      a.status === "Pending" ? "bg-amber-100 text-amber-800" :
                      a.status === "Completed" ? "bg-slate-200 text-slate-700" : "bg-rose-100 text-rose-800"
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {a.status === "Pending" && (
                        <>
                          <button onClick={() => updateStatus(a.id, "Confirmed")} className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700">Confirm</button>
                          <button onClick={() => updateStatus(a.id, "Cancelled")} className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700">Cancel</button>
                        </>
                      )}
                      {a.status === "Confirmed" && (
                        <button onClick={() => updateStatus(a.id, "Completed")} className="rounded bg-teal-600 px-2 py-1 text-xs font-medium text-white hover:bg-teal-700">Complete</button>
                      )}
                    </div>
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
            <h3 className="text-lg font-bold text-slate-900">Book appointment for patient</h3>
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
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700">Patient</label>
                <select required value={booking.patientId} onChange={(e) => setBooking((b) => ({ ...b, patientId: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                  <option value="">Select patient</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Doctor</label>
                <select required value={booking.doctorId} onChange={(e) => setBooking((b) => ({ ...b, doctorId: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                  <option value="">Select doctor</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Date</label>
                  <input type="date" required value={booking.date} onChange={(e) => setBooking((b) => ({ ...b, date: e.target.value }))} min={new Date().toISOString().split("T")[0]} className="mt-1 w-full rounded-lg border px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Time</label>
                  <input type="time" required value={booking.time} onChange={(e) => setBooking((b) => ({ ...b, time: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Mode</label>
                <select value={booking.mode} onChange={(e) => setBooking((b) => ({ ...b, mode: e.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2">
                  <option value="In-person">In-person</option>
                  <option value="Virtual">Virtual</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowBookModal(false)} className="flex-1 rounded-lg border py-2 font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-teal-600 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-60">{isSubmitting ? "Booking..." : "Book"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
