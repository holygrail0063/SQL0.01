# QueryRight

Practice SQL like it's your job.

QueryRight is a web-based SQL learning product. Users create an account, choose a learning goal, and practice SQL inside realistic fictional training environments. V0.2 includes the first environment, SQLBank, backed by the `SQLBankTraining` Microsoft SQL Server database.

SQLBank is completely fictional and exists only for QueryRight training.

## Architecture

```text
QueryRight
|
├── frontend/        Next.js, TypeScript, Tailwind CSS, Monaco Editor
├── backend/         FastAPI, read-only SQL validation/execution, answer checking
├── supabase/        QueryRight app database schema and RLS policies
└── SQLBankTraining  Microsoft SQL Server training database
```

Supabase stores product data:

- authentication
- profiles
- onboarding choices
- challenge progress
- challenge attempts

SQL Server stores only fictional SQLBank training data:

- Customers
- Branches
- Applications
- Loans
- Payments

Do not store QueryRight accounts or progress inside `SQLBankTraining`.

## Prerequisites

Install Git, Docker, Node.js, Python 3.12, and create a Supabase project or local Supabase setup.

## Environment

Copy the example file:

```bash
cp .env.example .env
cp .env.example backend/.env
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Server-only Supabase keys belong in backend/server environments only. Do not expose service-role keys in the frontend.

## Supabase Setup

In your Supabase SQL editor, run:

```text
supabase/schema.sql
```

This creates `profiles`, `user_progress`, and `challenge_attempts`, with Row Level Security policies so users can only access their own records.

Configure Supabase Auth:

- Enable Email + Password.
- Configure Google OAuth if you want `Continue with Google`.
- Add `http://localhost:3000/onboarding` as an allowed redirect/callback URL for local development.

## SQL Server And SQLBankTraining

Start SQL Server and seed fictional SQLBank data:

```bash
docker compose --env-file .env up sqlserver db-init
```

The initializer creates 500 customers, 20 branches, 1,500 applications, 700 loans, and 5,000 payments. It also creates `sqlbank_learner`, a read-only SQL Server login with `SELECT` access only to the five training tables.

## Backend

```bash
cd backend
py -3.12 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Check:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/challenges
```

The API never returns hidden `reference_sql`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Routes:

- `/` landing page
- `/login`
- `/signup`
- `/forgot-password`
- `/onboarding`
- `/dashboard`
- `/learn`
- `/challenge/1`
- `/profile`
- `/settings`

Protected routes redirect unauthenticated users to `/login`.

## Test The V0.2 Flow

1. Open the QueryRight landing page.
2. Click **Start Learning Free**.
3. Create an account.
4. Complete onboarding.
5. Open the dashboard.
6. Start Challenge 1.
7. Run:

```sql
SELECT *
FROM Customers;
```

8. Confirm rows appear and the answer is marked correct.
9. Return to the dashboard and confirm progress updates.
10. Log out and back in, then confirm progress persists.

## Manual SQL Security Checks

These should work:

```sql
SELECT *
FROM Customers;
```

```sql
WITH OntarioCustomers AS (
    SELECT *
    FROM Customers
    WHERE Province = 'Ontario'
)
SELECT *
FROM OntarioCustomers;
```

These should fail:

```sql
DELETE FROM Customers;
DROP TABLE Customers;
UPDATE Customers SET Province = 'Alberta';
USE master;
```

The application validator rejects prohibited SQL, and the SQL Server learner account remains the final read-only protection layer.

## Tests

Backend tests:

```bash
cd backend
pytest
```

Frontend build:

```bash
cd frontend
npm run build
```

Production dependency audit:

```bash
cd frontend
npm audit --omit=dev --audit-level=high
```

## Troubleshooting

SQL Server not ready: wait for the health check, then rerun `docker compose --env-file .env up db-init`.

Docker missing: install Docker Desktop and make sure `docker` is available on your PATH.

`pyodbc` install fails: use Python 3.12. Python 3.14 may not have a compatible `pyodbc` wheel.

Query returns backend error: confirm SQL Server is listening on port `1433`, the database was seeded, and the backend has `pyodbc` installed.

Supabase auth unavailable: confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` exist in `frontend/.env.local`.

Progress does not save: confirm `supabase/schema.sql` was run and RLS policies exist.

CORS errors: set `FRONTEND_ORIGIN=http://localhost:3000` in `backend/.env` and restart FastAPI.

## V0.2 Exclusions

QueryRight V0.2 intentionally excludes pricing, billing, Stripe, AI hints, AI challenge generation, subscriptions, emails, streaks, leaderboards, certificates, social features, employer accounts, additional simulated companies, additional skills, and multiple SQL dialects.
