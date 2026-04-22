# 🌱 Field Monitoring System

A full-stack web application for coordinating large-scale agricultural field monitoring. Built to track crop progress, surface at-risk fields early, and provide a tight feedback loop between field agents and coordinators.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Field Status Logic](#field-status-logic)
- [Setup Instructions](#setup-instructions)
- [API Reference](#api-reference)
- [Assumptions](#assumptions)
- [Demo Credentials](#demo-credentials)

---

## Overview

Field Monitoring System is a dual-dashboard system with two distinct user roles:

- **Coordinators (Admins)** — get a birds-eye view of all fields, agents, and risk signals across the entire operation.
- **Field Agents** — see only their assigned fields and can log observations and stage transitions in real time.

The system is built around three core principles: **Information Density**, **Operational Reliability**, and **Performance**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, Motion, Lucide Icons |
| Backend | Node.js, Express.js, TypeScript |
| Database | Neon PostgreSQL (Serverless) via `@neondatabase/serverless` |
| Validation | Zod (schema validation) |
| Auth | JWT (stateful sessions), BcryptJS (password hashing) |
| Build | Vite (dev HMR + production bundling) |

---

## Features

### Coordinator Dashboard
- Overview of all fields across all agents
- Aggregate stats: total fields, status breakdown (Active / At Risk / Completed)
- Per-agent field assignment summaries
- Risk flags surfaced automatically — no manual review needed

### Field Agent Dashboard
- View only personally assigned fields
- Log stage transitions: Planted → Growing → Ready → Harvested
- Add free-text observations and notes per field
- Real-time status indicators on each field card

### Shared
- Secure login with role-based access control (RBAC)
- Full evolutionary archive — every stage change and observation is timestamped and stored
- Automated status engine re-evaluates fields on every data fetch

---

## Architecture & Design Decisions

### 1. Single-Port Fullstack Architecture

To simplify deployment in containerized environments (Cloud Run, Railway, Render), the application uses an integrated Express + Vite architecture. In production, Express serves the optimized React build from `dist/`. In development, Vite runs as Express middleware for Hot Module Replacement — no separate frontend server needed.

This means a single `PORT` environment variable, a single Docker container, and no reverse proxy configuration required.

### 2. Parallel Status Synchronization

When the backend retrieves field lists or dashboard stats, it runs status recalculations in parallel using `Promise.all`. This avoids sequential blocking — every field's time-based risk check (e.g., the 5-day inactivity rule) resolves concurrently, keeping API response times flat regardless of how many fields an agent manages.

### 3. Natural Language Risk Detection

Rather than adding AI/LLM dependencies, the system uses a lightweight keyword-based detection engine in `/server/lib/statusHelper.ts`. It handles two cases:

- **Risk signals** — keywords like `"pests detected"`, `"disease spotted"`, `"flooding"` trigger an `At Risk` status.
- **Resolution signals** — keywords like `"pest issue solved"`, `"treatment applied"` cancel prior risk flags.

This gives accurate, explainable field statuses with zero inference latency or API cost.

### 4. Direct Resource Retrieval

Field detail pages call `GET /api/fields/:id` directly rather than pulling the full global list and filtering client-side. This keeps the UI snappy as the registry scales to thousands of fields, and avoids unnecessary data transfer.

### 5. Role-Based Access at the API Layer

Access control is enforced in Express middleware, not just on the frontend. Field agents cannot query other agents' fields — the API validates their JWT and scopes all queries to their `agent_id`. Coordinators receive unscoped access.

---

## Field Status Logic

Each field carries a computed `status` derived from two signals:

### Status Values

| Status | Meaning |
|---|---|
| `Active` | Field has recent activity and no risk signals |
| `At Risk` | Inactivity threshold exceeded, or a risk keyword was detected in recent notes |
| `Completed` | Field has reached the `Harvested` stage |

### Computation Rules

1. **Completed** — if the field's current stage is `Harvested`, status is always `Completed`, regardless of other signals.
2. **At Risk (time-based)** — if the last recorded observation or stage update is more than **5 days** in the past, the field is flagged `At Risk`.
3. **At Risk (keyword-based)** — if the most recent notes contain risk keywords (e.g., `pest`, `disease`, `flood`, `drought`, `damage`), and no subsequent resolution keyword is present, the field is flagged `At Risk`.
4. **Active** — all other fields that don't satisfy the above conditions.

Status is not stored in the database. It is computed fresh on every read, ensuring it always reflects the latest data without requiring background jobs or scheduled recalculations.

---

## Setup Instructions

### Prerequisites

- Node.js v18+
- A [Neon](https://neon.tech) PostgreSQL database (or any PostgreSQL-compatible connection string)

### 1. Clone the Repository

```bash
git clone https://github.com/Chrisphine0/field-monitoring-system.git
cd field-monitoring-system
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secure_random_string_min_32_chars
NODE_ENV=development
```

> **Note:** `JWT_SECRET` should be a long, random string. You can generate one with `openssl rand -hex 32`.

### 3. Install Dependencies

```bash
npm install
```

### 4. Initialize the Database

This script creates all tables and seeds initial data (roles, demo users, sample fields).

> ⚠️ **Warning:** This script is destructive — it drops and recreates all tables.

```bash
# Development
npm run setup-db

# Production (requires bypass flag to prevent accidental resets)
FORCE_SETUP=true npm run setup-db
```

### 5. Run the Application

```bash
# Development — Vite + Express with HMR
npm run dev

# Production — build frontend, then serve via Express
npm run build
npm start
```

The app will be available at `http://localhost:3000` (or the `PORT` you configure).

---

## API Reference

All endpoints require a valid `Authorization: Bearer <token>` header except `/api/auth/login`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login and receive a JWT |
| `POST` | `/api/auth/logout` | Invalidate the current session |

### Fields

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/fields` | Coordinator | List all fields with current status |
| `GET` | `/api/fields` | Agent | List assigned fields only |
| `GET` | `/api/fields/:id` | Both | Get a single field's details |
| `POST` | `/api/fields` | Coordinator | Create a new field |
| `PUT` | `/api/fields/:id` | Both | Update field stage or details |
| `DELETE` | `/api/fields/:id` | Coordinator | Remove a field |

### Observations

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/fields/:id/logs` | Both | Get observation history for a field |
| `POST` | `/api/fields/:id/logs` | Agent | Add a new observation or stage update |

### Dashboard

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Coordinator | Aggregate stats across all fields |
| `GET` | `/api/dashboard/stats` | Agent | Stats scoped to assigned fields |

---

## Assumptions

- **Timezone:** All timestamps are stored and processed in UTC to ensure consistency across different agricultural zones and agent locations.
- **Authentication Persistence:** Session tokens are stored in `localStorage` for simplicity. Production deployments should migrate to `httpOnly` cookies to mitigate XSS risk.
- **Single Tenant:** The current architecture assumes a single organization (one admin hierarchy, many agents). Multi-tenancy would require a `tenant_id` scope added to all queries and JWT claims.
- **Field Lifecycle:** Stages are strictly linear (Planted → Growing → Ready → Harvested). Backdating stages or branching workflows are not currently supported.
- **Risk Window:** The 5-day inactivity threshold is hardcoded. In a production system this would be a configurable per-crop or per-organization parameter.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Coordinator (Admin) | `admin@example.com` | `admin123` |
| Field Agent | `agent1@example.com` | `agent123` |

---

*Built for the ShambaRecords Technical Assessment — April 2026.*