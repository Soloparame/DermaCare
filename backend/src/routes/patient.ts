import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { mem } from "../memory";
import { broadcast } from "../events";

const router: Router = createRouter();

// GET /api/patient/appointments
router.get(
  "/appointments",
  requireAuth(["patient", "admin"]),
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          `
          SELECT a.id, a.appointment_date::date AS date, to_char(a.appointment_date, 'HH24:MI') AS time,
                 a.mode, a.status, d.full_name AS doctor_name,
                 COALESCE(pay.status, 'Pending') AS payment_status
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          JOIN users u ON p.user_id = u.id
          JOIN users d ON a.doctor_user_id = d.id
          LEFT JOIN payments pay ON pay.appointment_id = a.id
          WHERE u.id = $1
          ORDER BY a.appointment_date ASC
          LIMIT 50;
        `,
          [userId]
        );

        const rows = result.rows.map((row) => ({
          id: row.id as string,
          date: row.date as string,
          time: row.time as string,
          mode: (row.mode as string) ?? "In-person",
          status: (row.status as string) ?? "Pending",
          doctorName: (row.doctor_name as string) ?? "Dermatologist",
          paymentStatus: (row.payment_status as string) ?? "Pending",
        }));
        return res.json(rows);
      } finally {
        client.release();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error in GET /patient/appointments:", err);
      return res.status(500).json({
        message:
          "Failed to load appointments. Please ensure the database is set up.",
      });
    }
  }
);

// GET /api/patient/stats
router.get("/stats", requireAuth(["patient", "admin"]), async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated." });
  try {
    const client = await pool.connect();
    try {
      const patientRow = await client.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
      if (!patientRow.rows[0]) {
        return res.json({
          totalAppointments: 0,
          completed: 0,
          pending: 0,
          medicalRecordsCount: 0,
          lastTriageScore: null,
          lastTriageAt: null,
        });
      }
      const patientId = patientRow.rows[0].id as string;

      const [apptRes, mrRes, preRes] = await Promise.all([
        client.query(
          "SELECT status FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE p.user_id = $1",
          [userId]
        ),
        client.query("SELECT COUNT(*)::int AS c FROM medical_records WHERE patient_id = $1", [patientId]),
        client.query(
          "SELECT triage_score, created_at FROM preassessments WHERE patient_user_id = $1 ORDER BY created_at DESC LIMIT 1",
          [userId]
        ),
      ]);
      const appointments = apptRes.rows as { status: string }[];
      const completed = appointments.filter((a) => a.status === "Completed").length;
      const pending = appointments.filter((a) => ["Pending", "Confirmed"].includes(a.status)).length;
      const latest = preRes.rows[0] as { triage_score: number; created_at: string } | undefined;
      return res.json({
        totalAppointments: appointments.length,
        completed,
        pending,
        medicalRecordsCount: (mrRes.rows[0]?.c as number) ?? 0,
        lastTriageScore: latest?.triage_score ?? null,
        lastTriageAt: latest?.created_at ?? null,
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error in GET /patient/stats:", err);
    try {
      const list = mem.preassessments.get(req.user!.userId) ?? [];
      const latest = list[list.length - 1];
      return res.status(500).json({
        totalAppointments: 0,
        completed: 0,
        pending: 0,
        medicalRecordsCount: 0,
        lastTriageScore: latest?.triageScore ?? null,
        lastTriageAt: latest?.createdAt ?? null,
        message: "Failed to load stats.",
      });
    } catch {
      return res.status(500).json({ message: "Failed to load stats." });
    }
  }
});

// GET /api/patient/medical-records
router.get("/medical-records", requireAuth(["patient", "admin"]), async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated." });
  try {
    const result = await pool.query(
      `SELECT mr.id, mr.notes, mr.diagnosis, mr.prescriptions, mr.created_at, u.full_name AS doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN users u ON mr.doctor_user_id = u.id
       WHERE p.user_id = $1 ORDER BY mr.created_at DESC`,
      [userId]
    );
    return res.json(result.rows.map((r) => ({
      id: r.id, notes: r.notes, diagnosis: r.diagnosis, prescriptions: r.prescriptions,
      createdAt: r.created_at, doctorName: r.doctor_name,
    })));
  } catch (err) {
    console.error("Error in GET /patient/medical-records:", err);
    return res.status(500).json({ message: "Failed to load medical records." });
  }
});

// DELETE /api/patient/appointments/:id - cancel (only if Pending)
router.delete("/appointments/:id", requireAuth(["patient", "admin"]), async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated." });
  const { id } = req.params;
  try {
    const client = await pool.connect();
    try {
      const check = await client.query(
        `SELECT a.status FROM appointments a
         JOIN patients p ON a.patient_id = p.id WHERE p.user_id = $1 AND a.id = $2`,
        [userId, id]
      );
      if (!check.rows[0]) return res.status(404).json({ message: "Appointment not found." });
      if ((check.rows[0].status as string) !== "Pending") {
        return res.status(400).json({ message: "Only Pending appointments can be cancelled." });
      }
      await client.query("UPDATE appointments SET status = 'Cancelled' WHERE id = $1", [id]);
      return res.json({ id, status: "Cancelled" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error in DELETE /patient/appointments:", err);
    return res.status(500).json({ message: "Failed to cancel appointment." });
  }
});

// POST /api/patient/appointments - create new appointment
router.post(
  "/appointments",
  requireAuth(["patient", "admin"]),
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated." });

    const { doctorId, date, time, mode } = req.body as {
      doctorId?: string;
      date?: string;
      time?: string;
      mode?: string;
    };

    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: "doctorId, date, and time are required." });
    }

    const visitMode = mode === "Virtual" ? "Virtual" : "In-person";

    try {
      const client = await pool.connect();
      try {
        const patientRow = await client.query(
          "SELECT id FROM patients WHERE user_id = $1",
          [userId]
        );
        if (!patientRow.rows[0]) {
          return res.status(400).json({ message: "Patient profile not found." });
        }
        const patientId = patientRow.rows[0].id as string;

        const doctorCheck = await client.query(
          "SELECT id FROM users WHERE id = $1 AND role = 'doctor'",
          [doctorId]
        );
        if (!doctorCheck.rows[0]) {
          return res.status(400).json({ message: "Invalid doctor." });
        }

        const appointmentDate = new Date(`${date}T${time}`);
        if (isNaN(appointmentDate.getTime())) {
          return res.status(400).json({ message: "Invalid date or time." });
        }

        const overlap = await client.query(
          `SELECT id FROM appointments
           WHERE patient_id = $1 AND doctor_user_id = $2
           AND appointment_date::date = $3
           AND status NOT IN ('Cancelled')
           LIMIT 1`,
          [patientId, doctorId, date]
        );
        if (overlap.rowCount && overlap.rowCount > 0) {
          return res.status(409).json({ message: "You already have an appointment with this doctor on this date." });
        }

        const result = await client.query(
          `INSERT INTO appointments (patient_id, doctor_user_id, appointment_date, mode, status)
           VALUES ($1, $2, $3, $4, 'Pending') RETURNING id`,
          [patientId, doctorId, appointmentDate, visitMode]
        );
        const apptId = result.rows[0].id as string;

        await client.query(
          `INSERT INTO payments (appointment_id, amount, status) VALUES ($1, 0, 'Pending')`,
          [apptId]
        );

        return res.status(201).json({
          id: apptId,
          date,
          mode: visitMode,
          status: "Pending",
          paymentStatus: "Pending",
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error in POST /patient/appointments:", err);
      return res.status(500).json({ message: "Failed to create appointment." });
    }
  }
);

router.post("/preassessment", requireAuth(["patient", "admin"]), async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated." });
  const answers = req.body ?? {};
  const triageScore = Array.isArray(answers?.symptoms) ? Math.min(10, answers.symptoms.length + (answers?.severity ?? 0)) : 1;
  try {
    try {
      const result = await pool.query(
        "INSERT INTO preassessments (patient_user_id, answers_json, triage_score) VALUES ($1, $2, $3) RETURNING id, triage_score, created_at",
        [userId, answers, triageScore]
      );
      return res.status(201).json({ id: result.rows[0].id, triageScore: result.rows[0].triage_score, createdAt: result.rows[0].created_at });
    } catch {
      const rec = mem.addPreassessment(userId, answers, triageScore);
      return res.status(201).json({ id: rec.id, triageScore: rec.triageScore, createdAt: rec.createdAt });
    }
  } catch {
    return res.status(500).json({ message: "Failed to submit pre‑assessment." });
  }
});

router.get("/appointments/:id/status", requireAuth(["patient", "admin"]), async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated." });
  const { id } = req.params;
  try {
    try {
      const result = await pool.query(
        "SELECT status, appointment_date, mode, checkin_at FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN users u ON p.user_id = u.id WHERE a.id = $1 AND u.id = $2",
        [id, userId]
      );
      if (result.rowCount === 0) return res.status(404).json({ message: "Appointment not found." });
      const row = result.rows[0];
      return res.json({ status: row.status ?? "Pending", mode: row.mode ?? "In-person", appointmentDate: row.appointment_date, checkinAt: row.checkin_at ?? null });
    } catch {
      return res.json({ status: "Pending", mode: "In-person", appointmentDate: null, checkinAt: null });
    }
  } catch {
    return res.status(500).json({ message: "Failed to get status." });
  }
});

router.post("/cases/:caseId/images", requireAuth(["patient", "admin"]), async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated." });
  const caseId = String(req.params.caseId);
  const { fileUrl, notes } = req.body as { fileUrl?: string; notes?: string | null };
  if (!fileUrl) return res.status(400).json({ message: "fileUrl required." });
  try {
    try {
      const result = await pool.query(
        "INSERT INTO case_images (case_id, file_url, notes) VALUES ($1, $2, $3) RETURNING id, file_url, created_at",
        [caseId, fileUrl, notes ?? null]
      );
      return res.status(201).json({ id: result.rows[0].id, fileUrl: result.rows[0].file_url, createdAt: result.rows[0].created_at });
    } catch {
      const rec = mem.addCaseImage(caseId, fileUrl, notes ?? null);
      return res.status(201).json({ id: rec.id, fileUrl: rec.fileUrl, createdAt: rec.capturedAt });
    }
  } catch {
    return res.status(500).json({ message: "Failed to upload image." });
  }
});

router.get("/appointments/:id/avs", requireAuth(["patient", "admin"]), async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated." });
  const { id } = req.params;
  try {
    try {
      const result = await pool.query(
        "SELECT a.mode, d.full_name AS doctor_name FROM appointments a JOIN users d ON a.doctor_user_id = d.id WHERE a.id = $1",
        [id]
      );
      const r = result.rows[0] ?? { mode: "In-person", doctor_name: "Doctor" };
      const content = `Thank you for your visit. Mode: ${r.mode}. Doctor: ${r.doctor_name}. Cleanse gently, apply prescribed medication, avoid irritants, and schedule follow‑up as advised.`;
      return res.json({ appointmentId: id, content });
    } catch {
      const content = "Thank you for your visit. Follow care instructions and take prescribed medication. Schedule a follow‑up as advised.";
      return res.json({ appointmentId: id, content });
    }
  } catch {
    return res.status(500).json({ message: "Failed to load care instructions." });
  }
});

router.get(
  "/chat/:appointmentId/messages",
  requireAuth(["patient", "admin", "doctor", "nurse", "receptionist"]),
  async (req: Request, res: Response) => {
    const appointmentId = String(req.params.appointmentId);
    const role = req.user?.role ?? "patient";
    // Backwards-compatible: support either ?channel= or legacy ?scope=
    const rawChannel = (req.query.channel as string | undefined) ?? (req.query.scope as string | undefined);
    const channel =
      rawChannel === "reception" || rawChannel === "care_team" || rawChannel === "staff"
        ? (rawChannel as "reception" | "care_team" | "staff")
        : undefined;

    const isReceptionist = role === "receptionist";

    try {
      let query =
        'SELECT id, appointment_id as "appointmentId", sender_role as "senderRole", content, created_at as "createdAt", attachment_url as "attachmentUrl", attachment_type as "attachmentType", attachment_name as "attachmentName", channel FROM chat_messages WHERE appointment_id = $1';
      const params: unknown[] = [appointmentId];

      if (channel) {
        query += " AND channel = $2";
        params.push(channel);
      }

      // Hard safety for receptionists: never show care_team/staff messages that include doctor/nurse/admin
      if (isReceptionist && !channel) {
        // If no explicit channel requested, fall back to patient <-> receptionist only
        query += " AND channel = 'reception'";
      }

      query += " ORDER BY created_at ASC";
      const result = await pool.query(query, params);
      return res.json(
        result.rows.map((r) => ({
          ...r,
          channel: r.channel ?? "care_team",
        }))
      );
    } catch (dbErr) {
      console.error("❌ Database error loading chat messages:", dbErr);
      // Fallback to in-memory only if DB fails – this is for dev safety, but ideally we want DB.
      const arr = mem.messages.get(appointmentId) ?? [];
      let visible = arr;

      if (channel) {
        visible = arr.filter((m) => (m.channel ?? "care_team") === channel);
      } else if (isReceptionist) {
        visible = arr.filter((m) => (m.channel ?? "care_team") === "reception");
      }

      return res.json(visible);
    }
  }
);

router.post(
  "/chat/:appointmentId/messages",
  requireAuth(["patient", "admin", "doctor", "nurse", "receptionist"]),
  async (req: Request, res: Response) => {
    const role = req.user?.role ?? "patient";
    const appointmentId = String(req.params.appointmentId);
    const { content, attachmentUrl, attachmentType, attachmentName, channel } = req.body as {
      content?: string;
      attachmentUrl?: string;
      attachmentType?: "image" | "video" | "document";
      attachmentName?: string;
      channel?: string;
    };
    if ((!content || content.trim() === "") && !attachmentUrl) {
      return res.status(400).json({ message: "content or attachment required." });
    }

    // Determine logical channel based on sender role and requested channel.
    let resolvedChannel: "reception" | "care_team" | "staff" = "care_team";

    if (role === "patient") {
      if (channel === "reception") {
        resolvedChannel = "reception";
      } else {
        // Default or explicit care_team – only allowed for confirmed/completed appointments
        try {
          const r = await pool.query("SELECT status FROM appointments WHERE id = $1", [appointmentId]);
          const status = (r.rows[0]?.status as string | undefined) ?? "Pending";
          if (!["Confirmed", "Completed"].includes(status)) {
            return res.status(403).json({ message: "Chat with doctor/nurse is only available after confirmation." });
          }
        } catch {
          // In-memory / fallback mode – allow but still tag as care_team
        }
        resolvedChannel = "care_team";
      }
    } else if (role === "receptionist") {
      // Receptionist can either talk with patient (reception) or staff-only
      resolvedChannel = channel === "reception" ? "reception" : "staff";
    } else if (role === "doctor" || role === "nurse") {
      // Clinical staff can have care_team or staff-only channels
      resolvedChannel = channel === "staff" ? "staff" : "care_team";
    } else if (role === "admin") {
      resolvedChannel = (channel as typeof resolvedChannel) ?? "care_team";
    }

    try {
      let msg;
      try {
        const result = await pool.query(
          'INSERT INTO chat_messages (appointment_id, sender_role, content, attachment_url, attachment_type, attachment_name, channel) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, appointment_id as "appointmentId", sender_role as "senderRole", content, created_at as "createdAt", attachment_url as "attachmentUrl", attachment_type as "attachmentType", attachment_name as "attachmentName", channel',
          [appointmentId, role, content ?? null, attachmentUrl ?? null, attachmentType ?? null, attachmentName ?? null, resolvedChannel]
        );
        msg = result.rows[0];
      } catch (dbErr) {
        console.error("❌ Database error saving chat message:", dbErr);
        msg = mem.addMessage(
          appointmentId,
          role,
          content ?? "",
          { url: attachmentUrl, type: attachmentType, name: attachmentName },
          resolvedChannel
        );
      }

      try {
        broadcast("chat_message", {
          appointmentId,
          senderRole: role,
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt,
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType,
          attachmentName: msg.attachmentName,
          channel: (msg as { channel?: string }).channel ?? resolvedChannel,
        });
      } catch (sseErr) {
        console.error("❌ SSE broadcast error:", sseErr);
      }
      return res.status(201).json(msg);
    } catch (err) {
      console.error("❌ Unhandled error in chat POST:", err);
      return res.status(500).json({ message: "Failed to send message." });
    }
  }
);

export default router;
