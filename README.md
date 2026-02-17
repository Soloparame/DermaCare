## Online Dermatology Medical System (DermaCare Online)

This project implements the web-based dermatology medical system described in your PDF:

- **Frontend**: `frontend/` – Next.js + TypeScript + Tailwind (App Router)
- **Backend**: `backend/` – Node.js + Express + PostgreSQL + JWT auth

It supports the core roles and flows from the document: **Patient, Doctor, Nurse, Receptionist, Administrator**, with dashboards and endpoints that can be extended into a full system.

---

### 1. What has been implemented for you

- **Attractive, responsive UI**
  - Landing page highlighting the dermatology workflow and tech stack.
  - Patient, Doctor, Nurse, Receptionist, and Administrator dashboards under:
    - `patient/dashboard`
    - `doctor/dashboard`
    - `nurse/dashboard`
    - `receptionist/dashboard`
    - `admin/dashboard`
  - Modern Tailwind‑based layouts, gradients, cards, and clear role separation.

- **Authentication (JWT) and core APIs**
  - `POST /api/auth/register` – patient registration (stores user + patient profile).
  - `POST /api/auth/login` – email + password + role login, returns JWT and role.
  - `GET /api/patient/appointments` – upcoming appointments for logged‑in patient.
  - `GET /api/doctor/appointments` – upcoming appointments for a doctor.
  - `GET /api/health` – simple backend health check.

- **Database schema (PostgreSQL)**
  - `schema.sql` defines:
    - `users` (with `role`, `full_name`, `email`, `password_hash`, etc.)
    - `patients`
    - `appointments`
    - `medical_records`
    - `payments`

> The UI is wired to call these APIs via `NEXT_PUBLIC_API_URL` and JWT stored in `localStorage`. Once you configure the database and environment variables, the flows will become fully live.

---

### 2. How to run the project locally

#### 2.1. Requirements

- **Node.js** 20+ (or latest LTS)
- **PostgreSQL** 14+ (local or cloud, e.g. Supabase/Neon)
- A terminal (PowerShell is fine on Windows)

#### 2.2. Backend (Express API)

1. Open a terminal in the `backend` folder:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create and configure a PostgreSQL database, then apply the schema:

   ```sql
   -- in psql or a GUI like pgAdmin
   CREATE DATABASE dermacare;
   \c dermacare
   \i schema.sql
   ```

4. Create a `.env` file in `backend/`:

   ```bash
   # backend/.env
   DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/dermacare
   JWT_SECRET=your-very-secret-jwt-key
   JWT_EXPIRES_IN=8h
   FRONTEND_ORIGIN=http://localhost:3000
   PORT=4000
   ```

5. Start the API in development:

   ```bash
   npm run dev
   ```

   The backend will run at `http://localhost:4000` and expose `/api/...` routes.

#### 2.3. Frontend (Next.js)

1. Open another terminal in the `frontend` folder:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in `frontend/`:

   ```bash
   # frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ```

4. Run the Next.js app:

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` in your browser.

---

### 3. How the main flows work

- **Patient registration**
  - UI: `frontend/src/app/auth/register/page.tsx`
  - API: `POST /api/auth/register`
  - Data is saved into `users` (role = `patient`) and `patients` (dermatology history).

- **Login for all roles**
  - UI: `frontend/src/app/auth/login/page.tsx`
  - API: `POST /api/auth/login`
  - Returns `{ token, role }`. The token is stored in `localStorage` as `derma_token`.
  - Frontend uses this token when calling protected endpoints.

- **Patient dashboard appointments**
  - UI: `frontend/src/app/patient/dashboard/page.tsx`
  - API: `GET /api/patient/appointments` (requires `Authorization: Bearer <token>`).
  - Uses the `appointments` table joined with `patients` + `users` (doctor).

- **Doctor dashboard appointments**
  - UI: `frontend/src/app/doctor/dashboard/page.tsx`
  - API: `GET /api/doctor/appointments` (requires doctor JWT).

Other dashboards (nurse, receptionist, admin) are UI‑ready with clear comments on which backend endpoints you should add next.

---

### 4. What you should do next

- **1. Finish database setup**
  - Make sure `dermacare` database is created and `schema.sql` is applied without errors.
  - Optionally seed some demo data for doctors and sample appointments.

- **2. Configure environment variables**
  - Set `.env` in `backend/` and `.env.local` in `frontend/` as shown above.

- **3. Extend backend functionality**
  - Add more endpoints to fully match the proposal:
    - Nurse workflows (vitals, observations).
    - Receptionist appointment approval/rescheduling.
    - Admin user & role management, reports, audit logs.
    - Medical record CRUD endpoints.
  - Implement Google Meet integration using Google Calendar API:
    - On confirmed virtual appointment, create a Calendar event + Meet link.
    - Store `meet_link` in the `appointments` table and expose it via an endpoint
      like `GET /api/appointments/:id/meet-link`.

- **4. Add real notifications**
  - Integrate email/SMS (e.g. via SendGrid, Twilio) for reminders and follow‑ups.
  - Call these from receptionist/admin and automated cron jobs.

- **5. (Optional) Online pharmacy module**
  - Add product/medicine tables and APIs.
  - Create patient UI screens for browsing, ordering, and linking prescriptions.

---

### 5. Summary

You now have:

- A **Next.js + Tailwind** UI that matches your project proposal, with role‑based dashboards.
- A **Node.js + Express + PostgreSQL** backend with JWT authentication and appointment APIs.
- A clear **schema** and **step‑by‑step instructions** so you can run, extend, and present this as a full online dermatology medical system with virtual consultations and future pharmacy integration.

