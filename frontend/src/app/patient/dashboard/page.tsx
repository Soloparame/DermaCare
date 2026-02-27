"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";
import { Calendar, Activity, FileText, MessageSquare, Clock, CheckCircle, AlertCircle, ArrowRight, ShieldPlus, ArrowUpRight } from "lucide-react";

interface Stats {
  totalAppointments: number;
  completed: number;
  pending: number;
  medicalRecordsCount: number;
  lastTriageScore: number | null;
  lastTriageAt: string | null;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  mode: string;
  status: string;
  doctorName: string;
  paymentStatus?: string;
}

export default function PatientDashboardPage() {
  const { fetch } = useApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsData, apptData] = await Promise.all([
          fetch<Stats>("/patient/stats"),
          fetch<Appointment[]>("/patient/appointments"),
        ]);
        setStats(statsData);
        setAppointments(apptData);
      } catch (err) {
        setError((err as ApiError).message ?? "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetch]);

  const upcomingAppts = appointments.filter((a) => a.status !== "Cancelled" && new Date(a.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextAppt = upcomingAppts.length > 0 ? upcomingAppts[0] : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-teal-600">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Activity className="h-10 w-10 text-teal-500 animate-bounce" />
          <p className="text-slate-500 font-medium">Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-indigo-900 border border-teal-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 px-8 py-10 sm:px-12 sm:py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left text-white max-w-xl space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-teal-100 mb-2">
              <ShieldPlus className="h-4 w-4" /> Secure Patient Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Your Health Overview</h1>
            <p className="text-teal-100/80 text-lg leading-relaxed font-medium max-w-md">Access your appointments, medical records, and communicate securely with your care team.</p>
          </div>

          <div className="flex-shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <Link href="/patient/appointments" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-teal-900 font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] hover:-translate-y-0.5 transition-all w-full sm:w-auto">
              <Calendar className="h-5 w-5" /> Book Appointment
            </Link>
            <Link href="/patient/preassessment" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-700/50 border border-teal-500/50 text-white font-bold rounded-xl hover:bg-teal-700/70 hover:-translate-y-0.5 transition-all backdrop-blur-sm w-full sm:w-auto">
              <Activity className="h-5 w-5" /> Try Triage
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200 p-4 flex items-center gap-3 text-red-700 shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column - Priority Items */}
        <div className="lg:col-span-2 space-y-8">
          {/* Next Appointment Card */}
          {nextAppt ? (
            <div className="bg-white rounded-3xl p-1 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:shadow-2xl hover:shadow-teal-100 transition-shadow">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              <div className="bg-gradient-to-r from-teal-50 to-white rounded-[22px] p-6 sm:p-8 border border-white relative z-10 flex flex-col sm:flex-row items-center gap-6">

                <div className="h-24 w-24 rounded-2xl bg-teal-600 text-white flex flex-col items-center justify-center shadow-lg shadow-teal-600/20 flex-shrink-0">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">{new Date(nextAppt.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-3xl font-black">{new Date(nextAppt.date).getDate()}</span>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-100/50 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <Clock className="h-3 w-3" /> Upcoming Appointment
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{nextAppt.time}</h3>
                  <p className="text-slate-600 font-medium mt-1 flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-slate-800 font-semibold">{nextAppt.doctorName}</span> &bull; {nextAppt.mode}
                  </p>
                  <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${nextAppt.status === "Confirmed" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}>
                      {nextAppt.status === "Confirmed" && <CheckCircle className="h-3 w-3" />}
                      {nextAppt.status}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 w-full sm:w-auto h-full flex flex-col justify-center">
                  <Link href="/patient/appointments" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                    Manage <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
              <div className="h-20 w-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No upcoming appointments</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">You don't have any consultations scheduled. Book an appointment to see a specialist.</p>
              <Link href="/patient/appointments" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-colors">
                Book Now
              </Link>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center sm:items-start transition hover:border-teal-200 hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{stats?.totalAppointments ?? 0}</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">Total Visits</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center sm:items-start transition hover:border-emerald-200 hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <CheckCircle className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{stats?.completed ?? 0}</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">Completed</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center sm:items-start transition hover:border-amber-200 hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{stats?.pending ?? 0}</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">Pending</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center sm:items-start transition hover:border-blue-200 hover:shadow-md">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{stats?.medicalRecordsCount ?? 0}</p>
              <p className="text-sm font-semibold text-slate-500 mt-1">Records</p>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Health Status */}
        <div className="space-y-6">
          {/* Triage Status */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden text-white">
            <div className="absolute -right-10 -top-10 h-32 w-32 bg-teal-500/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-100 flex items-center gap-2"><Activity className="h-4 w-4 text-teal-400" /> Triage Status</h3>
                {stats?.lastTriageScore !== null && stats?.lastTriageScore !== undefined && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${stats.lastTriageScore >= 4 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      stats.lastTriageScore >= 2 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                    Score: {stats.lastTriageScore}
                  </span>
                )}
              </div>

              {stats?.lastTriageScore !== null && stats?.lastTriageScore !== undefined ? (
                <div>
                  <div className="flex items-end gap-3 mb-2">
                    <span className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">{stats.lastTriageScore}</span>
                    <span className="text-slate-400 font-medium mb-1.5">/ 10</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-5 line-clamp-2 leading-relaxed">
                    {stats.lastTriageScore >= 4 ? 'Symptoms require attention. Ensure your upcoming appointment is soon.' : 'Symptoms appear stable based on your latest self-assessment.'}
                  </p>

                  {stats?.lastTriageAt && (
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-4">
                      Last evaluated: {new Date(stats.lastTriageAt).toLocaleDateString()}
                    </p>
                  )}

                  <Link href="/patient/preassessment" className="flex items-center justify-between w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors font-semibold text-sm">
                    Retake Assessment <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Activity className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 mb-4 font-medium">No recent symptom assessments found.</p>
                  <Link href="/patient/preassessment" className="inline-flex items-center justify-center w-full p-3 bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors font-semibold text-sm text-white shadow-lg shadow-teal-500/20">
                    Start Triage <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/patient/chat" className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50 group transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center text-slate-500 group-hover:text-teal-600 shadow-sm transition-colors">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-slate-700 group-hover:text-slate-900">Your Chat Timeline</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-teal-500" />
              </Link>

              <Link href="/patient/medical-history" className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 group transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center text-slate-500 group-hover:text-indigo-600 shadow-sm transition-colors">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-slate-700 group-hover:text-slate-900">Medical History</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
