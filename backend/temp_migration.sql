-- Migration to add chat_messages table for persistent chat history
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  content TEXT,
  attachment_url TEXT,
  attachment_type TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for performance when loading chat for an appointment
CREATE INDEX IF NOT EXISTS idx_chat_messages_appointment_id ON chat_messages (appointment_id);
