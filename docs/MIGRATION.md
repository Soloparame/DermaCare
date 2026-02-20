# Database Migration

Run this migration to add `doctor_profiles` and `patient_profiles` tables:

```bash
cd backend
psql -d dermacare -f migrations/001_add_profiles.sql
```

Or if using connection string from .env:

```bash
cd backend
# Replace with your DATABASE_URL connection string
psql "postgresql://postgres:password@localhost:5432/dermacare" -f migrations/001_add_profiles.sql
```

This adds:
- `doctor_profiles` - specialization, bio, consultation_fee for doctors
- `patient_profiles` - address, emergency_contact, allergies for patients
- `appointments.visit_reason` - reason for visit
- `medical_images` - skin photos for dermatology
- `prescriptions` - structured prescriptions linked to medical records
- `notifications` - user notifications

Run this migration if you have an existing database. Fresh installs use schema.sql which includes these.
