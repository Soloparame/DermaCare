"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";

interface Stats {
  totalAppointments: number;
  completed: number;
  pending: number;
  medicalRecordsCount: number;
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

  const nextAppt = appointments.find((a) => a.status !== "Cancelled" && new Date(a.date) >= new Date());

  if (loading) {
    return <div className="text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total appointments" value={stats?.totalAppointments ?? 0} icon="📅" accent="teal" />
        <StatCard title="Completed consultations" value={stats?.completed ?? 0} icon="✓" accent="emerald" />
        <StatCard title="Pending appointments" value={stats?.pending ?? 0} icon="⏳" accent="amber" />
        <StatCard title="Medical records" value={stats?.medicalRecordsCount ?? 0} icon="📋" accent="blue" />
      </div>

      {nextAppt && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-5">
          <p className="text-sm font-semibold text-teal-800">Next appointment</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{nextAppt.date} at {nextAppt.time}</p>
          <p className="text-slate-700">{nextAppt.doctorName} · {nextAppt.mode}</p>
          <span className={`mt-2 inline-block rounded-lg px-2 py-1 text-xs font-semibold ${
            nextAppt.status === "Confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}>{nextAppt.status}</span>
          <p className="mt-4">
            <Link href="/patient/appointments" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
              View all appointments →
            </Link>
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/patient/appointments"
          className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
        >
          Book appointment
        </Link>
        <Link
          href="/patient/medical-history"
          className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Medical history
        </Link>
        <Link
          href="/patient/preassessment"
          className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Pre‑assessment
        </Link>
        <Link
          href="/patient/chat"
          className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Appointment chat
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
