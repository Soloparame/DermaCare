"use client";

import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

export default function ReceptionistDashboardPage() {
  const demoQueue = [
    { id: "q1", patientName: "Sara Bekele", reason: "Acne follow-up", status: "Waiting" },
    { id: "q2", patientName: "Yared Solomon", reason: "New rash", status: "Checked-in" },
    { id: "q3", patientName: "Tigist Abebe", reason: "Skin check", status: "Waiting" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        title="Reception Dashboard"
        roleLabel="Receptionist"
        description="Manage today&apos;s queue and appointments."
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <DashboardCard
            title="Today&apos;s bookings"
            accent="teal"
            icon="📅"
            subtitle="Appointments needing confirmation"
          >
            <p className="text-slate-700">
              View pending appointment requests. Confirm, reschedule, or cancel bookings from patients.
            </p>
          </DashboardCard>

          <DashboardCard
            title="Waiting room"
            accent="sky"
            icon="🪑"
            subtitle="Patients at the clinic"
          >
            <ul className="space-y-2">
              {demoQueue.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2"
                >
                  <span className="font-medium text-slate-900">{item.patientName}</span>
                  <span className="text-xs text-slate-500">{item.status}</span>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Reminders"
            accent="amber"
            icon="🔔"
            subtitle="Send appointment reminders"
          >
            <p className="text-slate-700">
              Send SMS or email reminders to patients about upcoming appointments.
            </p>
          </DashboardCard>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Today&apos;s queue</h2>
          <p className="mt-1 text-sm text-slate-600">Patients waiting to be seen</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4">Patient</th>
                  <th className="pb-3 pr-4">Reason</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {demoQueue.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 pr-4 font-medium text-slate-900">{item.patientName}</td>
                    <td className="py-4 pr-4 text-slate-700">{item.reason}</td>
                    <td className="py-4">
                      <span
                        className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ${
                          item.status === "Checked-in" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
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
