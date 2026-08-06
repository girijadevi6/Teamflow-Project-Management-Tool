# TeamFlow — Agile Project Management Tool

A full-stack project management tool for small teams (3–10 people). Models the hierarchy
**Project → User Story → Task**, with role-based access, a Kanban board, notifications, and a
background job that reminds people about tasks due tomorrow.

Live demo: `https://teamflow-frontend.onrender.com` *(update after you deploy — see [Deploying to Render](#deploying-to-render))*

---

## 1. Tech stack

| Layer          | Choice                                            |
|----------------|----------------------------------------------------|
| Frontend       | React 18 + TypeScript + Vite + Tailwind CSS + Axios |
| Backend        | FastAPI (Python 3.11) + SQLAlchemy ORM             |
| Auth           | JWT (python-jose) + bcrypt password hashing         |
| Database       | SQLite locally / PostgreSQL in production (Render)  |
| Background job | `asyncio` task started in FastAPI's lifespan hook   |
| Deployment     | Docker + Render Blueprint (`render.yaml`)           |

FastAPI was used instead of Flask mainly for **automatic OpenAPI/Swagger docs** (see
[API documentation](#5-api-documentation)) and native async support for the background worker —
both line up directly with two of the assignment's requirements. The data model, request/response
validation (Pydantic), and everything else would look the same in Flask.

---

## 2. Project structure

```
teamflow/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration, lifespan/startup
│   │   ├── database.py          # SQLAlchemy engine/session
│   │   ├── dependencies.py      # get_current_user, role guards
│   │   ├── core/
│   │   │   ├── config.py        # env-driven settings
│   │   │   └── security.py      # password hashing + JWT
│   │   ├── models/               # SQLAlchemy models (User, Project, UserStory, Task, ...)
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── routers/              # auth, projects, stories, tasks, notifications, dashboard
│   │   ├── services/              # activity log + notification helpers
│   │   └── workers/
│   │       └── due_date_worker.py  # async background job (see §6)
│   ├── seed_data.py              # idempotent demo-data seeder
│   ├── requirements.txt
│   ├── Dockerfile
│   └── runtime.txt               # python-3.11.9 (for non-Docker Render builds)
├── frontend/
│   ├── src/
│   │   ├── pages/                # Login, Register, Dashboard, ProjectDetails, KanbanBoard, ...
│   │   ├── components/
│   │   ├── context/AuthContext.tsx
│   │   └── api/                  # axios client + typed API calls
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml            # local full-stack run
└── render.yaml                   # Render Blueprint (backend + frontend + Postgres)
```

---

## 3. Data model / hierarchy

```
User ──< ProjectMember >── Project ──< UserStory ──< Task
  │                                                    │
  └──────────────< Notification >────────────────────┘
  └──────────────< ActivityLog  >── Project
```

| Table            | Key fields                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| **users**         | id, name, email (unique), password_hash, role (`manager`/`team_leader`/`member`), avatar_color |
| **projects**      | id, name, description, status (`planning`/`active`/...), created_by → users.id |
| **project_members** | project_id, user_id, role (`owner`/`team_leader`/`member`) — join table controlling who sees/edits a project |
| **user_stories**  | id, project_id → projects.id, title, description, priority, status, created_by |
| **tasks**         | id, story_id → user_stories.id, title, description, status, priority, assigned_to → users.id, due_date, story_points, created_by |
| **notifications** | id, user_id, type (`task_due_soon`, `task_assigned`, ...), title, message, is_read, related_project/story/task ids |
| **activity_logs** | id, project_id, user_id, action, entity_type/id/name, detail, created_at — audit trail of who did what |

Every Task belongs to exactly one UserStory, and every UserStory belongs to exactly one Project —
enforced with `ForeignKey(nullable=False)` — so the Project → Story → Task hierarchy is always intact.
`GET /projects/{id}/hierarchy` returns the whole tree in one call for the UI.

Tables are created automatically on startup via `Base.metadata.create_all()`; no separate migration
step is required for this assignment (Alembic is included in requirements if you want to add real
migrations later).

---

## 4. Roles & permissions

| Role          | Can do |
|---------------|--------|
| **Manager**   | Create/delete any project, manage all members, everything below |
| **Team Leader** | Create/edit/delete stories & tasks in projects they lead, add/remove members, assign tasks |
| **Member**    | View projects they're a member of, update the status of tasks assigned to them, comment/act via Kanban |

Enforced server-side in `app/dependencies.py` and per-route checks in the routers — the frontend
hiding a button is a UX nicety, not a security boundary.

---

## 5. API documentation

FastAPI generates interactive docs automatically — no separate Swagger setup needed:

- **Swagger UI:** `{BACKEND_URL}/docs`
- **ReDoc:** `{BACKEND_URL}/redoc`
- **Raw OpenAPI schema:** `{BACKEND_URL}/openapi.json`

Locally that's `http://localhost:8000/docs`.

### Endpoint summary

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me`, `GET /auth/users` |
| **Projects** | `POST /projects`, `GET /projects`, `GET /projects/{id}`, `PUT /projects/{id}`, `DELETE /projects/{id}`, `GET /projects/{id}/hierarchy`, `POST /projects/{id}/members`, `PUT /projects/{id}/members/{user_id}`, `DELETE /projects/{id}/members/{user_id}` |
| **Stories** | `POST /projects/{project_id}/stories`, `GET /projects/{project_id}/stories`, `GET /stories/{id}`, `PUT /stories/{id}`, `DELETE /stories/{id}` |
| **Tasks** | `POST /stories/{story_id}/tasks`, `GET /stories/{story_id}/tasks`, `GET /tasks/{id}`, `PUT /tasks/{id}`, `DELETE /tasks/{id}`, `PATCH /tasks/{id}/status`, `PATCH /tasks/{id}/assign`, `GET /tasks/my/assigned`, `GET /projects/{project_id}/kanban` |
| **Notifications** | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/mark-read`, `PATCH /notifications/mark-all-read`, `DELETE /notifications/{id}` |
| **Dashboard** | `GET /dashboard/stats`, `GET /dashboard/activity` |

All routes except `/auth/register` and `/auth/login` require `Authorization: Bearer <JWT>`.

---

## 6. Async / background workflow

`backend/app/workers/due_date_worker.py` implements the assignment's async requirement:

- Started as an `asyncio.create_task()` inside FastAPI's `lifespan` context (`main.py`), so it runs
  in the same process without blocking request handling.
- Every 24 hours it scans for tasks due **tomorrow** that aren't done, and creates a
  `TASK_DUE_SOON` notification for the assignee — deduplicated so re-runs don't spam the same
  notification twice.
- **Failure handling:** the whole scan is wrapped in `try/except Exception`, logged, and the loop
  continues to the next 24h cycle rather than crashing the worker or the API process. Each run opens
  its own DB session and closes it in a `finally` block so a failed run can't leak connections.
- **Retry design note:** because the check re-scans "due tomorrow" state (not a queue of one-off
  jobs), a missed run self-heals on the next cycle — there's nothing to explicitly retry. If this
  became a queue of one-shot jobs (e.g. "send this email once"), the natural next step would be a
  proper task queue (Celery + Redis, or FastAPI `BackgroundTasks` + a durable outbox table) with
  exponential-backoff retries and a dead-letter path — noted in [§10](#10-what-id-improve--build-next).

---

## 7. Security considerations

- **Passwords** are hashed with bcrypt (`passlib`/`bcrypt`), never stored or logged in plaintext.
- **JWTs** are signed with `SECRET_KEY` (HS256), expire after `ACCESS_TOKEN_EXPIRE_MINUTES`
  (default 24h), and are validated on every protected route via `get_current_user`.
- **Role checks** happen server-side per route, not just hidden in the UI.
- **CORS** is restricted to an explicit allow-list (`FRONTEND_URL` + `CORS_ORIGINS`) rather than `*`.
- **SQL injection**: all queries go through SQLAlchemy's ORM/parameterized queries — no raw string-built SQL.
- **Secrets**: `.env` is git-ignored; `SECRET_KEY` is auto-generated by Render in production
  (`generateValue: true` in `render.yaml`) rather than committed.
- **Known gaps for a real production system** (acceptable for an internship assignment, called out
  intentionally rather than silently skipped):
  - No rate limiting on `/auth/login` (brute-force protection).
  - No email verification or password-reset flow.
  - JWTs are not currently revocable before expiry (no blocklist) — fine at 24h TTL for a demo, not
    for a real product.
  - No HTTPS enforcement at the app layer (handled by Render's edge in production).

---

## 8. Local setup

### Prerequisites
- Python **3.11**
- Node.js 20+
- (Optional) Docker + Docker Compose, if you'd rather skip local installs

### Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp ../.env.example .env         # or edit backend/.env directly — defaults work out of the box
python seed_data.py             # creates teamflow.db and the demo accounts below (idempotent)
uvicorn app.main:app --reload --port 8000
```

Backend now running at `http://localhost:8000` (docs at `/docs`).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL defaults to http://localhost:8000
npm run dev
```

Open `http://localhost:5173` — you'll land on `/login`, and a successful login redirects to
`/dashboard` automatically (see `PrivateRoute` in `App.tsx`).

### Or: one command with Docker Compose

```bash
docker compose up --build
```

Backend on `:8000`, frontend on `:5173`, SQLite persisted in a named volume.

### Demo accounts

All accounts use password **`password123`** and are created automatically by `seed_data.py`:

| Role | Email |
|------|-------|
| Manager | `manager@teamflow.com` |
| Team Leader | `leader1@teamflow.com` |
| Team Leader | `leader2@teamflow.com` |
| Member | `john@teamflow.com` |
| Member | `emma@teamflow.com` |
| Member | `david@teamflow.com` |
| Member | `lisa@teamflow.com` |
| Member | `tom@teamflow.com` |
| Member | `amy@teamflow.com` |
| Member | `chris@teamflow.com` |
| Member | `nina@teamflow.com` |

(Full context on which projects each account belongs to is in `CREDENTIALS.md`.)

---

## 9. Deploying to Render

This repo includes a **Render Blueprint** (`render.yaml`) that provisions three things in one go:
a free Postgres database, the FastAPI backend (Docker web service), and the React frontend (static
site).

### Steps

1. Push this repo to GitHub.
2. In the Render dashboard: **New → Blueprint**, point it at your repo. Render reads `render.yaml`
   and shows you `teamflow-backend`, `teamflow-frontend`, and `teamflow-db` — click **Apply**.
3. Render assigns each web service a URL like `https://teamflow-backend-xxxx.onrender.com`. Copy the
   real URLs, then update:
   - On **teamflow-backend**: `FRONTEND_URL` and `CORS_ORIGINS` → your real frontend URL.
   - On **teamflow-frontend**: `VITE_API_URL` → your real backend URL.
   - Redeploy the frontend after changing `VITE_API_URL` (it's baked in at build time, not read at runtime).
4. On first boot, the backend container runs `seed_data.py` automatically (see `backend/Dockerfile`),
   so the demo accounts above exist immediately — nothing extra to run manually.
5. Visit the frontend URL, log in with any demo account, and you should land on `/dashboard`.

### Notes

- **Database**: `render.yaml` provisions a Render Postgres instance and wires its connection string
  into `DATABASE_URL`. This is the recommended path for Render specifically because web services on
  Render have an **ephemeral filesystem** — a SQLite file written inside the container is lost on
  every redeploy/restart. `backend/app/database.py` supports both SQLite (local dev) and Postgres
  (production) with no code changes needed.
- Render's **free Postgres** plan expires after 90 days; for anything longer-lived, upgrade the plan
  or point `DATABASE_URL` at another Postgres provider.
- If you'd rather deploy without the blueprint, you can create the two services manually in the
  Render UI using the same Dockerfiles/build commands referenced in `render.yaml`.

---

## 10. What I'd improve / build next

With more time:
- Move the background worker to a real task queue (Celery + Redis or an outbox table) so notification
  delivery survives process restarts and supports retry/backoff instead of a 24h `asyncio.sleep` loop.
- Add pagination and server-side filtering on `GET /projects/{id}/stories` and task lists — fine at
  demo scale, wouldn't hold up with hundreds of tasks per project.
- Rate-limit `/auth/login`, add password reset, and support JWT revocation (short-lived access token
  + refresh token pair instead of one 24h token).
- Alembic migrations instead of `create_all()`, once the schema needs to evolve without a full reset.
- Automated tests (backend: pytest + httpx against a test DB; frontend: component tests for the
  Kanban drag/drop and auth flows).
- Optimistic UI updates on the Kanban board instead of waiting on each PATCH response.

---

## 11. AI usage note

This project was built with AI assistance (Claude) for: scaffolding the FastAPI router/model/schema
structure, the React component/page structure, drafting the async worker, and this documentation.
Architecture decisions (FastAPI over Flask for async + auto-docs, JWT auth design, the
Project→Story→Task schema, Postgres-for-Render vs. SQLite-for-local split) were reviewed and directed
rather than accepted blindly — e.g. the CORS/env-var handling and Render blueprint were adjusted
specifically to fix issues that only show up at deploy time (hardcoded `localhost` API URL, SQLite's
ephemeral-disk problem on Render, dynamic `$PORT` binding).
