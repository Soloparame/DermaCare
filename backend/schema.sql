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

