-- PostgreSQL schema for the Online Dermatology Medical System (core tables)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'nurse', 'receptionist', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  dermatology_history TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  doctor_user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  appointment_date TIMESTAMPTZ NOT NULL,
  mode TEXT NOT NULL DEFAULT 'In-person',
  status TEXT NOT NULL DEFAULT 'Pending',
  nurse_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  meet_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Additional tables (not yet fully wired to the API) that match your proposal:

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  doctor_user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  notes TEXT,
  diagnosis TEXT,
  prescriptions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  specialization TEXT DEFAULT 'Dermatology',
  bio TEXT,
  consultation_fee NUMERIC(10, 2) DEFAULT 0,
  working_days TEXT[], -- e.g., ['Monday', 'Wednesday']
  time_slots JSONB,    -- e.g., {"Monday": ["09:00", "10:00"]}
  consultation_modes TEXT[] DEFAULT ARRAY['In-person']
);

CREATE TABLE IF NOT EXISTS patient_profiles (
  patient_id UUID PRIMARY KEY REFERENCES patients (id) ON DELETE CASCADE,
  address TEXT,
  emergency_contact TEXT,
  allergies TEXT,
  dermatology_history TEXT
);

-- Pre-consultation assessments / Triage
CREATE TABLE IF NOT EXISTS preassessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL,
  triage_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Visit reason and metadata for appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visit_reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checkin_at TIMESTAMPTZ;

-- Medical images (skin photos for dermatology)
CREATE TABLE IF NOT EXISTS medical_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments (id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case images (if different from medical_images, but let's unify or add it)
CREATE TABLE IF NOT EXISTS case_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL, -- Can be appointment_id or a general case_id
  file_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prescriptions (structured)
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES medical_records (id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
