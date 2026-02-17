"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { apiFetch, type ApiError } from "@/lib/api";

interface DoctorAppointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  mode: "In-person" | "Virtual";
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
}

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);

  useEffect(() => {
    async function load() {
      try {
        if (typeof window === "undefined") return;
        const token = window.localStorage.getItem("derma_token");
        const data = await apiFetch<DoctorAppointment[]>("/doctor/appointments", {
          method: "GET",
          token,
        });
        setAppointments(data);
      } catch (err) {
        const apiErr = err as ApiError;
        if (!apiErr?.status || apiErr.status >= 500) {
          setAppointments([
            { id: "demo-d-1", patientName: "Sara Bekele", date: "2026-02-20", time: "10:30", mode: "Virtual", status: "Confirmed" },
            { id: "demo-d-2", patientName: "Yared Solomon", date: "2026-02-20", time: "11:00", mode: "In-person", status: "Pending" },
          ]);
        }
      }
    }
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        title="Doctor Dashboard"
        roleLabel="Doctor"
        description="Today&apos;s schedule, virtual consultations, and patient records."
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <DashboardCard
            title="Today&apos;s schedule"
            accent="teal"
            icon="📅"
            subtitle="Your upcoming consultations"
          >
            <ul className="space-y-2">
              {appointments.slice(0, 4).map((appt) => (
                <li key={appt.id} className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
                  <span className="font-medium text-slate-900">{appt.time} · {appt.patientName}</span>
                  <span className="text-xs text-slate-500">{appt.mode}</span>
                </li>
              ))}
              {appointments.length === 0 && (
                <li className="text-slate-500">No appointments scheduled.</li>
              )}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Virtual room"
            accent="sky"
            icon="🎥"
            subtitle="Launch or join Google Meet"
          >
            <p className="text-slate-700">
              Start or join virtual consultations here. Meet links are generated for confirmed virtual visits.
            </p>
          </DashboardCard>

          <DashboardCard
            title="Clinical notes & records"
            accent="slate"
            icon="📋"
            subtitle="Patient records & prescriptions"
          >
            <p className="text-slate-700">
              Access patient histories, add diagnoses, and update prescriptions from your appointments.
            </p>
          </DashboardCard>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Today&apos;s appointments</h2>
          <p className="mt-1 text-sm text-slate-600">All patients scheduled for today</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Patient</th>
                  <th className="pb-3 pr-4">Mode</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 pr-4 font-medium text-slate-900">{appt.time}</td>
                    <td className="py-4 pr-4 text-slate-700">{appt.patientName}</td>
                    <td className="py-4 pr-4 text-slate-700">{appt.mode}</td>
                    <td className="py-4">
                      <span
                        className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ${
                          appt.status === "Confirmed" ? "bg-emerald-100 text-emerald-800" :
                          appt.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
