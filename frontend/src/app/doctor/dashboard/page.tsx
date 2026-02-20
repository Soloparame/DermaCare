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
  patientName: string;
}

interface Patient {
  id: string;
  fullName: string;
  email: string;
}

export default function DoctorDashboardPage() {
  const { fetch } = useApi();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "Today" | "Pending" | "Completed">("all");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [record, setRecord] = useState({ patientId: "", notes: "", diagnosis: "", prescriptions: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [apptData, patData] = await Promise.all([
        fetch<Appointment[]>("/doctor/appointments"),
        fetch<Patient[]>("/doctor/patients"),
      ]);
      setAppointments(apptData);
      setPatients(patData);
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to load data.");
      setAppointments([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [fetch]);

  const today = new Date().toISOString().split("T")[0];
  const filtered = appointments.filter((a) => {
    if (filter === "Today") return a.date === today;
    if (filter === "Pending") return a.status === "Pending";
    if (filter === "Completed") return a.status === "Completed";
    return true;
  });

  const todayCount = appointments.filter((a) => a.date === today).length;
  const pendingCount = appointments.filter((a) => a.status === "Pending").length;
  const completedCount = appointments.filter((a) => a.status === "Completed").length;

  async function handleMarkCompleted(apptId: string) {
    try {
      await fetch(`/doctor/appointments/${apptId}`, { method: "PATCH", body: { status: "Completed" } });
      await loadData();
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to update.");
    }
  }

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!record.patientId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await fetch("/doctor/medical-records", {
        method: "POST",
        body: {
          patientId: record.patientId,
          notes: record.notes || undefined,
          diagnosis: record.diagnosis || undefined,
          prescriptions: record.prescriptions || undefined,
        },
      });
      setShowRecordModal(false);
      setRecord({ patientId: "", notes: "", diagnosis: "", prescriptions: "" });
      await loadData();
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to add record.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's appointments" value={todayCount} icon="📅" accent="teal" />
        <StatCard title="Pending consultations" value={pendingCount} icon="⏳" accent="amber" />
        <StatCard title="Completed consultations" value={completedCount} icon="✓" accent="emerald" />
        <StatCard title="Total patients treated" value={patients.length} icon="👥" accent="blue" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900">Appointments</h2>
        <div className="flex gap-2">
          {(["all", "Today", "Pending", "Completed"] as const).map((f) => (
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
        <button
          onClick={() => setShowRecordModal(true)}
          className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
        >
          + Add medical record
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Mode</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No appointments.</td></tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.date}</td>
                  <td className="px-4 py-3 text-slate-700">{a.time}</td>
                  <td className="px-4 py-3 text-slate-700">{a.patientName}</td>
                  <td className="px-4 py-3 text-slate-700">{a.mode}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      a.status === "Confirmed" ? "bg-emerald-100 text-emerald-800" :
                      a.status === "Pending" ? "bg-amber-100 text-amber-800" :
                      a.status === "Completed" ? "bg-slate-200 text-slate-700" : "bg-rose-100 text-rose-800"
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!["Completed", "Cancelled"].includes(a.status) && (
                      <button
                        onClick={() => handleMarkCompleted(a.id)}
                        className="rounded bg-teal-600 px-2 py-1 text-xs font-medium text-white hover:bg-teal-700"
                      >
                        Mark completed
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

      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Add medical record</h3>
            <form onSubmit={handleAddRecord} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Patient</label>
                <select
                  required
                  value={record.patientId}
                  onChange={(e) => setRecord((r) => ({ ...r, patientId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Notes</label>
                <textarea value={record.notes} onChange={(e) => setRecord((r) => ({ ...r, notes: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Diagnosis</label>
                <input value={record.diagnosis} onChange={(e) => setRecord((r) => ({ ...r, diagnosis: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Prescriptions</label>
                <input value={record.prescriptions} onChange={(e) => setRecord((r) => ({ ...r, prescriptions: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowRecordModal(false)} className="flex-1 rounded-lg border py-2 font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-teal-600 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-60">
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
