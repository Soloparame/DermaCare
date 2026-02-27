"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";
import {
  Calendar, Users, CheckCircle, Clock, Plus, Activity,
  FileText, Search, Filter, AlertCircle, X, ChevronRight, Stethoscope
} from "lucide-react";

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
  const [filter, setFilter] = useState<"all" | "Today" | "Pending" | "Completed">("Today");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [record, setRecord] = useState({ patientId: "", notes: "", diagnosis: "", prescriptions: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [vitalsError, setVitalsError] = useState<string | null>(null);
  const [vitals, setVitals] = useState<{
    appointmentId: string;
    bp?: string | null;
    hr?: number | null;
    temp?: number | null;
    weight?: number | null;
    notes?: string | null;
    triageScore?: number | null;
    recordedAt?: string;
  } | null>(null);

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
  }).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

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

  async function handleViewVitals(apptId: string) {
    setShowVitalsModal(true);
    setVitalsLoading(true);
    setVitalsError(null);
    setVitals(null);
    try {
      const data = await fetch<{
        appointmentId: string;
        bp?: string | null;
        hr?: number | null;
        temp?: number | null;
        weight?: number | null;
        notes?: string | null;
        triageScore?: number | null;
        recordedAt?: string;
      }>(`/doctor/appointments/${apptId}/vitals`);
      setVitals(data);
    } catch (err) {
      setVitalsError((err as ApiError).message ?? "Failed to load vitals.");
    } finally {
      setVitalsLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-teal-600">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Stethoscope className="h-10 w-10 text-teal-500 animate-pulse" />
          <p className="text-slate-500 font-medium tracking-wide">Fetching clinical data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-teal-500/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-6 -top-6 h-24 w-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-4xl font-black mb-1">{todayCount}</p>
              <p className="text-sm font-semibold text-teal-50 tracking-wide">Today's Visits</p>
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 mb-1">{pendingCount}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Pending</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 mb-1">{completedCount}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Completed</p>
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-500" />
            </div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 mb-1">{patients.length}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Total Patients</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200 p-4 flex items-center gap-3 text-red-700 shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col h-full min-h-[500px]">
            {/* Table Header Controls */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Appointments</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(["Today", "Pending", "Completed", "all"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f
                        ? "bg-white text-teal-700 shadow-sm border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      }`}
                  >
                    {f === "all" ? "All" : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Time & Date</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Patient</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Type</th>
                    <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <Calendar className="h-12 w-12 text-slate-200 mb-3" />
                          <p className="font-medium text-slate-600">No appointments found</p>
                          <p className="text-xs mt-1">Try changing your filters or check back later.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{a.time}</span>
                            <span className="text-xs text-slate-500">{new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                              {a.patientName.substring(0, 2)}
                            </div>
                            <span className="font-semibold text-slate-700">{a.patientName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            {a.mode === 'Video Call' ? <Activity className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {a.mode}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${a.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                              a.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                                a.status === "Completed" ? "bg-slate-100 text-slate-600 border border-slate-200/50" :
                                  "bg-rose-50 text-rose-700 border border-rose-200/50"
                            }`}>
                            {a.status === "Confirmed" && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>}
                            {a.status === "Pending" && <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>}
                            {a.status === "Completed" && <CheckCircle className="h-3 w-3" />}
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleViewVitals(a.id)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Vitals"
                            >
                              <Activity className="h-4 w-4" />
                            </button>
                            {!["Completed", "Cancelled"].includes(a.status) && (
                              <button
                                onClick={() => handleMarkCompleted(a.id)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Mark Completed"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
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
        </div>

        {/* Right Column - Actions Panel */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden text-white">
            <div className="absolute -right-10 -top-10 h-32 w-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-500/20 rounded-xl text-teal-400">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Clinical Records</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">Ensure all patient encounters are thoroughly documented for care continuity.</p>
              <button
                onClick={() => setShowRecordModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all"
              >
                <Plus className="h-5 w-5" /> Create New Entry
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-teal-600" /> Recent Patients</h3>
            <div className="space-y-3">
              {patients.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition w-full text-left">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs">
                    {p.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{p.email}</p>
                  </div>
                  <button className="h-8 w-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 shrink-0 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {patients.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-sm">
                  No patients found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-xl">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Patient Vitals</h3>
              </div>
              <button
                onClick={() => setShowVitalsModal(false)}
                className="rounded-full h-8 w-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {vitalsLoading && (
                <div className="flex flex-col items-center justify-center py-10 opacity-70">
                  <Activity className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
                  <p className="text-sm font-medium text-slate-500">Retrieving metrics...</p>
                </div>
              )}

              {!vitalsLoading && vitalsError && (
                <div className="rounded-2xl bg-red-50 p-4 flex items-center gap-3 text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-semibold">{vitalsError}</p>
                </div>
              )}

              {!vitalsLoading && !vitalsError && vitals && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs font-semibold uppercase text-slate-400 mb-1 tracking-wider">Blood Pressure</p>
                      <p className="text-xl font-bold text-slate-800">{vitals.bp ?? "—"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs font-semibold uppercase text-slate-400 mb-1 tracking-wider">Heart Rate</p>
                      <p className="text-xl font-bold text-slate-800">{vitals.hr ? `${vitals.hr} bpm` : "—"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs font-semibold uppercase text-slate-400 mb-1 tracking-wider">Temperature</p>
                      <p className="text-xl font-bold text-slate-800">{vitals.temp ? `${vitals.temp} °C` : "—"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs font-semibold uppercase text-slate-400 mb-1 tracking-wider">Weight</p>
                      <p className="text-xl font-bold text-slate-800">{vitals.weight ? `${vitals.weight} kg` : "—"}</p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100/50">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold uppercase text-indigo-800/60 tracking-wider">Triage Score</p>
                      <span className="px-2.5 py-1 bg-white rounded-full text-indigo-700 text-xs font-bold shadow-sm">{vitals.triageScore ?? "N/A"}/10</span>
                    </div>
                    <div className="w-full bg-indigo-200/50 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(vitals.triageScore ?? 0) * 10}%` }}></div>
                    </div>
                  </div>

                  {vitals.notes && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wider flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Clinical Notes</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{vitals.notes}</p>
                    </div>
                  )}

                  {vitals.recordedAt && (
                    <p className="text-xs text-center font-medium text-slate-400 pt-2">
                      Recorded {new Date(vitals.recordedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {!vitalsLoading && !vitalsError && !vitals && (
                <div className="text-center py-10 text-slate-500">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No vitals documented for this encounter.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowVitalsModal(false)}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-teal-600">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center bg-white/20 text-white rounded-xl backdrop-blur-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Clinical Documentation</h3>
              </div>
              <button
                onClick={() => setShowRecordModal(false)}
                disabled={isSubmitting}
                className="rounded-full h-8 w-8 flex items-center justify-center text-teal-100 hover:bg-white/20 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="record-form" onSubmit={handleAddRecord} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Select Patient <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={record.patientId}
                    onChange={(e) => setRecord((r) => ({ ...r, patientId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all appearance-none"
                  >
                    <option value="" disabled>Choose a patient from your roster...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Primary Diagnosis</label>
                  <input
                    value={record.diagnosis}
                    onChange={(e) => setRecord((r) => ({ ...r, diagnosis: e.target.value }))}
                    placeholder="e.g. Atopic dermatitis, moderate severity"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Prescriptions & Plan</label>
                  <textarea
                    value={record.prescriptions}
                    onChange={(e) => setRecord((r) => ({ ...r, prescriptions: e.target.value }))}
                    placeholder="Medications, lifestyle changes, follow-up instructions..."
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Clinical Notes</label>
                  <textarea
                    value={record.notes}
                    onChange={(e) => setRecord((r) => ({ ...r, notes: e.target.value }))}
                    placeholder="Detailed subjective and objective findings..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setShowRecordModal(false)}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="record-form"
                disabled={isSubmitting || !record.patientId}
                className="px-6 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-500 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <><Activity className="h-4 w-4 animate-spin" /> Committing...</>
                ) : (
                  <><CheckCircle className="h-4 w-4" /> Save Record</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
