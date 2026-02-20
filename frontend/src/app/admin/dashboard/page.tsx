"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total users" value={stats?.totalUsers ?? 0} icon="👥" accent="teal" />
        <StatCard title="Total doctors" value={doctorsCount} icon="👨‍⚕️" accent="blue" />
        <StatCard title="Total patients" value={stats?.totalPatients ?? 0} icon="🩺" accent="emerald" />
        <StatCard title="Total appointments" value={stats?.totalAppointments ?? 0} icon="📅" accent="amber" />
      </div>

      <h2 className="text-lg font-bold text-slate-900">User management</h2>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Change role</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No users.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                  <td className="px-4 py-3 text-slate-700">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${
                      u.role === "admin" ? "bg-slate-200 text-slate-800" :
                      u.role === "doctor" ? "bg-blue-100 text-blue-800" :
                      u.role === "patient" ? "bg-teal-100 text-teal-800" :
                      u.role === "nurse" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="rounded border border-slate-200 px-2 py-1 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-bold text-slate-900">All appointments</h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Doctor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No appointments.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.date}</td>
                  <td className="px-4 py-3 text-slate-700">{a.time}</td>
                  <td className="px-4 py-3 text-slate-700">{a.patientName}</td>
                  <td className="px-4 py-3 text-slate-700">{a.doctorName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      a.status === "Confirmed" ? "bg-emerald-100 text-emerald-800" :
                      a.status === "Pending" ? "bg-amber-100 text-amber-800" :
                      a.status === "Completed" ? "bg-slate-200 text-slate-700" : "bg-rose-100 text-rose-800"
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.status === "Pending" && (
                      <>
                        <button onClick={() => updateAppointmentStatus(a.id, "Confirmed")} className="mr-1 rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700">Confirm</button>
                        <button onClick={() => updateAppointmentStatus(a.id, "Cancelled")} className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700">Cancel</button>
                      </>
                    )}
                    {a.status === "Confirmed" && (
                      <button onClick={() => updateAppointmentStatus(a.id, "Completed")} className="rounded bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700">Complete</button>
                    )}
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
