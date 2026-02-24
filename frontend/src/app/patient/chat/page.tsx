"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";

interface Msg {
  id: string;
  appointmentId: string;
  senderRole: string;
  content: string;
  createdAt: string;
}
interface Appointment {
  id: string;
  date: string;
  time: string;
  mode: string;
  status: string;
  doctorName: string;
}

export default function PatientChatPage() {
  const { fetch, getToken } = useApi();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const confirmedAppointments = appointments.filter((a) =>
    ["Confirmed", "Completed"].includes(a.status)
  );
  const selectedAppointment = confirmedAppointments.find((a) => a.id === appointmentId);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetch<Appointment[]>("/patient/appointments");
        setAppointments(data);
        const first = data.find((a) =>
          ["Confirmed", "Completed"].includes(a.status)
        );
        if (first && !appointmentId) setAppointmentId(first.id);
      } catch (e) {
        setError((e as ApiError).message ?? "Failed to load appointments.");
      }
    })();
  }, [fetch]);

  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [appointmentId]);

  const load = useCallback(async () => {
    if (!appointmentId) return;
    try {
      const data = await fetch<Msg[]>(`/patient/chat/${appointmentId}/messages`);
      setMessages(data);
    } catch (e) {
      setError((e as ApiError).message ?? "Failed to load messages.");
    }
  }, [appointmentId, fetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function send() {
    if (!text.trim() || !appointmentId) return;
    try {
      const msg = await fetch<Msg, { content: string }>(
        `/patient/chat/${appointmentId}/messages`,
        { method: "POST", body: { content: text.trim() } }
      );
      setMessages((m) => [...m, msg]);
      setText("");
    } catch (e) {
      setError((e as ApiError).message ?? "Failed to send.");
    }
  }

  useEffect(() => {
    if (!appointmentId) return;
    const token = typeof window !== "undefined" ? getToken() : null;
    if (!token) return;
    const base =
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
      "http://localhost:4000/api";
    const url = `${base.replace(/\/api\/?$/, "")}/api/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    es.addEventListener("chat_message", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as Partial<Msg>;
        if (data.appointmentId === appointmentId) {
          setMessages((m) => [
            ...m,
            {
              id: Math.random().toString(36).slice(2),
              appointmentId,
              senderRole: data.senderRole ?? "unknown",
              content: data.content ?? "",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch {
        /* ignore */
      }
    });
    return () => es.close();
  }, [appointmentId, getToken]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Talk to your care team</h2>
      <p className="text-sm text-slate-600">
        Select a confirmed consultation to chat. Your receptionist, nurse, and dermatologist can
        all see and respond to your messages.
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Select confirmed consultation
        </label>
        <select
          value={appointmentId}
          onChange={(e) => setAppointmentId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
        >
          <option value="">Choose a consultation</option>
          {confirmedAppointments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.date} {a.time} · Dr. {a.doctorName} ({a.mode})
            </option>
          ))}
        </select>
        {confirmedAppointments.length === 0 && (
          <p className="mt-1 text-sm text-amber-600">
            No confirmed consultations yet. Book an appointment and wait for the receptionist to
            confirm.
          </p>
        )}
      </div>
      {selectedAppointment && (
        <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">
          <strong>Your care team for this visit:</strong> Receptionist · Nurse · Dr.{" "}
          {selectedAppointment.doctorName}
        </div>
      )}
      {appointmentId && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 max-h-72 overflow-y-auto rounded-lg bg-slate-50 p-3">
            {messages.map((m) => (
              <div key={m.id} className="mb-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                <span className="text-xs font-semibold text-teal-600">{m.senderRole}:</span>
                <p className="text-sm text-slate-800">{m.content}</p>
                <span className="text-xs text-slate-500">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-sm text-slate-500">No messages yet. Start the conversation.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message"
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              onClick={send}
              className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}
    </div>
  );
}
