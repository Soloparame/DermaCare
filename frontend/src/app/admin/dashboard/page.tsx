"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";
import {
  Users, UserCheck, Stethoscope, Calendar, Activity,
  ShieldCheck, AlertCircle, RefreshCw, XCircle, CheckCircle, Clock
} from "lucide-react";

interface User {
  id: string;
  role: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalAppointments: number;
  totalPatients: number;
  usersByRole: Record<string, number>;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  patientName: string;
  doctorName: string;
  mode: string;
}

const ROLES = ["patient", "doctor", "nurse", "receptionist", "admin"] as const;

export default function AdminDashboardPage() {
  const { fetch } = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [usersData, statsData, apptData] = await Promise.all([
        fetch<User[]>("/admin/users"),
        fetch<Stats>("/admin/stats"),
        fetch<Appointment[]>("/receptionist/appointments"),
      ]);
      setUsers(usersData);
      setStats(statsData);
      setAppointments(apptData);
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to load data.");
      setUsers([]);
      setStats(null);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [fetch]);

  async function updateRole(userId: string, role: string) {
    try {
      await fetch(`/admin/users/${userId}/role`, { method: "PATCH", body: { role } });
      await loadData();
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to update role.");
    }
  }

  async function updateAppointmentStatus(id: string, status: string) {
    try {
      await fetch(`/receptionist/appointments/${id}`, { method: "PATCH", body: { status } });
      await loadData();
    } catch (err) {
      setError((err as ApiError).message ?? "Failed to update appointment.");
    }
  }

  const doctorsCount = stats?.usersByRole?.doctor ?? 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-10 w-10 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-semibold tracking-wide">Loading administrative data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute -right-6 -top-6 h-24 w-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-4xl font-black mb-1 text-slate-100">{stats?.totalUsers ?? 0}</p>
              <p className="text-sm font-semibold text-slate-400 tracking-wide">Total Users</p>
            </div>
          </div>
        </div>

        {/* Doctors */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 mb-1">{doctorsCount}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Total Doctors</p>
          </div>
        </div>

        {/* Patients */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 mb-1">{stats?.totalPatients ?? 0}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Total Patients</p>
          </div>
        </div>

        {/* Appointments */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div>
            <p className="text-4xl font-black text-slate-800 mb-1">{stats?.totalAppointments ?? 0}</p>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">Total Appointments</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200 p-4 flex items-center gap-3 text-red-700 shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">User Access Management</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">User Name</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Email Address</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Assigned Role</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date Joined</th>
                <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Modify Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No users found in the system.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {u.fullName.substring(0, 2)}
                        </div>
                        <span className="font-bold text-slate-800">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${u.role === "admin" ? "bg-slate-800 text-white shadow-sm" :
                          u.role === "doctor" ? "bg-blue-50 text-blue-700 border border-blue-200/50" :
                            u.role === "patient" ? "bg-teal-50 text-teal-700 border border-teal-200/50" :
                              u.role === "nurse" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-indigo-50 text-indigo-700 border border-indigo-200/50"
                        }`}>
                        {u.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-semibold">{new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        className={`rounded-lg py-1.5 pl-3 pr-8 text-xs font-bold shadow-sm cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em] ${u.role === 'admin' ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                          }`}
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")' }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Appointments Log */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">System-Wide Appointments</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date & Time</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Patient</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Doctor</th>
                <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 text-right font-bold text-slate-400 uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {appointments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No appointments recorded.</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{a.time}</span>
                        <span className="text-xs text-slate-500">{new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-700">{a.patientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <Stethoscope className="h-3 w-3 text-blue-500" /> {a.doctorName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${a.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                          a.status === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-200/50" :
                            a.status === "Completed" ? "bg-slate-100 text-slate-600 border border-slate-200/50" :
                              "bg-rose-50 text-rose-700 border border-rose-200/50"
                        }`}>
                        {a.status === "Confirmed" && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>}
                        {a.status === "Pending" && <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>}
                        {a.status === "Completed" && <CheckCircle className="h-3 w-3" />}
                        {a.status === "Cancelled" && <XCircle className="h-3 w-3" />}
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {a.status === "Pending" && (
                          <>
                            <button
                              onClick={() => updateAppointmentStatus(a.id, "Confirmed")}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                              title="Confirm"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(a.id, "Cancelled")}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                              title="Cancel"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {a.status === "Confirmed" && (
                          <button
                            onClick={() => updateAppointmentStatus(a.id, "Completed")}
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-300"
                            title="Mark Completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {["Completed", "Cancelled"].includes(a.status) && (
                          <span className="text-xs font-bold text-slate-300 mr-2">NO ACTIONS</span>
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
  );
}
