"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";
import Link from "next/link";

export default function PreassessmentPage() {
  const { fetch } = useApi();
  const [symptoms, setSymptoms] = useState<string>("");
  const [severity, setSeverity] = useState<number>(3);
  const [result, setResult] = useState<{ triageScore: number; createdAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch<{ id: string; triageScore: number; createdAt: string }>("/patient/preassessment", {
        method: "POST",
        body: {
          symptoms: symptoms.split(",").map((s) => s.trim()).filter(Boolean),
          severity,
        },
      });
      setResult({ triageScore: resp.triageScore, createdAt: resp.createdAt });
    } catch (e) {
      setError((e as ApiError).message ?? "Failed to submit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Pre-assessment</h2>
      <p className="text-sm text-slate-600">Describe your skin symptoms to help prioritize care.</p>

      <div>
        <label className="block text-sm font-medium text-slate-700">Symptoms (comma separated)</label>
        <input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400" placeholder="itching, redness, dryness" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Severity</label>
        <input type="range" min={1} max={10} value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="w-full" />
        <div className="text-sm text-slate-600">Value: {severity}</div>
      </div>
      <button disabled={loading} onClick={submit} className="rounded bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
        {loading ? "Submitting..." : "Submit"}
      </button>
      {result && (
        <div className="rounded border bg-teal-50 p-3 text-teal-800">
          Triage score: <strong>{result.triageScore}</strong> · At: {new Date(result.createdAt).toLocaleString()}
        </div>
      )}
      {error && <div className="rounded border bg-rose-50 p-3 text-rose-700">{error}</div>}
      <div><Link className="text-sm font-medium text-teal-600 hover:text-teal-700" href="/patient/dashboard">← Back to dashboard</Link></div>
    </div>
  );
}
