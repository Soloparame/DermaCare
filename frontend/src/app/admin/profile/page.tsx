"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";
import {
  User, Mail, Phone, Calendar,
  Activity, AlertCircle, ShieldCheck
} from "lucide-react";

interface Profile {
  id: string;
  role: string;
  fullName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  createdAt: string;
}

export default function AdminProfilePage() {
  const { fetch } = useApi();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetch<Profile>("/auth/me");
        setProfile(data);
      } catch (e) {
        setError((e as ApiError).message ?? "Failed to load profile.");
      }
    })();
  }, [fetch]);

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 border border-red-200 flex items-center gap-3 text-red-700 shadow-sm">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <span className="font-semibold text-sm">{error}</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Activity className="h-10 w-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-bold tracking-wide">Loading your profile...</p>
      </div>
    );
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { dateStyle: "long" }) : "—";

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 text-4xl sm:text-5xl font-black text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] border-4 border-white/10">
            {profile.fullName?.charAt(0) ?? "?"}
          </div>
          <div className="text-center sm:text-left pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider text-indigo-100 mb-3 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5" /> {profile.role} Profile
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{profile.fullName}</h1>
            <p className="text-indigo-100/80 font-medium text-sm flex items-center justify-center sm:justify-start gap-2">
              Account created on {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.5fr]">

        {/* Personal Details Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <User className="h-5 w-5 text-indigo-600" /> Personal Information
          </h3>
          <dl className="grid gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="group">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-indigo-600/80 flex items-center gap-1.5 mb-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </dt>
              <dd className="text-slate-800 font-semibold group-hover:text-indigo-700 transition-colors">{profile.email}</dd>
            </div>
            <div className="group">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-indigo-600/80 flex items-center gap-1.5 mb-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </dt>
              <dd className="text-slate-800 font-semibold group-hover:text-indigo-700 transition-colors">{profile.phone ?? "Not provided"}</dd>
            </div>
            <div className="group">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-indigo-600/80 flex items-center gap-1.5 mb-1.5">
                <Calendar className="h-3.5 w-3.5" /> Date of Birth
              </dt>
              <dd className="text-slate-800 font-semibold group-hover:text-indigo-700 transition-colors">{formatDate(profile.dateOfBirth)}</dd>
            </div>
            <div className="group">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-indigo-600/80 flex items-center gap-1.5 mb-1.5">
                <User className="h-3.5 w-3.5" /> Gender
              </dt>
              <dd className="text-slate-800 font-semibold group-hover:text-indigo-700 transition-colors">{profile.gender ?? "Not provided"}</dd>
            </div>
          </dl>
        </div>

      </div>
    </div>
  );
}
