"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { apiFetch, type ApiError } from "@/lib/api";

interface Appointment {
  id: string;
  doctorName: string;
  date: string;
  time: string;
  mode: "In-person" | "Virtual";
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
}

export default function PatientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAppointments() {
      try {
        if (typeof window === "undefined") return;
        const token = window.localStorage.getItem("derma_token");
        const data = await apiFetch<Appointment[]>("/patient/appointments", {
          method: "GET",
          token,
        });
        setAppointments(data);
      } catch (err) {
        const apiErr = err as ApiError;
        if (!apiErr?.status || apiErr.status >= 500) {
          setAppointments([
            { id: "demo-1", doctorName: "Dr. Hana Alemu", date: "2026-02-20", time: "10:30", mode: "Virtual", status: "Confirmed" },
            { id: "demo-2", doctorName: "Dr. Michael Tesfaye", date: "2026-02-28", time: "15:00", mode: "In-person", status: "Pending" },
          ]);
        } else {
          setError(apiErr.message ?? "Unable to load appointments.");
        }
      }
    }
    void loadAppointments();
  }, []);

  const nextAppt = appointments[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        title="Patient Dashboard"
        roleLabel="Patient"
        description="View appointments, join virtual consultations, and manage your skin care."
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <DashboardCard
            title="Next appointment"
            accent="teal"
            icon="📅"
            subtitle="Your upcoming visit"
          >
            {!nextAppt ? (
              <p className="text-slate-600">No appointments yet. Book one from the reception or online booking.</p>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold text-slate-900">
                  {nextAppt.date} · {nextAppt.time}
                </p>
                <p className="text-slate-700">{nextAppt.doctorName}</p>
                <p className="text-slate-600">{nextAppt.mode}</p>
                <span
                  className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ${
                    nextAppt.status === "Confirmed" ? "bg-emerald-100 text-emerald-800" :
                    nextAppt.status === "Pending" ? "bg-amber-100 text-amber-800" :
                    nextAppt.status === "Completed" ? "bg-sky-100 text-sky-800" :
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {nextAppt.status}
                </span>
              </div>
            )}
          </DashboardCard>

          <DashboardCard
            title="Virtual consultation"
            accent="sky"
            icon="🎥"
            subtitle="Join Google Meet when it&apos;s time"
          >
            <p className="text-slate-700">
              When you have a virtual visit, a secure Google Meet link will appear here before your appointment.
            </p>
          </DashboardCard>

          <DashboardCard
            title="Your history"
            accent="slate"
            icon="📋"
            subtitle="Past consultations & treatment"
          >
            <p className="text-slate-700">
              View your dermatology history, diagnoses, and treatment plans from previous visits.
            </p>
          </DashboardCard>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Upcoming appointments</h2>
          <p className="mt-1 text-sm text-slate-600">All your scheduled visits</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Dermatologist</th>
                  <th className="pb-3 pr-4">Mode</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 pr-4 font-medium text-slate-900">{appt.date}</td>
                    <td className="py-4 pr-4 text-slate-700">{appt.time}</td>
                    <td className="py-4 pr-4 text-slate-700">{appt.doctorName}</td>
                    <td className="py-4 pr-4 text-slate-700">{appt.mode}</td>
                    <td className="py-4">
                      <span
                        className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ${
                          appt.status === "Confirmed" ? "bg-emerald-100 text-emerald-800" :
                          appt.status === "Pending" ? "bg-amber-100 text-amber-800" :
                          appt.status === "Completed" ? "bg-sky-100 text-sky-800" :
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No appointments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
          )}
        </section>
      </main>
    </div>
  );
}
