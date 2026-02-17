"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, type ApiError } from "@/lib/api";

const roles = [
  { id: "patient", label: "Patient" },
  { id: "doctor", label: "Doctor" },
  { id: "nurse", label: "Nurse" },
  { id: "receptionist", label: "Receptionist" },
  { id: "admin", label: "Administrator" },
] as const;

type RoleId = (typeof roles)[number]["id"];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleId>("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await apiFetch<{ token: string; role: RoleId }>(
        "/auth/login",
        {
          method: "POST",
          body: { email, password, role },
        }
      );

      if (typeof window !== "undefined") {
        window.localStorage.setItem("derma_token", result.token);
        window.localStorage.setItem("derma_role", result.role);
      }

      const redirectMap: Record<RoleId, string> = {
        patient: "/patient/dashboard",
        doctor: "/doctor/dashboard",
        nurse: "/nurse/dashboard",
        receptionist: "/receptionist/dashboard",
        admin: "/admin/dashboard",
      };

      router.push(redirectMap[result.role]);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.message) {
        setError(apiErr.message);
      } else {
        setError(
          "Unable to sign in. Please check your details or try again later."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 px-4 py-12">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/50 md:grid md:grid-cols-[1.1fr_minmax(0,1fr)]">
        <section className="hidden bg-gradient-to-br from-slate-900 via-teal-900/80 to-slate-900 p-8 text-white md:flex md:flex-col md:justify-between">
          <div>
            <h3 className="text-xl font-bold">DermaCare Online</h3>
            <p className="mt-4 text-sm text-slate-300">
              Sign in with your account. Choose the role that matches your registration—each role 
              has a dedicated dashboard with the tools you need.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                Patients: appointments & virtual visits
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                Doctors & nurses: schedules & records
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                Reception & admin: manage the clinic
              </li>
            </ul>
          </div>
          <div className="mt-8 rounded-xl border border-slate-600/50 bg-slate-800/50 p-4">
            <p className="text-xs font-semibold text-teal-300">New here?</p>
            <p className="mt-1 text-xs text-slate-300">
              Create an account as patient, doctor, nurse, receptionist, or admin from the registration page.
            </p>
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
              Sign in
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Enter your email and password, then select your role.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <p className="block text-sm font-medium text-slate-700">Sign in as</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition ${
                      role === r.id
                        ? "border-teal-500 bg-teal-50 text-teal-800"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-200"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-teal-600 px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-200 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-semibold text-teal-600 hover:text-teal-700">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
