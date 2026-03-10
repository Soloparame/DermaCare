"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiError } from "@/lib/api";
import { Search, Info, Paperclip, Send, MoreVertical, Phone, Video, MessageSquare } from "lucide-react";

interface Msg {
  id: string;
  appointmentId: string;
  senderRole: string;
  content: string;
  createdAt: string;
  attachmentUrl?: string | null;
  attachmentType?: "image" | "video" | "document" | null;
  attachmentName?: string | null;
  channel?: "reception" | "care_team" | "staff" | null;
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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<"reception" | "care_team">("care_team");

  const MAX_FILE_SIZE_MB = 8;

  const confirmedAppointments = appointments.filter((a) =>
    ["Confirmed", "Completed"].includes(a.status)
  );
  const selectedAppointment = confirmedAppointments.find((a) => a.id === appointmentId);

  function openCall() {
    if (!selectedAppointment) return;
    const room = selectedAppointment.id;
    const url = `https://meet.jit.si/dermacare-${room}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

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

  const load = useCallback(async (id: string, scope: "reception" | "care_team") => {
    if (!id) return;
    try {
      const data = await fetch<Msg[]>(`/patient/chat/${id}/messages?channel=${scope}`);
      setMessages(data);
    } catch (e) {
      setError((e as ApiError).message ?? "Failed to load messages.");
    }
  }, [fetch]);

  useEffect(() => {
    if (appointmentId) void load(appointmentId, channel);
  }, [appointmentId, channel, load]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = "";
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  }

  async function send() {
    if (!appointmentId || (!text.trim() && !file)) return;
    try {
      let attachmentPayload: { attachmentUrl?: string; attachmentType?: "image" | "video" | "document"; attachmentName?: string } = {};
      if (file) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });
        const mime = file.type;
        const type: "image" | "video" | "document" = mime.startsWith("image")
          ? "image"
          : mime.startsWith("video")
            ? "video"
            : "document";
        attachmentPayload = { attachmentUrl: dataUrl, attachmentType: type, attachmentName: file.name };
      }
      const msg = await fetch<
        Msg,
        {
          content?: string;
          attachmentUrl?: string;
          attachmentType?: "image" | "video" | "document";
          attachmentName?: string;
          channel?: "reception" | "care_team";
        }
      >(
        `/patient/chat/${appointmentId}/messages`,
        {
          method: "POST",
          body: { content: text.trim() || undefined, ...attachmentPayload, channel },
        }
      );
      setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
      setText("");
      setFile(null);
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
          const sender = data.senderRole;
          const inReceptionChannel =
            channel === "reception" && (sender === "patient" || sender === "receptionist");
          const inCareTeamChannel =
            channel === "care_team" && (sender === "patient" || sender === "doctor" || sender === "nurse");
          if (!inReceptionChannel && !inCareTeamChannel) return;

          setMessages((m) => {
            const id = data.id ?? Math.random().toString(36).slice(2);
            if (m.some((x) => x.id === id)) return m;
            return [
              ...m,
              {
                id,
                appointmentId,
                senderRole: data.senderRole ?? "unknown",
                content: data.content ?? "",
                createdAt: data.createdAt ?? new Date().toISOString(),
                attachmentUrl: data.attachmentUrl ?? null,
                attachmentType: (data.attachmentType as Msg["attachmentType"]) ?? null,
                attachmentName: data.attachmentName ?? null,
              },
            ];
          });
        }
      } catch {
        // ignore
      }
    });
    return () => es.close();
  }, [appointmentId, channel, getToken]);

  return (
    <div className="flex h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
      {/* Sidebar - Chat List */}
      <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-[#F8FAFC] flex flex-col relative z-20">
        <div className="p-5 border-b border-slate-200 bg-white shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Messages</h2>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full rounded-full bg-slate-100 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && <div className="p-4 m-4 rounded-xl bg-red-50 text-xs text-red-600 font-semibold">{error}</div>}

          {confirmedAppointments.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setAppointmentId(a.id);
              }}
              className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-3 relative ${appointmentId === a.id ? 'bg-white shadow-sm z-10' : ''}`}
            >
              {appointmentId === a.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-r-md"></div>
              )}
              <div className="relative h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {a.doctorName.charAt(0)}
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"></div>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-slate-900 truncate">Dr. {a.doctorName}</h3>
                  <span className="text-[10px] font-medium text-slate-400">{a.date}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{a.mode} Consultation</p>
              </div>
            </button>
          ))}
          {confirmedAppointments.length === 0 && !error && (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center mt-10">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 opacity-40 text-slate-600" />
              </div>
              <p className="text-sm font-medium">No active conversations yet.</p>
              <p className="text-xs mt-2 text-slate-400">Book an appointment to start chatting.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedAppointment ? (
        <div className="flex-1 flex flex-col bg-[#F0F2F5] relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200 z-10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-sm text-lg">
                {selectedAppointment.doctorName.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-slate-800 tracking-tight">Dr. {selectedAppointment.doctorName}</h2>
                <p className="text-xs text-teal-600 font-medium tracking-wide">
                  {channel === "reception"
                    ? "Chat with Receptionist about your appointment"
                    : "Care Team: Doctor and Nurse handling your case"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <button
                type="button"
                onClick={openCall}
                className="p-2.5 hover:bg-teal-50 hover:text-teal-600 rounded-full transition"
                title="Start call"
              >
                <Phone className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={openCall}
                className="p-2.5 hover:bg-teal-50 hover:text-teal-600 rounded-full transition"
                title="Video call"
              >
                <Video className="h-5 w-5" />
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button className="p-2.5 hover:bg-slate-100 rounded-full transition"><MoreVertical className="h-5 w-5" /></button>
            </div>
          </div>

          {/* Channel selector */}
          <div className="px-6 pt-3 pb-1 bg-white/80 border-b border-slate-200 z-10">
            <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChannel("reception")}
                className={`px-3 py-1.5 rounded-full transition ${
                  channel === "reception"
                    ? "bg-white text-teal-700 shadow-sm border border-teal-100"
                    : "text-slate-500"
                }`}
              >
                Receptionist
              </button>
              <button
                type="button"
                onClick={() => setChannel("care_team")}
                className={`px-3 py-1.5 rounded-full transition ${
                  channel === "care_team"
                    ? "bg-white text-teal-700 shadow-sm border border-teal-100"
                    : "text-slate-500"
                }`}
              >
                Doctor & Nurse
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 z-10 space-y-4 flex flex-col">
            {messages.map((m) => {
              const isMe = m.senderRole === "patient";
              return (
                <div
                  key={m.id}
                  className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm relative group ${isMe
                        ? "bg-teal-600 text-white rounded-tr-sm"
                        : "bg-white text-slate-800 border border-slate-100 rounded-tl-sm"
                      }`}
                  >
                    {!isMe && (
                      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-600">
                        {m.senderRole}
                      </div>
                    )}

                    {m.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>}

                    {m.attachmentUrl && m.attachmentType === "image" && (
                      <img
                        src={m.attachmentUrl}
                        alt={m.attachmentName ?? "image"}
                        className="mt-2 max-h-60 rounded-xl border border-black/5"
                      />
                    )}
                    {m.attachmentUrl && m.attachmentType === "video" && (
                      <video
                        src={m.attachmentUrl}
                        controls
                        className="mt-2 max-h-60 rounded-xl border border-black/5"
                      />
                    )}
                    {m.attachmentUrl && m.attachmentType === "document" && (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-2 inline-flex items-center gap-2 text-sm font-semibold p-3 rounded-xl border ${isMe ? 'bg-teal-700/50 border-teal-500/30 text-white' : 'bg-slate-50 border-slate-200 text-teal-700'} hover:opacity-80 transition`}
                      >
                        <Paperclip className="h-4 w-4" />
                        {m.attachmentName ?? "Document"}
                      </a>
                    )}

                    <div className={`mt-2 flex items-center justify-end text-[10px] ${isMe ? 'text-teal-100' : 'text-slate-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold text-slate-500 shadow-sm border border-slate-200/50">
                  This is the start of your medical timeline
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-10">
            <div className="flex items-end gap-3 max-w-5xl mx-auto">
              <button
                className="p-3 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors flex-shrink-0 mb-1"
                onClick={() => document.getElementById("chat-file")?.click()}
                title="Attach file"
              >
                <Paperclip className="h-6 w-6" />
              </button>
              <input id="chat-file" type="file" className="hidden" onChange={handleFileChange} />

              <div className="flex-1 bg-slate-100/80 rounded-3xl pb-1 px-1 flex flex-col border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-400 transition-all shadow-inner">
                {file && (
                  <div className="px-4 pt-3 pb-1 flex items-center justify-between border-b border-slate-200 mb-1">
                    <span className="text-xs font-semibold text-teal-700 truncate">{file.name}</span>
                    <button className="text-xs text-rose-500 hover:text-rose-700 font-bold bg-rose-50 h-5 w-5 rounded-full flex items-center justify-center" onClick={() => setFile(null)}>✕</button>
                  </div>
                )}
                <input
                  className="w-full bg-transparent px-5 py-3.5 text-slate-700 placeholder:text-slate-400 focus:outline-none text-sm font-medium"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
              </div>

              <button
                onClick={send}
                disabled={!text.trim() && !file}
                className="p-3.5 mb-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex-shrink-0"
              >
                <Send className="h-5 w-5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] relative z-20">
          <div className="h-28 w-28 bg-white rounded-full border border-slate-100 flex items-center justify-center mb-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)]">
            <MessageSquare className="h-10 w-10 text-teal-200" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">DermaCare Messages</h2>
          <p className="text-sm font-medium text-slate-500 text-center max-w-md leading-relaxed">
            Select a conversation from the sidebar to start chatting securely with your care team.
          </p>
        </div>
      )}
    </div>
  );
}
