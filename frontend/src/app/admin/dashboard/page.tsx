"use client";

import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        title="Administrator Dashboard"
        roleLabel="Administrator"
        description="Manage users, roles, and platform analytics."
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <DashboardCard
            title="User & role management"
            accent="teal"
            icon="👥"
            subtitle="Control access and permissions"
          >
            <p className="text-slate-700">
              View and manage all registered users—patients, doctors, nurses, receptionists, and admins. 
              Create accounts, update roles, and deactivate users.
            </p>
          </DashboardCard>

          <DashboardCard
            title="System activity"
            accent="sky"
            icon="📊"
            subtitle="Audit logs and security"
          >
            <p className="text-slate-700">
              Monitor logins, appointment changes, and record updates. Track usage and ensure compliance with data protection.
            </p>
          </DashboardCard>

          <DashboardCard
            title="Clinic analytics"
            accent="slate"
            icon="📈"
            subtitle="KPIs and reports"
          >
            <p className="text-slate-700">
              View metrics: total visits, virtual vs in-person ratio, and average wait times for informed decisions.
            </p>
          </DashboardCard>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-600">Common administrative tasks</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50">
              View all users
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50">
              Export report
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50">
              System settings
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
