-- Doctor profiles (specialization, etc.)
CREATE TABLE IF NOT EXISTS doctor_profiles (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  specialization TEXT DEFAULT 'Dermatology',
  bio TEXT,
  consultation_fee NUMERIC(10, 2) DEFAULT 0
);

-- Patient profiles (address, emergency, allergies)
CREATE TABLE IF NOT EXISTS patient_profiles (
  patient_id UUID PRIMARY KEY REFERENCES patients (id) ON DELETE CASCADE,
  address TEXT,
  emergency_contact TEXT,
  allergies TEXT
);

-- Visit reason for appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS visit_reason TEXT;

-- Medical images
CREATE TABLE IF NOT EXISTS medical_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments (id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prescriptions
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
