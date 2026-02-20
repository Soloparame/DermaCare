"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";

interface MedicalRecord {
  id: string;
  notes: string | null;
  diagnosis: string | null;
  prescriptions: string | null;
  createdAt: string;
  doctorName: string;
}

export default function PatientMedicalHistoryPage() {
  const { fetch } = useApi();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetch<MedicalRecord[]>("/patient/medical-records");
        setRecords(data);
      } catch (err) {
        setError((err as ApiError).message ?? "Failed to load records.");
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetch]);

  const diagnoses = records
    .map((r) => r.diagnosis)
    .filter(Boolean) as string[];

  const recommendations = diagnoses.length > 0
    ? [
        ...new Set(diagnoses.flatMap((d) => {
          const lower = d.toLowerCase();
          if (lower.includes("acne")) return ["Follow skincare routine", "Avoid oily products"];
          if (lower.includes("eczema") || lower.includes("dermatitis")) return ["Use moisturizer regularly", "Avoid irritants"];
          if (lower.includes("rash")) return ["Monitor for changes", "Avoid allergens"];
          return ["Follow-up as recommended by your doctor"];
        })),
      ]
    : ["No recommendations yet. Complete consultations to get personalized advice."];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Medical history</h2>

      {records.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-sm font-semibold text-amber-800">Recommendations based on your history</p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-900">
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Doctor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Diagnosis</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Notes</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Prescriptions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No medical records yet.</td></tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-700">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{r.doctorName}</td>
                  <td className="px-4 py-3 text-slate-700">{r.diagnosis || "—"}</td>
                  <td className="max-w-xs px-4 py-3 text-sm text-slate-600">{r.notes || "—"}</td>
                  <td className="max-w-xs px-4 py-3 text-sm text-slate-600">{r.prescriptions || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
