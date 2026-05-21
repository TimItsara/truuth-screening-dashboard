# Truuth Screening Dashboard Demo

React + Vite + TypeScript dashboard prototype for adverse media, PEP, and sanctions screening review.

This repository is intended to be deployed as the frontend for the separate `truuth-worker` backend API repository.

## Overview

The dashboard gives stakeholders a usable demo surface for the Truuth Worker architecture:

```text
seed subjects
-> run screening
-> review normalized alerts
-> inspect vendor/task/audit evidence
-> reset demo data for another walkthrough
```

The UI is not a production app. It is a controlled demo dashboard for showing the backend worker flow end to end.

## Key Features

- API URL control in the header
- Seed demo dataset
- Run screening against mock vendor adapters
- Reset demo database state
- Sidebar navigation
- Subject management view
- Adverse media review view
- PEP and sanctions focused view
- Compliance reports / operational evidence view
- Provider configuration view
- Analyst review actions:
  - Accept
  - Request verification
  - Dismiss
- Truuth logo and brand-aligned dashboard shell

## Related Repository

This frontend expects a running Truuth Worker backend.

Backend repository:

```text
truuth-worker
```

Local backend URL:

```text
http://127.0.0.1:8000
```

Deployed backend URL example:

```text
https://your-truuth-worker.vercel.app
```

## Project Structure

```text
src/
  api/
    client.ts       # typed API client
    storage.ts      # persisted API base URL
    types.ts        # backend response types
  components/
    AlertDetail.tsx
    DemoToolbar.tsx
    Header.tsx
    OpsPanel.tsx
    ResultsList.tsx
    ReviewQueue.tsx
    Sidebar.tsx
    StatsCards.tsx
    StatusBanner.tsx
    SubjectSummary.tsx
    Views.tsx
    viewTypes.ts
  styles/
    index.css
  App.tsx
  main.tsx
public/
  truuth-logo.png
vercel.json
```

## Local Setup

Install dependencies:

```bash
npm install
```

Start the backend first:

```bash
cd ../truuth-worker
uvicorn app.main:app --reload
```

Start the dashboard:

```bash
cd ../truuth-screening-dashboard
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

The default API base URL is:

```text
http://127.0.0.1:8000
```

You can change the API URL in the dashboard header and click **Save**. The value is stored in browser local storage for demo convenience.

## Environment Variables

Create a local `.env` if needed:

```bash
cp .env.example .env
```

Local default:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Deployed frontend:

```env
VITE_API_BASE_URL=https://<deployed-backend-domain>
```

Do not commit `.env`. It is ignored by `.gitignore`.

## Demo Flow

Use this flow for the first stakeholder demo.

### 1. Confirm API URL

In the header, confirm the API URL points to the backend:

```text
http://127.0.0.1:8000
```

or:

```text
https://<deployed-backend-domain>
```

Click **Save**.

### 2. Reset Demo

Click:

```text
Reset Demo
```

This calls:

```text
POST /demo/reset?reseed=true
```

The backend clears persistent demo state and reseeds the standard candidate dataset.

### 3. Run Screening

Click:

```text
Run Screening
```

This calls:

```text
POST /screening/runs
GET /dashboard/runs/{run_id}
GET /vendors/executions
GET /tasks
```

The dashboard displays normalized results from mock adverse media and mock PEP/sanctions adapters.

### 4. Review Alerts

Open:

```text
Adverse Media Review
```

Select a result and click one review action:

```text
Accept
Request verification
Dismiss
```

This calls:

```text
POST /results/{result_id}/review
```

The backend persists the review action and writes an audit log.

### 5. Show PEP & Sanctions

Open:

```text
PEP & Sanctions
```

This view filters normalized results to PEP/sanctions outcomes.

### 6. Show Compliance Reports

Open:

```text
Compliance Reports
```

Use:

```text
Trigger Schedule
Simulate Webhook
```

These call:

```text
POST /schedules
POST /schedules/{schedule_id}/trigger
POST /webhooks/vendors/{vendor_name}
```

Use this view to explain task placeholders, vendor execution evidence, and webhook callback shape.

## API Calls Used By The UI

```text
POST /seed
POST /demo/reset?reseed=true
GET /candidates
POST /screening/runs
GET /dashboard/runs/{run_id}
GET /vendors/executions
GET /tasks
POST /schedules
POST /schedules/{schedule_id}/trigger
POST /tasks/{task_id}/execute
POST /webhooks/vendors/{vendor_name}
POST /results/{result_id}/review
```

## Validation

Run the static UI smoke check:

```bash
python ui_smoke_check.py
```

Run the production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Open:

```text
http://127.0.0.1:4173
```

## Vercel Deployment

Create a new Vercel project using this repository as the project root.

Recommended settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Set environment variable:

```env
VITE_API_BASE_URL=https://<deployed-backend-domain>
```

The included [vercel.json](vercel.json) configures:

- production build command
- `dist` output directory
- SPA fallback to `index.html`

After deployment:

1. Open the frontend domain.
2. Confirm the API URL in the header.
3. Click **Save**.
4. Click **Reset Demo**.
5. Click **Run Screening**.

## Backend Deployment Dependency

Deploy the backend first. The frontend needs the backend URL during deployment.

Backend Vercel env should include:

```env
REPOSITORY_BACKEND=postgres
DATABASE_URL=<supabase-transaction-pooler-url>
```

Frontend Vercel env should include:

```env
VITE_API_BASE_URL=https://<backend-domain>
```

## Troubleshooting

If the page loads but buttons fail, check the API URL in the header.

If requests fail with network or CORS errors, confirm the backend is deployed and reachable at `/health`.

If `Reset Demo` fails, check the backend `DATABASE_URL` and Supabase connection.

If Vercel build fails, run `npm run build` locally and fix TypeScript errors before redeploying.

If old API URL values keep appearing, clear browser local storage for this site or type the correct URL and click **Save**.

## Non-Goals

The dashboard does not implement:

- authentication
- RBAC
- real vendor configuration
- real OCR upload flows
- production admin controls
- production-grade audit/report exports

Those belong in future phases after the worker architecture demo is accepted.
