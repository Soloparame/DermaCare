"use client";

import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

export default function NurseDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        title="Nurse Dashboard"
        roleLabel="Nurse"
        description="Prepare patients and support consultations."
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <DashboardCard
            title="Patients to prepare"
            accent="teal"
            icon="🩺"
            subtitle="Today&apos;s consultation queue"
          >
            <p className="text-slate-700">
              View patients requiring preparation, vitals, or imaging before they see the dermatologist.
            </p>
          </DashboardCard>

          <DashboardCard
            title="Vitals & observations"
            accent="sky"
            icon="📋"
            subtitle="Update clinical notes"
          >
            <p className="text-slate-700">
              Record vitals, lesion descriptions, and observations to attach to patient medical records.
            </p>
          </DashboardCard>

          <DashboardCard
            title="Follow-up reminders"
            accent="amber"
            icon="🔔"
            subtitle="Ongoing care support"
          >
            <p className="text-slate-700">
              See which patients need follow-up contact or lab result notifications.
            </p>
          </DashboardCard>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Today&apos;s patients</h2>
          <p className="mt-1 text-sm text-slate-600">Patients scheduled for consultation</p>
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/50 p-8 text-center text-slate-500">
            No patients in queue. Connect to the appointments API to see the full list.
          </div>
        </section>
      </main>
    </div>
  );
}
