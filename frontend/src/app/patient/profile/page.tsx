"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";

type Profile = {
  id: string;
  role: string;
  fullName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  createdAt: string;
  address?: string | null;
  emergencyContact?: string | null;
  allergies?: string | null;
};

export default function PatientProfilePage() {
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
    return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }
  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Loading profile...</p>
      </div>
    );
  }

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-slate-900">My profile</h2>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-2xl font-bold text-teal-700">
            {profile.fullName?.charAt(0) ?? "?"}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{profile.fullName}</h3>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium capitalize text-teal-700">
              {profile.role}
            </span>
          </div>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-0.5 text-slate-900">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</dt>
            <dd className="mt-0.5 text-slate-900">{profile.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Date of birth</dt>
            <dd className="mt-0.5 text-slate-900">{fmt(profile.dateOfBirth)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Gender</dt>
            <dd className="mt-0.5 text-slate-900">{profile.gender ?? "—"}</dd>
          </div>
          {profile.address !== undefined && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</dt>
              <dd className="mt-0.5 text-slate-900">{profile.address ?? "—"}</dd>
            </div>
          )}
          {profile.emergencyContact !== undefined && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Emergency contact</dt>
              <dd className="mt-0.5 text-slate-900">{profile.emergencyContact ?? "—"}</dd>
            </div>
          )}
          {profile.allergies !== undefined && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Allergies</dt>
              <dd className="mt-0.5 text-slate-900">{profile.allergies ?? "—"}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
