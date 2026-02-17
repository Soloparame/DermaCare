# How to View Registered Users in pgAdmin

This guide explains how to view registered users from the DermaCare app in pgAdmin.

## Prerequisites

- PostgreSQL installed and running
- pgAdmin installed
- Database `dermacare` created (from `backend/schema.sql`)

## Step 1: Connect to the Database in pgAdmin

1. Open **pgAdmin**
2. In the left sidebar, expand **Servers**
3. Click your PostgreSQL server (e.g. `localhost`)
4. Enter the password if prompted (from your `DATABASE_URL` in `.env`)
5. Expand **Databases** → **dermacare**

## Step 2: Open the Query Tool

1. Right-click **dermacare**
2. Select **Query Tool**
3. A SQL editor will open

## Step 3: Run Queries to View Users

### View all registered users (basic info)

```sql
SELECT id, role, full_name, email, phone, created_at 
FROM users 
ORDER BY created_at DESC;
```

### View users with their roles

```sql
SELECT 
  u.id,
  u.role,
  u.full_name,
  u.email,
  u.phone,
  u.date_of_birth,
  u.gender,
  u.created_at
FROM users u
ORDER BY u.created_at DESC;
```

### View only patients (with dermatology history)

```sql
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.phone,
  p.dermatology_history
FROM users u
JOIN patients p ON p.user_id = u.id
WHERE u.role = 'patient'
ORDER BY u.created_at DESC;
```

### Count users by role

```sql
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY count DESC;
```

## Step 4: Browse Tables (Alternative to Query Tool)

1. Expand **dermacare** → **Schemas** → **public** → **Tables**
2. Right-click **users**
3. Select **View/Edit Data** → **All Rows**
4. You’ll see all columns: `id`, `role`, `full_name`, `email`, `password_hash`, `phone`, `date_of_birth`, `gender`, `created_at`

**Note:** `password_hash` is hashed and should never be shared. Use queries above if you want to inspect data without showing passwords.

## Connection Details (from .env)

Your `DATABASE_URL` format:
```
postgresql://postgres:PASSWORD@localhost:5432/dermacare
```

- **Host:** localhost  
- **Port:** 5432  
- **Database:** dermacare  
- **Username:** postgres  
- **Password:** (from your `.env`)

## Troubleshooting

- **Connection refused:** Ensure PostgreSQL is running.
- **Database doesn’t exist:** Create it and run `backend/schema.sql`.
- **Empty users table:** No users have registered yet; create one via the app.
