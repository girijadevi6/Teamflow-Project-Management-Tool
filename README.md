# TeamFlow – Agile Project Management Tool

**Demo Link:** [Video Demonstration](https://drive.google.com/file/d/1WB0n1SnU_NdYQRfs1mdYLC9eoapjG-fe/view?usp=sharing)

🚀 **Live Demo:** [TeamFlow Application](https://teamflow-frontend-kjdl.onrender.com)

📚 **API Documentation:** [Swagger UI](https://teamflow-backend-41oe.onrender.com/docs)

Note: The PostgreSQL database is currently hosted using Render's free/trial offering. The database may expire after the applicable trial period, so the live application may become unavailable after that period.

TeamFlow is a full-stack agile project management application designed for small teams of around 3–10 people. It follows a simple hierarchy:

**Project → User Story → Task**

The application has three roles: Manager, Team Leader, and Member. The Manager creates and manages projects, assigns Team Leaders, and gives the final project approval. 

The **Manager** is responsible for the overall project and team. The Manager creates and manages projects, assigns Team Leaders to the projects, and monitors the overall project progress. The Manager can track the work completed by the team and, once the Team Leader submits the completed project, reviews it and provides the **final project approval**.

The **Team Leader** manages the development workflow within the project. The Team Leader creates **User Stories** based on the project requirements and divides them into smaller **Tasks**. These Tasks are assigned to Members based on their responsibilities. The Team Leader monitors task progress, reviews the work submitted by Members, and uses the **comment section** to provide feedback or request changes. After all required work is completed and reviewed, the Team Leader submits the project to the Manager for final approval.

The **Members** are responsible for completing the Tasks assigned to them. They can view their assigned Tasks, update their progress and status, log the time spent on the work, and submit completed Tasks to the Team Leader for review. If changes are requested, Members can refer to the comments provided by the Team Leader, make the necessary updates, and resubmit the Task. This creates a complete workflow from **Project → User Story → Task → Assignment → Development → Review → Final Approval**.

The application provides role-based access, project and team management, a Kanban board, task assignment, comments, notifications, activity tracking, time logging, and an AI project assistant.

The project was built for the Full-Stack Intern Assignment and focuses not only on functionality, but also on API design, database structure, security, asynchronous processing, documentation, and deployment.

---

## 1. What TeamFlow Does

TeamFlow helps a small development team manage work from the project level down to individual tasks.

The main workflow is:

```text
Project
   │
   ├── Project Members
   │
   └── User Stories
          │
          └── Tasks
                ├── Comments
                └── Time Logs
```

The application also maintains:

```text
Users
Notifications
Activity Logs
```

### Main features

- User registration and login
- JWT-based authentication
- Role-based access control
- Manager, Team Leader, and Member roles
- Project creation and management
- Project member management
- User Story creation and tracking
- Task creation, assignment, updating, and deletion
- Task status and priority management
- Kanban board
- Task comments and team discussions
- Task time logging
- Notifications
- Activity/audit history
- Dashboard statistics and recent activity
- Asynchronous due-date notification workflow
- AI Project Assistant powered by Groq
- Website usage guidance through an AI knowledge base
- Project/task questions using authorized live project data
- Automatic Swagger/OpenAPI documentation
- Local SQLite support
- PostgreSQL support for production
- Docker and Docker Compose support
- Render deployment configuration

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Axios |
| Backend | FastAPI, Python 3.11, SQLAlchemy |
| Authentication | JWT, `python-jose`, bcrypt password hashing |
| Validation | Pydantic |
| Local Database | SQLite |
| Production Database | PostgreSQL |
| Async Workflow | Python `asyncio` task running with FastAPI lifespan |
| AI Assistant | Groq API |
| AI SDK | Groq Python SDK |
| Deployment | Docker, Render Blueprint |
| API Documentation | FastAPI OpenAPI, Swagger UI, ReDoc |

### Why FastAPI?

FastAPI was chosen mainly because it provides two useful features for this project:

1. Automatic OpenAPI/Swagger documentation.
2. Native support for asynchronous Python workflows.

These directly support the assignment's API documentation and asynchronous/background workflow requirements.

The application could also have been implemented with Flask, but FastAPI makes the API validation, documentation, and async workflow more convenient.

---

## 3. Project Structure

```text
teamflow/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │   └── SQLAlchemy database models
│   │   │
│   │   ├── schemas/
│   │   │   └── Pydantic request/response schemas
│   │   │
│   │   ├── routers/
│   │   │   ├── auth
│   │   │   ├── projects
│   │   │   ├── stories
│   │   │   ├── tasks
│   │   │   ├── comments
│   │   │   ├── notifications
│   │   │   └── dashboard
│   │   │
│   │   ├── services/
│   │   │   ├── activity log helpers
│   │   │   └── notification helpers
│   │   │
│   │   └── workers/
│   │       └── due_date_worker.py
│   │
│   ├── seed_data.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── runtime.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── api/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   └── DATABASE_SCHEMA.md
│
├── docker-compose.yml
├── render.yaml
├── .env.example
└── README.md
```

---

## 4. Database Design

TeamFlow uses a relational database through SQLAlchemy ORM.

The core hierarchy required by the assignment is:

```text
Project
   ↓
User Story
   ↓
Task
```

### Complete relationship overview

```text
                         ┌──────────────┐
                         │    Users     │
                         └──────┬───────┘
                                │
                 ┌──────────────┼───────────────┐
                 │              │               │
                 ▼              ▼               ▼
        ┌────────────────┐  ┌──────────┐  ┌──────────────┐
        │Project Members │  │ Projects │  │Notifications │
        └───────┬────────┘  └────┬─────┘  └──────────────┘
                │                │
                │                ├──────────────► Activity Logs
                │                │
                │                ▼
                │          ┌──────────────┐
                └─────────►│ User Stories │
                           └──────┬───────┘
                                  │
                                  ▼
                             ┌─────────┐
                             │  Tasks  │
                             └────┬────┘
                                  │
                       ┌──────────┴──────────┐
                       ▼                     ▼
                  ┌──────────┐         ┌───────────┐
                  │ Comments │         │ Time Logs │
                  └──────────┘         └───────────┘
```

### Database tables

The application uses these main tables:

| Table | Purpose |
|---|---|
| `users` | Stores registered users and their global roles |
| `projects` | Stores projects |
| `project_members` | Connects users to projects and stores project-specific roles |
| `user_stories` | Stores user stories belonging to projects |
| `tasks` | Stores tasks belonging to user stories |
| `comments` | Stores task-level discussions |
| `time_logs` | Stores time recorded against tasks |
| `notifications` | Stores user notifications and references to related work items |
| `activity_logs` | Stores project activity/audit history |

### Important relationships

```text
projects.id
     ↑
user_stories.project_id

user_stories.id
     ↑
tasks.story_id

users.id
     ↑
tasks.assigned_to

users.id
     ↑
tasks.created_by

tasks.id
     ↑
comments.task_id

tasks.id
     ↑
time_logs.task_id
```

Every User Story belongs to a Project, and every Task belongs to a User Story. This keeps the Project → User Story → Task hierarchy intact.

A complete explanation of all tables, fields, foreign keys, roles, enums, relationships, and example data flow is available in:

**[Database Schema](docs/DATABASE_SCHEMA.md)**

---

## 5. Roles and Permissions

TeamFlow has three application-level roles.

| Role | Main permissions |
|---|---|
| **Manager** | Create/delete projects, manage project members, and manage all project work |
| **Team Leader** | Create/edit/delete stories and tasks in projects they lead, manage members, and assign tasks |
| **Member** | View projects they belong to, update assigned task status, work through the Kanban board, and participate in task discussions |

There are also project-level roles:

```text
OWNER
TEAM_LEADER
MEMBER
```

The distinction is intentional:

```text
users.role
      ↓
User's general application role

project_members.role
      ↓
User's role inside a particular project
```

Permissions are checked on the backend. Hiding a button in the React frontend is only a user-experience feature; it is not treated as a security boundary.

---


## Role-Based Access and Work Verification

TeamFlow has three roles: **Manager, Team Leader, and Member**. The **Manager** creates and manages projects, manages project members, oversees the overall project, and performs the **final review and approval of the project**. The **Team Leader** manages the development work by creating User Stories and Tasks, assigning Tasks to Members, monitoring progress, and reviewing completed Tasks. **Members** work on their assigned Tasks, update their progress, add comments, and log their working time.

The work follows a verification-based workflow. When a **Member completes a Task**, it is submitted for review. The **Team Leader reviews and verifies the Task** and can approve it as `DONE` or send it back to the Member for changes. Once the Tasks under a User Story are completed and verified, the **Team Leader or Manager reviews the User Story**. After all required User Stories and Tasks are completed, the **Manager performs the final project review and approval** and marks the Project as completed.

```text
Manager
   │
   ├── Creates & manages Project
   │
   ▼
Team Leader
   │
   ├── Creates User Stories
   ├── Creates & assigns Tasks
   └── Reviews Tasks
          │
          ▼
       Member
          │
          └── Completes assigned Task
                    │
                    ▼
                IN_REVIEW
                    │
             Team Leader reviews
               ┌────┴────┐
               ▼         ▼
             DONE     Changes
                         │
                         ▼
                  Member updates
                    and resubmits
                         │
                         ▼
              User Story completed
                         │
                         ▼
               Manager reviews
                  final Project
                         │
                         ▼
                PROJECT APPROVED
                         │
                         ▼
                 PROJECT COMPLETED
```

This provides a clear chain of responsibility: **Members complete the work → Team Leaders verify the work → the Manager performs the final project review and approval.**


## 6. API Documentation

FastAPI automatically generates interactive API documentation from the actual routes and Pydantic schemas.

### Swagger UI

```text
https://teamflow-backend-41oe.onrender.com/docs
```

For local development:

```text
http://localhost:8000/docs
```

### ReDoc

```text
https://teamflow-backend-41oe.onrender.com/redoc
```

### OpenAPI specification

```text
https://teamflow-backend-41oe.onrender.com/openapi.json
```

### Manual API documentation

The repository also contains a human-readable API reference:

**[API Documentation](docs/API_DOCUMENTATION.md)**

### Main API areas

| Area | Examples |
|---|---|
| Authentication | Register, login, current user, profile update, users |
| Projects | Create, list, view, update, delete, hierarchy, members |
| User Stories | Create, list, view, update, delete |
| Tasks | Create, list, view, update, delete, status, assignment, assigned tasks, Kanban |
| Comments | Add, list, update, delete |
| Notifications | List, unread count, mark read, mark all read, delete |
| Dashboard | Statistics and activity |
| AI Assistant | Project and website-related questions |

Protected APIs use:

```http
Authorization: Bearer <JWT>
```

---

## 7. Async / Background Workflow

The assignment requires at least one asynchronous/background workflow.

TeamFlow implements this using:

```text
backend/app/workers/due_date_worker.py
```

The worker is started with:

```text
asyncio.create_task()
```

inside the FastAPI lifespan.

### How it works

```text
FastAPI starts
      ↓
Background worker starts
      ↓
Every 24 hours
      ↓
Check tasks due tomorrow
      ↓
Ignore completed tasks
      ↓
Create TASK_DUE_SOON notification
      ↓
Avoid duplicate notifications
```

The worker runs in the background without blocking normal API requests.

### Failure handling

The task scan is wrapped in exception handling.

If one scan fails:

```text
Worker error
    ↓
Error is logged
    ↓
Database session is closed
    ↓
Worker remains alive
    ↓
Next 24-hour cycle runs again
```

Each execution creates and closes its own database session so a failed run does not leave a database connection open.

### Retry approach

This implementation does not use a separate retry queue.

Instead, the worker repeatedly checks the current database state. Therefore, if one scan is missed, the next scheduled scan can detect the same task again and create the required notification.

For a larger production system, this could be replaced with a durable task queue such as Celery + Redis or an outbox-based design with retry and dead-letter handling.

---

## 8. Notifications and Collaboration

TeamFlow includes task-level collaboration.

### Comments

A task can contain a discussion thread:

```text
Task
 └── Comments
       ├── User 1
       ├── User 2
       └── User 3
```

Comments contain:

- Task
- User
- Content
- Creation time
- Update time

This allows the team to discuss work directly inside the relevant task.

### Time tracking

Team members can also log time against tasks.

```text
Task
 └── Time Logs
       ├── User
       ├── Hours
       ├── Description
       └── Logged time
```

### Notifications

Notifications can be connected to:

- Projects
- User Stories
- Tasks
- Users

Examples include:

- Task assigned
- Task status changed
- Task due soon
- Task overdue
- Comment added
- Project added
- Project status changed
- Task submitted for review
- Task approved
- Project completed

---

## 9. Kanban Board

Tasks can be managed through a Kanban-style workflow.

The task status flow is:

```text
TODO
  ↓
IN_PROGRESS
  ↓
IN_REVIEW
  ↓
DONE
```

The frontend provides a visual Kanban interface, while the backend exposes APIs for task status updates.

The server validates the update, so the frontend is not trusted to enforce permissions by itself.

---

## 10. Dashboard and Reporting

The dashboard provides an overview of the current work.

It includes information such as:

- Project statistics
- Task statistics
- Recent activity
- Work progress
- Assigned work

The backend exposes dashboard endpoints for statistics and activity so the frontend does not have to calculate everything from raw data.

---

## 11. AI Project Assistant

TeamFlow also includes an AI Project Assistant powered by **Groq Api**.

The assistant is designed for two types of questions:

### 1. Questions about using TeamFlow

For example:

```text
How do I create a project?
How do I assign a task?
What can a Team Leader do?
How does the Kanban board work?
How do I add a comment?
```

The assistant uses the TeamFlow knowledge base for these questions.

### 2. Questions about actual project data

For example:

```text
What are my pending tasks?
What is the progress of my project?
Who is assigned to the login task?
What tasks are currently in review?
```

The backend builds the context using the authenticated user's authorized project data.

### Architecture

```text
React AI Chatbot
       │
       │ POST /api/chat
       │ Bearer JWT
       ▼
FastAPI Backend
       │
       ├── Authenticate user
       │
       ├── Check project access
       │
       ├── Build authorized database context
       │
       └── Add TeamFlow knowledge base
       │
       ▼
Groq API
       │
       ▼
FastAPI
       │
       ▼
React Chatbot
```

### Security

The Groq API key stays on the backend.

It must be provided through an environment variable:

```env
GROQ_API_KEY=your-groq-api-key
```

Do **not** put a real API key in this README or commit it to GitHub.

The model is configurable through:

```env
GROQ_MODEL=llama-3.3-70b-versatile
```

### Authorization

The chatbot does not simply receive every project in the database.

The backend first checks the authenticated user and builds context only from projects the user is allowed to access.

The intended access model is:

```text
Manager
   ↓
All projects

Team Leader / Member
   ↓
Only projects they belong to
```

If a user asks about a project they are not authorized to access, the backend should not provide that project's private information.

---

## 12. AI Usage

AI tools were used during development as development assistance.

They were used for areas such as:

- FastAPI router/model/schema scaffolding
- React component and page structure
- Async worker implementation
- Documentation drafting
- Debugging and development support

The main architecture and implementation decisions were reviewed and adapted during development.

Important decisions include:

- FastAPI instead of Flask for native async support and automatic API documentation
- JWT-based authentication
- Role-based server-side authorization
- Project → User Story → Task relational structure
- SQLite for local development
- PostgreSQL for Render production
- Environment variables for deployment configuration
- Backend-only storage of the Groq API key
- Authorized project context for the AI assistant

The overall application architecture, database relationships, API structure, authorization rules, feature decisions, and technology choices were reviewed and adapted based on the requirements of the project.

AI-generated suggestions were not treated as a substitute for understanding or verification. Implementations were tested against the application requirements and adjusted where necessary to fit the project's existing codebase and design.

The use of AI was intended as a development aid, while the final implementation and engineering decisions were reviewed as part of the development process.
---

## 13. Security Considerations

Several security practices are included in the project.

### Password security

Passwords are hashed using bcrypt and are not stored in plaintext.

### JWT authentication

Protected API routes validate JWT access tokens.

The token contains the authenticated user's identity and expires according to:

```env
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Server-side authorization

Role and project membership checks are performed by the backend.

The frontend is not considered a security boundary.

### CORS

CORS is configured using an explicit allow-list through:

```env
FRONTEND_URL
CORS_ORIGINS
```

rather than allowing every origin with `*`.

### SQL injection protection

Database operations use SQLAlchemy ORM and parameterized queries instead of building SQL statements from raw user input.

### Secret management

Environment variables are used for secrets such as:

```text
SECRET_KEY
GROQ_API_KEY
DATABASE_URL
```

`.env` files should never be committed to GitHub.

### Known limitations

For a real production system, I would additionally consider:

- Rate limiting for login to reduce brute-force attempts
- Email verification
- Password reset
- JWT revocation/blocklist
- Short-lived access tokens with refresh tokens
- HTTPS enforcement at the application level
- More comprehensive automated security testing

These are intentionally documented rather than hidden because the project is designed as an internship-scale application.

---

## 14. Local Setup

### Prerequisites

- Python 3.11
- Node.js 20+
- npm
- Optional: Docker and Docker Compose

### Clone the repository

```bash
git clone https://github.com/girijadevi6/Teamflow-Project-Management-Tool.git
cd Teamflow-Project-Management-Tool
```

### Backend setup

```bash
cd backend
python3.11 -m venv venv
```

Activate the environment.

Windows:

```bash
venv\Scripts\activate
```

Linux/macOS:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the environment file:

```bash
cp ../.env.example .env
```

On Windows, you can copy the file manually if `cp` is unavailable.

Add your own Groq API key if you want to use the AI Assistant:

```env
GROQ_API_KEY=your-groq-api-key
```

Run the seed script:

```bash
python seed_data.py
```

This creates the local SQLite database and demo data.

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

### Frontend setup

Open another terminal:

```bash
cd frontend
npm install
```

Create the frontend environment file:

```bash
cp .env.example .env
```

The local API URL should point to:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

A successful login redirects the user to the dashboard.

---

## 15. Running with Docker Compose

Docker Compose can start the frontend and backend together.

From the project root:

```bash
docker compose up --build
```

The services will be available at:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8000
Swagger:  http://localhost:8000/docs
```

SQLite is persisted through the Docker volume configured in `docker-compose.yml`.

---

## 16. Demo Accounts

The seed script creates demo accounts using the following password:

```text
password123
```

| Role | Email |
|---|---|
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

The project also contains `CREDENTIALS.md` with additional information about the demo project memberships.

**These credentials are for demonstration only and should not be used as real production credentials.**

---

## 17. Deployment to Render

The repository includes a `render.yaml` Blueprint.

It is configured to provision:

```text
Render PostgreSQL
       │
       ├── FastAPI Backend
       │
       └── React Frontend
```

### Deployment steps

1. Push the repository to GitHub.
2. Open Render.
3. Choose **New → Blueprint**.
4. Select the GitHub repository.
5. Render reads `render.yaml`.
6. Apply the Blueprint.
7. Render creates the database, backend, and frontend.
8. Check the URLs assigned to both web services.

After deployment, make sure these environment variables contain the actual production URLs:

### Backend

```env
FRONTEND_URL=https://teamflow-frontend-kjdl.onrender.com
CORS_ORIGINS=https://teamflow-frontend-kjdl.onrender.com
```

### Frontend

```env
VITE_API_URL=https://teamflow-backend-41oe.onrender.com
```

Because Vite environment variables are included during the frontend build, the frontend must be rebuilt/redeployed after changing `VITE_API_URL`.

### Production database

The production deployment uses PostgreSQL.

This is important because Render web services have an ephemeral filesystem. A SQLite database stored inside the application container could be lost when the service restarts or redeploys.

The backend supports both:

```text
Local
SQLite

Production
PostgreSQL
```

without requiring separate application code.

The free Render PostgreSQL plan has a limited lifetime, so a longer-running deployment may require upgrading the database plan or using another PostgreSQL provider.

The backend seed process runs during deployment so the demo accounts can be created automatically.

---
## 18. Production URLs

Frontend:  
[TeamFlow Application](https://teamflow-frontend-kjdl.onrender.com)

Backend:  
[TeamFlow API](https://teamflow-backend-41oe.onrender.com)

Swagger:  
[Swagger UI](https://teamflow-backend-41oe.onrender.com/docs)

ReDoc:  
[ReDoc](https://teamflow-backend-41oe.onrender.com/redoc)

OpenAPI:  
[OpenAPI Specification](https://teamflow-backend-41oe.onrender.com/openapi.json)

---
Note: The PostgreSQL database is currently hosted using Render's free/trial offering. The database may expire after the applicable trial period, so the live application may become unavailable after that period.

## 19. Design Decisions and Trade-offs

### FastAPI

Chosen because it provides automatic OpenAPI documentation and native async support.

### SQLite locally

SQLite is simple to configure and is sufficient for local development and a small-team assignment.

### PostgreSQL in production

PostgreSQL is more appropriate for a deployed application and avoids relying on Render's ephemeral service filesystem.

### SQLAlchemy

SQLAlchemy keeps database access organized through models and relationships and supports both SQLite and PostgreSQL.

### `asyncio` background worker

The assignment only requires one asynchronous/background workflow. An `asyncio` worker keeps the implementation simple and avoids introducing Redis and Celery for a small application.

The trade-off is that the worker lives inside the API process. A production system with many jobs would benefit from a durable task queue.

### `create_all()` instead of migrations

The current project creates tables automatically for simplicity. For a larger application, Alembic migrations would be preferable so schema changes can be applied safely without recreating the database.

### Server-side authorization

Authorization is implemented on the backend rather than relying on frontend UI restrictions. This is important because a user can bypass frontend controls by calling an API directly.

---

## 20. What I Would Improve / Build Next

With more development time, I would improve the application in the following areas:

### Background processing

Move the current `asyncio` worker to a durable task queue such as:

```text
Celery + Redis
```

or an outbox-based system.

This would allow:

- Persistent jobs
- Retry policies
- Exponential backoff
- Better failure recovery
- Dead-letter handling
- Multiple workers

### API improvements

Add:

- Pagination
- Server-side filtering
- Better search
- Sorting
- More granular API permissions

The current implementation is appropriate for a small team, but large projects with hundreds or thousands of work items would need more efficient list APIs.

### Authentication improvements

Add:

- Refresh tokens
- Password reset
- Email verification
- Login rate limiting
- JWT revocation

### Database improvements

Replace automatic `create_all()` schema creation with Alembic migrations.

### Testing

Add automated tests using:

```text
pytest
httpx
test database
```

and frontend tests for:

- Authentication
- Protected routes
- Kanban interactions
- Task updates
- Comments
- Notifications

### Frontend improvements

Add optimistic updates to the Kanban board so UI changes feel immediate rather than waiting for every PATCH request.

---

## 21. Assignment Requirement Mapping

| Assignment Requirement | TeamFlow Implementation |
|---|---|
| Frontend application | React + TypeScript + Vite |
| Backend APIs | FastAPI REST APIs |
| Persistent storage | SQLite locally, PostgreSQL in production |
| Project → User Story → Task | Relational SQLAlchemy models and foreign keys |
| Create, view, update, organize data | Project, story, task and membership APIs |
| Asynchronous/background workflow | FastAPI lifespan + `asyncio` due-date worker |
| Failure handling | Exception handling, logging, session cleanup, recurring self-healing scan |
| API documentation | Swagger UI, ReDoc, OpenAPI JSON, manual API documentation |
| README | This document |
| Database schema | `docs/DATABASE_SCHEMA.md` |
| Architecture notes | README + project structure + design decisions |
| Security considerations | JWT, bcrypt, RBAC, CORS, SQLAlchemy, environment variables |
| AI usage note | Section 12 |
| Future improvements | Section 20 |
| Optional demo | Production deployment URL in Section 18 |
| Optional walkthrough | Can be added to Section 18 |

---

## 22. Documentation

The repository contains separate documentation for the two areas that need more detail.

### API documentation

**[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)**

Contains:

- API endpoints
- HTTP methods
- Authentication
- Parameters
- Request bodies
- Response models
- Status codes
- Data schemas

### Database documentation

**[docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)**

Contains:

- All database tables
- Columns and data types
- Primary keys
- Foreign keys
- Relationships
- Project → User Story → Task hierarchy
- Project membership
- Comments
- Time logs
- Notifications
- Activity logs
- Role structure
- Cascade relationships
- Example data flow

---

## 23. Final Notes

TeamFlow was designed as a small-team agile project management application, but the implementation also considers what would be required to move toward a larger production system.

The main focus was to keep the application understandable while still demonstrating:

- Full-stack development
- REST API design
- Relational database modeling
- Authentication and authorization
- Asynchronous processing
- Error/failure handling
- API documentation
- Security awareness
- Deployment
- AI integration
- Clear engineering trade-offs
