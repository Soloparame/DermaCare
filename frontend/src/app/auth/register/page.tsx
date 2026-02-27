"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, type ApiError } from "@/lib/api";
import {
  User, Stethoscope, HeartPulse, Building2, ShieldCheck,
  ArrowRight, Activity, ArrowLeft, CheckCircle2,
  Mail, Phone, Lock, Calendar, BookOpen, AlertCircle
} from "lucide-react";

type Role = "patient" | "doctor" | "nurse" | "receptionist" | "admin";
type Step = 1 | 2;

const roles: { id: Role; label: string; description: string; icon: any }[] = [
  { id: "patient", label: "Patient", description: "Book appointments, manage care", icon: User },
  { id: "doctor", label: "Doctor", description: "Consult patients, review records", icon: Stethoscope },
  { id: "nurse", label: "Nurse", description: "Support consultations & vitals", icon: HeartPulse },
  { id: "receptionist", label: "Reception", description: "Manage bookings & queues", icon: Building2 },
  { id: "admin", label: "Admin", description: "Oversee platform & users", icon: ShieldCheck },
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
        confirmPassword,
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
        `Account created! You can now sign in as ${roleLabels[role]}. Redirecting...`
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
          "Unable to create your account right now. Please try again."
        );
      }
      setIsSubmitting(false); // only reset submitting on error
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-teal-600/20 blur-[120px]" />
        <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-6xl z-10 grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12 items-center py-10">

        {/* Left Side: Brand & Value Prop */}
        <div className="hidden lg:flex flex-col justify-center text-white pr-8 animate-in fade-in slide-in-from-left-10 duration-1000">
          <Link href="/" className="inline-flex items-center gap-3 w-max group">
            <div className="p-2.5 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-teal-100">
              DermaCare.
            </span>
          </Link>

          <div className="space-y-6 pt-8">
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white">
              Join our <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">healthcare network.</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed font-medium max-w-md">
              Create an account to manage your dermatological health or join our clinic staff.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {roles.map((r, i) => (
              <div key={r.id} className="flex items-center gap-4 text-slate-200 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
                <div className="h-10 w-10 rounded-full bg-slate-900/80 border border-slate-700/50 flex items-center justify-center text-teal-400 shrink-0">
                  <r.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">{r.label}</h4>
                  <p className="text-sm text-slate-400 font-medium">{r.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="w-full max-w-xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-right-10 duration-1000 delay-150 relative">

          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl blur-xl" />

          <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">

            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="p-2 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">DermaCare.</span>
            </div>

            {/* Progress Steps Header */}
            <div className="mb-8 flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10 -translate-y-1/2 rounded-full overflow-hidden">
                <div className={`h-full bg-teal-500 transition-all duration-500 ${step === 2 ? 'w-full' : 'w-1/2'}`}></div>
              </div>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${step >= 1 ? 'bg-teal-500 border-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>1</div>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-500 ${step >= 2 ? 'bg-teal-500 border-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>2</div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                {step === 1 ? "Create account" : "Additional details"}
              </h2>
              <p className="mt-1 text-sm text-slate-400 font-medium">
                {step === 1 ? "Choose your role and basic details." : "Just a few more things to setup your profile."}
              </p>
            </div>

            {/* Step 1: Role selection & Basics */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-300 ml-1">
                    Registering as
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {roles.map((r) => {
                      const Icon = r.icon;
                      const isSelected = role === r.id;
                      return (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => setRole(r.id)}
                          className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 border transition-all duration-200 ${isSelected
                              ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                              : "bg-slate-950/50 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        >
                          <Icon className={`h-5 w-5 ${isSelected ? "text-teal-400" : ""}`} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">{r.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Full name</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                        </div>
                        <input
                          id="fullName"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm placeholder:text-slate-600"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Phone</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                        </div>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm placeholder:text-slate-600"
                          placeholder="+251..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm placeholder:text-slate-600"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="password" className="block text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Password</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-4 w-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                        </div>
                        <input
                          id="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm placeholder:text-slate-600"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Confirm</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CheckCircle2 className="h-4 w-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                        </div>
                        <input
                          id="confirmPassword"
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm placeholder:text-slate-600"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canGoNext()}
                  onClick={() => setStep(2)}
                  className="w-full mt-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold rounded-xl py-4 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none group"
                >
                  Continue to step 2
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* Step 2: Additional details */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">

                {role === "patient" && (
                  <div className="space-y-2">
                    <label htmlFor="history" className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">
                      Medical History (optional)
                    </label>
                    <div className="relative group">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <BookOpen className="h-4 w-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                      </div>
                      <textarea
                        id="history"
                        rows={4}
                        value={history}
                        onChange={(e) => setHistory(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm placeholder:text-slate-600 resize-none"
                        placeholder="Describe skin concerns, allergies, medications..."
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="dob" className="block text-xs font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">Date of birth</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                      </div>
                      <input
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-sm placeholder:text-slate-600 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wider">Gender</span>
                    <div className="flex gap-2">
                      {["Female", "Male", "Other"].map((g) => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setGender(g)}
                          className={`flex-1 rounded-xl border py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${gender === g
                              ? "border-teal-500 bg-teal-500/20 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.1)]"
                              : "border-slate-700/50 bg-slate-950/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-300 font-medium flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-300 font-medium flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {success}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="group flex-shrink-0 rounded-xl border border-slate-700/50 bg-slate-900 px-4 py-3.5 font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center"
                    title="Go Back"
                  >
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 px-4 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                      <>
                        <Activity className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Complete Registration
                        <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm font-medium text-slate-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">
                  Sign in here
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
