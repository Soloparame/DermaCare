-- Phase 1 tables for MVP+ features. All CREATE guarded with IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS preassessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL,
  triage_score INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  notes TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
  bp TEXT,
  hr INT,
  temp NUMERIC(4,1),
  weight NUMERIC(6,2),
  notes TEXT,
  triage_score INT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prep_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
  steps_json JSONB NOT NULL,
  ready_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS rx_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments (id) ON DELETE SET NULL,
  patient_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  items_json JSONB NOT NULL,
  instructions TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
