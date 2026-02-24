"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mem = void 0;
const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
exports.mem = {
    messages: new Map(),
    caseImages: new Map(),
    preassessments: new Map(),
    vitals: new Map(),
    prep: new Map(),
    prescriptions: new Map(),
    queueByDoctor: new Map(),
    addMessage(appointmentId, senderRole, content) {
        const msg = { id: genId(), appointmentId, senderRole, content, createdAt: new Date().toISOString() };
        const arr = this.messages.get(appointmentId) ?? [];
        arr.push(msg);
        this.messages.set(appointmentId, arr);
        return msg;
    },
    addCaseImage(caseId, fileUrl, notes) {
        const rec = { id: genId(), caseId, fileUrl, capturedAt: new Date().toISOString(), notes: notes ?? null };
        const arr = this.caseImages.get(caseId) ?? [];
        arr.push(rec);
        this.caseImages.set(caseId, arr);
        return rec;
    },
    addPreassessment(patientId, answers, triageScore) {
        const rec = { id: genId(), patientId, answers, triageScore, createdAt: new Date().toISOString() };
        const arr = this.preassessments.get(patientId) ?? [];
        arr.push(rec);
        this.preassessments.set(patientId, arr);
        return rec;
    },
    setVitals(v) {
        this.vitals.set(v.appointmentId, v);
    },
    setPrep(p) {
        this.prep.set(p.appointmentId, p);
    },
    addPrescription(appointmentId, patientId, doctorId, items, instructions, startDate, endDate) {
        const rec = { id: genId(), appointmentId, patientId, doctorId, items, instructions: instructions ?? null, startDate: startDate ?? null, endDate: endDate ?? null, createdAt: new Date().toISOString() };
        const arr = this.prescriptions.get(patientId) ?? [];
        arr.push(rec);
        this.prescriptions.set(patientId, arr);
        return rec;
    },
    checkIn(doctorId, appointmentId) {
        const arr = this.queueByDoctor.get(doctorId) ?? [];
        const item = { id: genId(), appointmentId, status: "CheckedIn", position: arr.length + 1, checkedInAt: new Date().toISOString() };
        arr.push(item);
        this.queueByDoctor.set(doctorId, arr);
        return item;
    },
};
