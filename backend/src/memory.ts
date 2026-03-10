type Message = {
  id: string;
  appointmentId: string;
  senderRole: string;
  content: string;
  createdAt: string;
  // Logical channel for this message, e.g. 'reception', 'care_team', 'staff'
  channel?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: "image" | "video" | "document" | null;
  attachmentName?: string | null;
};
type CaseImage = { id: string; caseId: string; fileUrl: string; capturedAt: string; notes?: string | null };
type Preassessment = { id: string; patientId: string; answers: unknown; triageScore: number; createdAt: string };
type Vitals = { appointmentId: string; bp?: string | null; hr?: number | null; temp?: number | null; weight?: number | null; notes?: string | null; triageScore?: number | null; recordedAt: string };
type PrepStatus = { appointmentId: string; steps: unknown; readyAt?: string | null };
type Prescription = { id: string; appointmentId: string; patientId: string; doctorId: string; items: unknown; instructions?: string | null; startDate?: string | null; endDate?: string | null; createdAt: string };
type QueueItem = { id: string; appointmentId: string; status: string; position: number; checkedInAt: string };

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const mem = {
  messages: new Map<string, Message[]>(),
  caseImages: new Map<string, CaseImage[]>(),
  preassessments: new Map<string, Preassessment[]>(),
  vitals: new Map<string, Vitals>(),
  prep: new Map<string, PrepStatus>(),
  prescriptions: new Map<string, Prescription[]>(),
  queueByDoctor: new Map<string, QueueItem[]>(),
  addMessage(
    appointmentId: string,
    senderRole: string,
    content: string,
    attachment?: { url?: string; type?: "image" | "video" | "document"; name?: string },
    channel?: string
  ): Message {
    const msg: Message = {
      id: genId(),
      appointmentId,
      senderRole,
      content,
      createdAt: new Date().toISOString(),
      channel: channel ?? "care_team",
      attachmentUrl: attachment?.url ?? null,
      attachmentType: attachment?.type ?? null,
      attachmentName: attachment?.name ?? null,
    };
    const arr = this.messages.get(appointmentId) ?? [];
    arr.push(msg);
    this.messages.set(appointmentId, arr);
    return msg;
  },
  addCaseImage(caseId: string, fileUrl: string, notes?: string | null): CaseImage {
    const rec: CaseImage = { id: genId(), caseId, fileUrl, capturedAt: new Date().toISOString(), notes: notes ?? null };
    const arr = this.caseImages.get(caseId) ?? [];
    arr.push(rec);
    this.caseImages.set(caseId, arr);
    return rec;
  },
  addPreassessment(patientId: string, answers: unknown, triageScore: number): Preassessment {
    const rec: Preassessment = { id: genId(), patientId, answers, triageScore, createdAt: new Date().toISOString() };
    const arr = this.preassessments.get(patientId) ?? [];
    arr.push(rec);
    this.preassessments.set(patientId, arr);
    return rec;
  },
  setVitals(v: Vitals) {
    this.vitals.set(v.appointmentId, v);
  },
  setPrep(p: PrepStatus) {
    this.prep.set(p.appointmentId, p);
  },
  addPrescription(appointmentId: string, patientId: string, doctorId: string, items: unknown, instructions?: string | null, startDate?: string | null, endDate?: string | null): Prescription {
    const rec: Prescription = { id: genId(), appointmentId, patientId, doctorId, items, instructions: instructions ?? null, startDate: startDate ?? null, endDate: endDate ?? null, createdAt: new Date().toISOString() };
    const arr = this.prescriptions.get(patientId) ?? [];
    arr.push(rec);
    this.prescriptions.set(patientId, arr);
    return rec;
  },
  checkIn(doctorId: string, appointmentId: string): QueueItem {
    const arr = this.queueByDoctor.get(doctorId) ?? [];
    const item: QueueItem = { id: genId(), appointmentId, status: "CheckedIn", position: arr.length + 1, checkedInAt: new Date().toISOString() };
    arr.push(item);
    this.queueByDoctor.set(doctorId, arr);
    return item;
  },
};
