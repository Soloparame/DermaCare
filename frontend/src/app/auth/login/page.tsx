"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, type ApiError } from "@/lib/api";
import {
  Mail, Lock, User, Stethoscope, HeartPulse,
  Building2, ShieldCheck, ArrowRight, Activity,
  Sparkles, CheckCircle2
} from "lucide-react";

const roles = [
  { id: "patient", label: "Patient", icon: User },
  { id: "doctor", label: "Doctor", icon: Stethoscope },
  { id: "nurse", label: "Nurse", icon: HeartPulse },
  { id: "receptionist", label: "Reception", icon: Building2 },
  { id: "admin", label: "Admin", icon: ShieldCheck },
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
          "Unable to sign in. Please check your details or try again."
        );
      }
      setIsSubmitting(false); // only reset if error. if successful, let it stay loading until redirect
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-teal-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-6xl z-10 grid lg:grid-cols-2 gap-8 lg:gap-0 items-center">

        {/* Left Side: Brand & Value Prop */}
        <div className="hidden lg:flex flex-col justify-center text-white pr-12 lg:pr-24 space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
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
              The future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">dermatology care.</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed font-medium max-w-md">
              Sign in to your account and experience seamless access to intelligent care, appointments, and medical records.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {[
              "Intelligent patient management",
              "Secure and private consultations",
              "Real-time scheduling and updates",
              "Comprehensive medical analytics"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-200">
                <CheckCircle2 className="h-5 w-5 text-teal-400 flex-shrink-0" />
                <span className="font-medium text-base">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto animate-in fade-in slide-in-from-right-10 duration-1000 delay-150 relative">

          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl blur-xl" />

          <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">

            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="p-2 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">DermaCare.</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Welcome back <Sparkles className="h-5 w-5 text-teal-400" />
              </h2>
              <p className="mt-2 text-sm text-slate-400 font-medium">
                Enter your details to sign in to your dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 flex flex-col">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-300 mb-1.5 ml-1">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-slate-600 font-medium"
                    placeholder="hello@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-300 mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-700/50 text-white rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-slate-600 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-bold text-slate-300 mb-2.5 ml-1">
                  Sign in as
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 border border-transparent transition-all duration-200 ${isSelected
                            ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.2)] scale-[1.02]"
                            : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 hover:border-slate-600/50"
                          }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? "text-teal-400 drop-shadow-md" : ""}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-300 font-medium flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold rounded-2xl py-4 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <>
                    <Activity className="h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Account
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm font-medium text-slate-400">
                New to DermaCare?{" "}
                <Link href="/auth/register" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">
                  Create an account
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
