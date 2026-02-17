"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, type ApiError } from "@/lib/api";

type Role = "patient" | "doctor" | "nurse" | "receptionist" | "admin";
type Step = 1 | 2;

const roles: { id: Role; label: string; description: string }[] = [
  { id: "patient", label: "Patient", description: "Book appointments, manage skin care" },
  { id: "doctor", label: "Doctor", description: "Consult patients, manage records" },
  { id: "nurse", label: "Nurse", description: "Support consultations, track vitals" },
  { id: "receptionist", label: "Receptionist", description: "Manage bookings and queue" },
  { id: "admin", label: "Administrator", description: "Oversee platform and users" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role>("patient");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [history, setHistory] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function canGoNext() {
    if (step === 1) {
      return role && fullName && email && password && confirmPassword;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        role,
        fullName,
        email,
        password,
        dateOfBirth: dob || undefined,
        gender: gender || undefined,
        phone: phone || undefined,
      };
      if (role === "patient") {
        body.dermatologyHistory = history;
      }

      await apiFetch<{ id: string }>("/auth/register", {
        method: "POST",
        body,
      });

      const roleLabels: Record<Role, string> = {
        patient: "patient",
        doctor: "doctor",
        nurse: "nurse",
        receptionist: "receptionist",
        admin: "administrator",
      };
      setSuccess(
        `Account created successfully! You can now sign in as ${roleLabels[role]}.`
      );

      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.message) {
        setError(apiErr.message);
      } else {
        setError(
          "Unable to create your account right now. Please try again later."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 px-4 py-12">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/50 md:grid md:grid-cols-[1.1fr_minmax(0,1fr)]">
        <section className="p-6 sm:p-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
              Create account
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Join DermaCare as...
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose your role, then fill in your details. Each role has a tailored dashboard.
            </p>
          </div>

          {/* Step 1: Role selection */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  I am registering as
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all ${
                        role === r.id
                          ? "border-teal-500 bg-teal-50/80 shadow-sm"
                          : "border-slate-200 bg-slate-50/50 hover:border-teal-200 hover:bg-teal-50/40"
                      }`}
                    >
                      <span className="font-semibold text-slate-900">{r.label}</span>
                      <span className="mt-0.5 text-xs text-slate-600">{r.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-600">Personal details</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <label htmlFor="fullName" className="block text-xs text-slate-600">Full name</label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      placeholder="e.g. Sara Bekele"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="block text-xs text-slate-600">Email</label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs text-slate-600">Phone</label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        placeholder="+251..."
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="password" className="block text-xs text-slate-600">Password</label>
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        placeholder="Create a strong password"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-xs text-slate-600">Confirm password</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                        placeholder="Repeat password"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!canGoNext()}
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white shadow-lg shadow-teal-200 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Additional details */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {role === "patient" && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <label htmlFor="history" className="block text-sm font-medium text-slate-700">
                    Dermatology history / skin concerns (optional)
                  </label>
                  <textarea
                    id="history"
                    rows={4}
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    placeholder="Describe skin concerns, allergies, medications, or previous diagnoses."
                  />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="dob" className="block text-xs text-slate-600">Date of birth</label>
                  <input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-600">Gender</span>
                  <div className="mt-2 flex gap-2">
                    {["Female", "Male", "Other"].map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setGender(g)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          gender === g
                            ? "border-teal-500 bg-teal-50 text-teal-800"
                            : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
              {success && (
                <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white shadow-lg shadow-teal-200 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? "Creating account..." : "Create account"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-teal-600 hover:text-teal-700">
              Sign in
            </Link>
          </p>
        </section>

        <section className="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900/80 p-8 text-white md:flex md:flex-col md:justify-between">
          <div>
            <h3 className="text-xl font-bold">DermaCare Online</h3>
            <p className="mt-4 text-sm text-slate-300">
              Register as a patient to book appointments, or as staff to access your workspace. 
              All accounts are secure and role-based.
            </p>
            <div className="mt-6 space-y-3">
              {roles.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400" />
                  <span className="text-sm text-slate-200">{r.label}: {r.description}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-xl border border-slate-600/50 bg-slate-800/50 p-4">
            <p className="text-xs font-semibold text-teal-300">After registration</p>
            <p className="mt-2 text-xs text-slate-300">
              Sign in with your email and password, select your role, and you&apos;ll be redirected to your dashboard.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
