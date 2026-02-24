"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";

export default function NurseVitalsPage() {
  const { fetch } = useApi();
  const [appointmentId, setAppointmentId] = useState("");
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState<number | "">("");
  const [temp, setTemp] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [resp, setResp] = useState<{ triageScore: number; recordedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    setResp(null);
    try {
      const r = await fetch<{ appointmentId: string; triageScore: number; recordedAt: string }>(`/nurse/appointments/${encodeURIComponent(appointmentId)}/vitals`, {
        method: "POST",
        body: {
          bp: bp || undefined,
          hr: hr === "" ? undefined : Number(hr),
          temp: temp === "" ? undefined : Number(temp),
          weight: weight === "" ? undefined : Number(weight),
          notes: notes || undefined,
        },
      });
      setResp({ triageScore: r.triageScore, recordedAt: r.recordedAt });
    } catch (e) {
      setError((e as ApiError).message ?? "Failed to record vitals.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Record vitals</h1>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Appointment ID</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Blood pressure</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Heart rate</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={hr} onChange={(e) => setHr(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Temperature (°C)</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={temp} onChange={(e) => setTemp(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Weight (kg)</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea className="mt-1 w-full rounded border px-3 py-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <button disabled={loading} onClick={submit} className="mt-3 rounded bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{loading ? "Saving..." : "Save"}</button>
      {resp && <div className="mt-2 rounded border bg-emerald-50 p-2 text-emerald-800">Triage score: <strong>{resp.triageScore}</strong> · {new Date(resp.recordedAt).toLocaleString()}</div>}
      {error && <div className="mt-2 rounded border bg-rose-50 p-2 text-rose-700">{error}</div>}
    </div>
  );
}
