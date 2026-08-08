# TeamFlow Database Schema

This document describes the database structure used by TeamFlow, the relationships between the tables, and how the main Project → User Story → Task hierarchy is implemented.

## 1. Database Overview

TeamFlow uses a relational database through SQLAlchemy ORM.

The main work hierarchy is:

```text
User
  │
  ├── creates
  │
  ▼
Project
  │
  ├── has Project Members
  │
  ├── contains User Stories
  │       │
  │       └── contains Tasks
  │               │
  │               ├── Comments
  │               └── Time Logs
  │
  └── has Activity Logs
```

Notifications connect users to projects, stories, and tasks when an event needs to be shown to a user.

---

## 2. Tables in the Database

The application defines these database tables:

1. `users`
2. `projects`
3. `project_members`
4. `user_stories`
5. `tasks`
6. `comments`
7. `time_logs`
8. `notifications`
9. `activity_logs`

---

# 3. Entity Relationship Overview

```text
                         ┌──────────────┐
                         │    users     │
                         └──────┬───────┘
                                │
                ┌───────────────┼────────────────────┐
                │               │                    │
                ▼               ▼                    ▼
        ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
        │   projects   │    │    tasks     │   │notifications │
        └──────┬───────┘    └──────┬───────┘   └──────────────┘
               │                   │
        ┌──────┴───────┐           ├──────────────┐
        │              │           │              │
        ▼              ▼           ▼              ▼
┌──────────────  ┐ ┌──────────────┐ ┌───────────┐ ┌─────────────┐
│project_members │ │ user_stories │ │ comments  │ │  time_logs  │
└──────────────  ┘ └──────┬───────┘ └───────────┘ └─────────────┘
                        │
                        ▼
                    ┌────────┐
                    │ tasks  │
                    └────────┘

projects ───────────────► activity_logs
users ──────────────────► activity_logs
```

---

# 4. Main Agile Hierarchy

The assignment requires the application to clearly model:

```text
Project → User Story → Task
```

TeamFlow implements this using foreign keys.

```text
projects
    │
    │ project_id
    ▼
user_stories
    │
    │ story_id
    ▼
tasks
```

### Project → User Story

Each `user_stories.project_id` references `projects.id`.

This means:

- A Project can contain multiple User Stories.
- Every User Story belongs to one Project.
- A User Story cannot exist without a Project.

### User Story → Task

Each `tasks.story_id` references `user_stories.id`.

This means:

- A User Story can contain multiple Tasks.
- Every Task belongs to one User Story.
- A Task cannot exist without a User Story.

This is the central hierarchy used by the application.

---

# 5. `users`

Stores all registered TeamFlow users.

| Column | Type | Required | Description |
|---|---|---:|---|
| `id` | Integer | Yes | Primary key |
| `name` | String(100) | Yes | User's display/name |
| `email` | String(255) | Yes | Unique login email |
| `password_hash` | String(255) | Yes | Hashed password |
| `role` | Enum | Yes | MANAGER, TEAM_LEADER, or MEMBER |
| `avatar_color` | String(20) | Yes | Color used for the UI avatar |
| `created_at` | DateTime | No | Account creation time |
| `updated_at` | DateTime | No | Last update time |

### Relationships

```text
users
 ├── project_memberships → project_members
 ├── created_projects    → projects
 ├── assigned_tasks      → tasks
 ├── notifications       → notifications
 └── activity_logs       → activity_logs
```

### User roles

```text
MANAGER
TEAM_LEADER
MEMBER
```

---

# 6. `projects`

Stores the projects managed in TeamFlow.

| Column | Type | Required | Description |
|---|---|---:|---|
| `id` | Integer | Yes | Primary key |
| `name` | String(200) | Yes | Project name |
| `description` | Text | No | Project description |
| `status` | Enum | Yes | Current project status |
| `priority` | Enum | Yes | LOW, MEDIUM, HIGH, or URGENT |
| `deadline` | Date | No | Project deadline |
| `created_by` | Integer | Yes | FK → `users.id` |
| `created_at` | DateTime | No | Creation time |
| `updated_at` | DateTime | No | Last update time |

### Project statuses

```text
PLANNING
ACTIVE
PENDING
PENDING_REVIEW
ON_HOLD
COMPLETED
ARCHIVED
```

### Relationships

```text
projects
 ├── created_by_user → users
 ├── members         → project_members
 ├── stories         → user_stories
 └── activity_logs   → activity_logs
```

---

# 7. `project_members`

Connects users to projects and stores their project-specific role.

This is a junction/association table between `users` and `projects`.

| Column | Type | Required | Description |
|---|---|---:|---|
| `id` | Integer | Yes | Primary key |
| `project_id` | Integer | Yes | FK → `projects.id` |
| `user_id` | Integer | Yes | FK → `users.id` |
| `role` | Enum | Yes | OWNER, TEAM_LEADER, or MEMBER |
| `joined_at` | DateTime | No | Time the member joined |

### Relationship

```text
users
   │
   └──── project_members ──── projects
```

This allows one user to belong to multiple projects and one project to have multiple users.

### Project member roles

```text
OWNER
TEAM_LEADER
MEMBER
```

Note that the application has both a global user role (`users.role`) and a project-level role (`project_members.role`).

---

# 8. `user_stories`

Stores User Stories belonging to projects.

| Column | Type | Required | Description |
|---|---|---:|---|
| `id` | Integer | Yes | Primary key |
| `project_id` | Integer | Yes | FK → `projects.id` |
| `title` | String(300) | Yes | Story title |
| `description` | Text | No | Story description |
| `priority` | Enum | Yes | LOW, MEDIUM, HIGH, or URGENT |
| `status` | Enum | Yes | TODO, IN_PROGRESS, or DONE |
| `created_by` | Integer | Yes | FK → `users.id` |
| `created_at` | DateTime | No | Creation time |
| `updated_at` | DateTime | No | Last update time |

### Story statuses

```text
TODO
IN_PROGRESS
DONE
```

### Relationships

```text
projects
    │
    └── user_stories
             │
             └── tasks

users
    │
    └── created_by
             │
             └── user_stories
```

---

# 9. `tasks`

Tasks are the lowest-level work items in the main agile hierarchy.

Each Task belongs to exactly one User Story.

| Column | Type | Required | Description |
|---|---|---:|---|
| `id` | Integer | Yes | Primary key |
| `story_id` | Integer | Yes | FK → `user_stories.id` |
| `title` | String(300) | Yes | Task title |
| `description` | Text | No | Task description |
| `status` | Enum | Yes | Current task status |
| `priority` | Enum | Yes | LOW, MEDIUM, HIGH, or URGENT |
| `assigned_to` | Integer | No | FK → `users.id`; assigned team member |
| `due_date` | Date | No | Task deadline |
| `story_points` | Integer | No | Agile story-point estimate |
| `estimated_hours` | Float | No | Estimated effort |
| `logged_hours` | Float | No | Total logged effort |
| `created_by` | Integer | Yes | FK → `users.id` |
| `created_at` | DateTime | No | Creation time |
| `updated_at` | DateTime | No | Last update time |

### Task statuses

```text
TODO
IN_PROGRESS
IN_REVIEW
DONE
```

### Task priority

```text
LOW
MEDIUM
HIGH
URGENT
```

### Relationships

```text
user_stories
      │
      └── tasks
             │
             ├── assigned_to → users
             ├── created_by  → users
             ├── comments    → comments
             └── time_logs   → time_logs
```

This table is the center of several collaboration features.

---

# 10. `comments`

Stores comments made on Tasks.

| Column | Type | Required | Description |
|---|---|---:|---|
| `id` | Integer | Yes | Primary key |
| `task_id` | Integer | Yes | FK → `tasks.id` |
| `user_id` | Integer | Yes | FK → `users.id` |
| `content` | Text | Yes | Comment content |
| `created_at` | DateTime | No | Comment creation time |
| `updated_at` | DateTime | No | Last edit time |

### Relationships

```text
tasks
  │
  └── comments
         │
         └── user → users
```

This supports task-level collaboration. Team members can discuss the work directly on the task.

---

# 11. `time_logs`

Stores time recorded against Tasks.

| Column | Type | Required | Description |
|---|---|---:|---|
| `id` | Integer | Yes | Primary key |
| `task_id` | Integer | Yes | FK → `tasks.id` |
| `user_id` | Integer | Yes | FK → `users.id` |
| `hours` | Float | Yes | Number of hours logged |
| `description` | Text | No | Description of the work |
| `logged_at` | DateTime | No | Time the entry was created |

### Relationships

```text
tasks
  │
  └── time_logs
         │
         └── user → users
```

A task can have multiple time-log entries, and each entry records which user logged the time.

---

# 12. `notifications`

Stores notifications shown to users.

| Column | Type | Required | Description |
|---|---|---:|---|
| `id` | Integer | Yes | Primary key |
| `user_id` | Integer | Yes | FK → `users.id` |
| `type` | Enum | Yes | Notification event type |
| `title` | String(200) | Yes | Notification title |
| `message` | Text | Yes | Notification message |
| `is_read` | Boolean | No | Whether the notification was read |
| `related_project_id` | Integer | No | FK → `projects.id` |
| `related_task_id` | Integer | No | FK → `tasks.id` |
| `related_story_id` | Integer | No | FK → `user_stories.id` |
| `created_at` | DateTime | No | Notification creation time |

### Notification relationships

```text
users
  │
  └── notifications
          │
          ├── related_project_id → projects
          ├── related_task_id    → tasks
          └── related_story_id   → user_stories
```

The related IDs allow a notification to point back to the work item that caused the event.

### Notification types

```text
TASK_ASSIGNED
TASK_STATUS_CHANGED
TASK_DUE_SOON
TASK_OVERDUE
STORY_COMPLETED
PROJECT_ADDED
PROJECT_STATUS_CHANGED
PROJECT_DEADLINE_APPROACHING
COMMENT_ADDED
TASK_COMMENTED
TASK_UNASSIGNED
TASK_SUBMITTED_FOR_REVIEW
TASK_CHANGES_REQUESTED
TASK_APPROVED
PROJECT_SUBMITTED_FOR_REVIEW
PROJECT_CHANGES_REQUESTED
PROJECT_COMPLETED
DAILY_DIGEST
URGENT_TASK_ASSIGNED
TASK_URGENT_DUE
URGENT_TASK_DUE_SOON
```

---

# 13. `activity_logs`

Stores project-related activity history.

| Column | Type | Required | Description |
|---|---|---:|---|
| `id` | Integer | Yes | Primary key |
| `project_id` | Integer | No | FK → `projects.id` |
| `user_id` | Integer | Yes | FK → `users.id` |
| `action` | String(100) | Yes | Action that occurred |
| `entity_type` | String(50) | Yes | Entity involved, such as task/story/project |
| `entity_id` | Integer | No | ID of the affected entity |
| `entity_name` | String(300) | No | Name of the affected entity |
| `detail` | Text | No | Additional information |
| `created_at` | DateTime | No | Activity time |

### Relationships

```text
users
  │
  └── activity_logs
          │
          └── project_id → projects
```

Activity logs are useful for showing recent project activity and maintaining an audit-style history of actions.

---

# 14. Complete Relationship Map

The complete relational structure can be viewed as:

```text
                              ┌──────────────┐
                              │    USERS     │
                              └──────┬───────┘
                                     │
             ┌───────────────────────┼──────────────────────────┐
             │                       │                          │
             │                       │                          │
             ▼                       ▼                          ▼
    ┌────────────────┐       ┌───────────────┐        ┌────────────────┐
    │ PROJECT_MEMBERS│       │   PROJECTS    │        │  NOTIFICATIONS │
    └───────┬────────┘       └───────┬───────┘        └────────────────┘
            │                        │
            └────────────┬───────────┤
                         │           │
                         │           └──────────────► ACTIVITY_LOGS
                         │
                         ▼
                  ┌──────────────┐
                  │ USER_STORIES │
                  └──────┬───────┘
                         │
                         ▼
                    ┌─────────┐
                    │  TASKS  │
                    └────┬────┘
                         │
                 ┌───────┴────────┐
                 │                │
                 ▼                ▼
           ┌──────────┐     ┌───────────┐
           │ COMMENTS │     │ TIME_LOGS │
           └──────────┘     └───────────┘
                 │                │
                 └───────┬────────┘
                         │
                         ▼
                       USERS
```

---

# 15. Foreign Key Summary

| Table | Column | References |
|---|---|---|
| `projects` | `created_by` | `users.id` |
| `project_members` | `project_id` | `projects.id` |
| `project_members` | `user_id` | `users.id` |
| `user_stories` | `project_id` | `projects.id` |
| `user_stories` | `created_by` | `users.id` |
| `tasks` | `story_id` | `user_stories.id` |
| `tasks` | `assigned_to` | `users.id` |
| `tasks` | `created_by` | `users.id` |
| `comments` | `task_id` | `tasks.id` |
| `comments` | `user_id` | `users.id` |
| `time_logs` | `task_id` | `tasks.id` |
| `time_logs` | `user_id` | `users.id` |
| `notifications` | `user_id` | `users.id` |
| `notifications` | `related_project_id` | `projects.id` |
| `notifications` | `related_task_id` | `tasks.id` |
| `notifications` | `related_story_id` | `user_stories.id` |
| `activity_logs` | `project_id` | `projects.id` |
| `activity_logs` | `user_id` | `users.id` |

---

# 16. Example Data Flow

Suppose the manager creates a project:

```text
Project:
"TeamFlow Development"
```

The project is stored in:

```text
projects
```

Then the manager creates a User Story:

```text
User Story:
"User authentication"
```

It is stored in:

```text
user_stories
project_id = <TeamFlow Development ID>
```

Then a task is created:

```text
Task:
"Create Login API"
```

It is stored in:

```text
tasks
story_id = <User authentication ID>
assigned_to = <team member ID>
```

A team member can then add a comment:

```text
comments
task_id = <Create Login API ID>
user_id = <team member ID>
```

The member can also log work:

```text
time_logs
task_id = <Create Login API ID>
user_id = <team member ID>
hours = 2.5
```

The system can create a notification:

```text
notifications
user_id = <recipient ID>
related_task_id = <Create Login API ID>
type = TASK_ASSIGNED
```

And an action can be recorded:

```text
activity_logs
project_id = <TeamFlow Development ID>
user_id = <actor ID>
entity_type = "task"
entity_id = <Create Login API ID>
```

---

# 17. Why This Structure Fits the Agile Workflow

The database is organized around the workflow required by the project:

```text
Project
   ↓
User Story
   ↓
Task
   ↓
Task Collaboration
   ├── Comments
   └── Time Logs
```

Supporting project-management information is kept in separate tables:

```text
Users
Project Members
Notifications
Activity Logs
```

This keeps the main work hierarchy simple while allowing collaboration, permissions, notifications, reporting, and activity tracking to be added without putting unrelated information into the core `tasks` table.

---

# 18. Cascade Relationships

The ORM configuration defines cascading deletion for several child collections.

For example:

```text
Project
 └── User Stories
       └── Tasks
             ├── Comments
             └── Time Logs
```

The SQLAlchemy relationships use `cascade="all, delete-orphan"` for:

- Project → Project Members
- Project → User Stories
- User Story → Tasks
- Task → Comments
- Task → Time Logs

This means child ORM objects are managed together with their parent in these relationships.

---

# 19. Important Design Notes

### Global role vs project role

There are two levels of role information:

```text
users.role
```

represents the user's general application role:

```text
MANAGER
TEAM_LEADER
MEMBER
```

while:

```text
project_members.role
```

represents the user's role inside a particular project:

```text
OWNER
TEAM_LEADER
MEMBER
```

This allows the same user to participate in different projects with project-specific membership roles.

### Task assignment

A task can optionally be assigned to a user:

```text
tasks.assigned_to → users.id
```

This is separate from the user who created the task:

```text
tasks.created_by → users.id
```

Therefore, the system can distinguish:

```text
Who created the task?
        ↓
created_by

Who is responsible for the task?
        ↓
assigned_to
```

### Notifications

Notifications store references to the related project, story, or task rather than duplicating the complete work-item data.

### Activity history

Activity logs store the actor, action, entity type, entity ID, and optional details. This makes it possible to display project activity without changing the main work-item tables.

---

# 20. Source

This documentation is based on the current TeamFlow backend model definitions in:

```text
backend/app/models/
```

The database models currently define the nine tables listed above.
