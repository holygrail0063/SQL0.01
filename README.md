# QueryRight

Practice SQL like it's your job.

QueryRight is a web-based SQL learning product. Users create an account, choose a learning goal, and practice SQL inside realistic fictional training environments. V0.2 includes the first environment, SQLBank, backed by a seeded training database.

SQLBank is completely fictional and exists only for QueryRight training.

## Architecture

```text
QueryRight
|
├── frontend/        Next.js, TypeScript, Tailwind CSS, Monaco Editor, SQLBank API routes
├── backend/         Optional FastAPI backend for future split-service deployments
├── supabase/        QueryRight app database schema and RLS policies
└── SQLBankTraining  Seeded fictional training database
```

Supabase stores product data:

- authentication
- profiles
- onboarding choices
- challenge progress
- challenge attempts

The training database stores only fictional SQLBank data:

- Customers
- Branches
- Applications
- Loans
- Payments

Do not store QueryRight accounts or progress inside `SQLBankTraining`.

## Prerequisites

Install Git, Node.js, and create a Supabase project or local Supabase setup. Docker and Python are only needed if you use the optional FastAPI backend.

## Environment

Copy the example file:

```bash
cp .env.example .env
cp .env.example backend/.env
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
```

Leave `NEXT_PUBLIC_API_BASE_URL` empty for the default one-service Next.js deployment. Set it only if you intentionally run a separate backend API.

Server-only Supabase keys belong in backend/server environments only. Do not expose service-role keys in the frontend.

## Supabase Setup

In your Supabase SQL editor, run:

```text
supabase/schema.sql
```

This creates `profiles`, `user_progress`, and `challenge_attempts`, with Row Level Security policies so users can only access their own records.
For an existing Supabase project, also run `supabase/migrations/202608200001_add_profile_names.sql` to add `first_name` and `last_name` to existing `profiles`.

Configure Supabase Auth:

- Enable Email + Password.
- Configure Google OAuth if you want `Continue with Google`.
- Add `http://localhost:3000/auth/callback`, `http://localhost:3000/onboarding`, and `http://localhost:3000/login` as allowed redirect/callback URLs for local development.
- For production, set the Supabase Auth site URL to `https://sql001-production.up.railway.app`.
- Add `https://sql001-production.up.railway.app/auth/callback`, `https://sql001-production.up.railway.app/onboarding`, and `https://sql001-production.up.railway.app/login` as allowed redirect URLs.
- If a confirmation email already points to localhost, that email was generated before the production URL was configured. Fix the Supabase Auth URL settings, redeploy Railway with `NEXT_PUBLIC_APP_URL`, then request a new confirmation email.
- Keep email confirmation enabled for public signups.
- Configure Auth rate limits and password strength rules in Supabase.
- To add bot protection, configure hCaptcha in Supabase Auth and set `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` in the frontend environment.

## SQLBankTraining

By default, the Next.js app serves the SQLBank API from `/api/challenges`, `/api/schema`, and `/api/query/run`. It seeds fictional SQLBank data in memory, so local development and Railway demos do not require SQL Server or a separate backend service.

If you want to run the SQL Server version instead, set `QUERY_ENGINE=sqlserver`, start SQL Server, and seed fictional SQLBank data:

```bash
docker compose --env-file .env up sqlserver db-init
```

Both engines use 500 customers, 20 branches, 1,500 applications, 700 loans, and 5,000 payments. The SQL Server initializer also creates `sqlbank_learner`, a read-only SQL Server login with `SELECT` access only to the five training tables.

## Optional FastAPI Backend

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

The optional FastAPI API never returns hidden `reference_sql`.

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

## Railway Deployment

This repository is a monorepo, but the MVP can deploy as one Railway service.

### One-service deployment

Use either of these approaches:

- Point Railway at the repository root. The root `package.json` builds and starts the `frontend` workspace.
- Or set the Railway service root directory to `frontend`.

Set Railway variables:

```text
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_APP_URL=https://sql001-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
```

Do not add `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, SQL Server variables, or backend-only variables to the frontend service.

### Split backend deployment

To use FastAPI or SQL Server later, create a second Railway service from the same repo with root directory `backend`, then set:

```text
QUERY_ENGINE=sqlite
FRONTEND_ORIGIN=https://your-frontend-service.up.railway.app
QUERY_TIMEOUT_SECONDS=5
MAX_RESULT_ROWS=200
MAX_QUERY_LENGTH=5000
```

Then set the frontend `NEXT_PUBLIC_API_BASE_URL` to that backend service URL.

You can run SQL Server in a separate Docker-capable host, Azure SQL, or another reachable SQL Server instance.
SQL Server mode also needs the Microsoft ODBC driver and the optional Python dependencies in `backend/requirements-sqlserver.txt`.

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

`pyodbc` install fails: use the default SQLite engine, or install `requirements-sqlserver.txt` in a Python version with a compatible `pyodbc` wheel.

QueryRight API request failed: leave `NEXT_PUBLIC_API_BASE_URL` empty for one-service Railway, or point it to a real separate backend URL.

Query returns backend error in SQLite mode: restart FastAPI and confirm `QUERY_ENGINE=sqlite`.

Query returns backend error in SQL Server mode: confirm SQL Server is listening on port `1433`, the database was seeded, and the backend has `pyodbc` installed.

Supabase auth unavailable: confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` exist in `frontend/.env.local`.

Progress does not save: confirm `supabase/schema.sql` was run and RLS policies exist.

CORS errors: set `FRONTEND_ORIGIN=http://localhost:3000` in `backend/.env` and restart FastAPI.

## V0.2 Exclusions

QueryRight V0.2 intentionally excludes pricing, billing, Stripe, AI hints, AI challenge generation, subscriptions, emails, streaks, leaderboards, certificates, social features, employer accounts, additional simulated companies, additional skills, and multiple SQL dialects.
