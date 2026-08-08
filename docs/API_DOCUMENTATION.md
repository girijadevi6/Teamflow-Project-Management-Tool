# TeamFlow API Documentation

> Complete API reference generated from the TeamFlow FastAPI OpenAPI specification. This document covers every endpoint exposed by the uploaded application.

## 1. API Overview

- **API title:** TeamFlow API
- **Version:** 1.0.0
- **Framework:** FastAPI
- **API style:** REST/HTTP with JSON request and response bodies where applicable
- **Authentication:** HTTP Bearer token (JWT)

### Base URL

Local development:

```text
http://127.0.0.1:8000
```

Production:

```text
https://teamflow-backend-41oe.onrender.com
```

> If the deployment URL changes, replace the production base URL above. Endpoint paths below are relative to the base URL.

### Interactive documentation

- Swagger UI: `https://teamflow-backend-41oe.onrender.com/docs`
- ReDoc: `https://teamflow-backend-41oe.onrender.com/redoc`
- OpenAPI specification: `https://teamflow-backend-41oe.onrender.com/openapi.json`

## 2. Authentication

Protected endpoints use the `HTTPBearer` security scheme. Send the access token returned by `/auth/login` as:

```http
Authorization: Bearer <access_token>
```

Public endpoints in this specification are:

- `POST /auth/register`
- `POST /auth/login`
- `GET /` (health check)

All other endpoints require authentication according to the OpenAPI specification.

## 3. Common HTTP Status Codes

| Status | Meaning |
|---:|---|
| 200 | Request succeeded |
| 201 | Resource created successfully |
| 204 | Operation succeeded with no response body |
| 401 | Authentication required or invalid/expired credentials |
| 403 | Authenticated user is not allowed to perform the operation |
| 404 | Requested resource was not found |
| 409 | Conflict/business-rule violation, where implemented |
| 422 | Request validation failed |
| 500 | Unexpected server-side error |

> Exact non-success responses can vary by endpoint/business rule. FastAPI validation errors use the schemas documented at the end of this file.

## 4. Endpoint Summary

**Total documented paths:** 33
**Total HTTP operations:** 48

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| `GET` | `/` | Public | Health Check |
| `POST` | `/auth/login` | Public | Login |
| `GET` | `/auth/me` | Bearer JWT | Get Me |
| `PUT` | `/auth/me` | Bearer JWT | Update Me |
| `POST` | `/auth/register` | Public | Register |
| `GET` | `/auth/users` | Bearer JWT | List Users |
| `POST` | `/chat` | Bearer JWT | Chat With Assistant |
| `PUT` | `/comments/{comment_id}` | Bearer JWT | Update Comment Standalone |
| `DELETE` | `/comments/{comment_id}` | Bearer JWT | Delete Comment Standalone |
| `GET` | `/dashboard/activity` | Bearer JWT | Get Activity |
| `GET` | `/dashboard/stats` | Bearer JWT | Get Dashboard Stats |
| `GET` | `/notifications` | Bearer JWT | List Notifications |
| `PATCH` | `/notifications/mark-all-read` | Bearer JWT | Mark All Read |
| `PATCH` | `/notifications/mark-read` | Bearer JWT | Mark Read |
| `GET` | `/notifications/unread-count` | Bearer JWT | Unread Count |
| `DELETE` | `/notifications/{notification_id}` | Bearer JWT | Delete Notification |
| `GET` | `/projects` | Bearer JWT | List Projects |
| `POST` | `/projects` | Bearer JWT | Create Project |
| `GET` | `/projects/{project_id}` | Bearer JWT | Get Project |
| `PUT` | `/projects/{project_id}` | Bearer JWT | Update Project |
| `DELETE` | `/projects/{project_id}` | Bearer JWT | Delete Project |
| `GET` | `/projects/{project_id}/hierarchy` | Bearer JWT | Get Project Hierarchy |
| `GET` | `/projects/{project_id}/kanban` | Bearer JWT | Get Kanban |
| `POST` | `/projects/{project_id}/members` | Bearer JWT | Add Member |
| `PUT` | `/projects/{project_id}/members/{user_id}` | Bearer JWT | Update Member Role |
| `DELETE` | `/projects/{project_id}/members/{user_id}` | Bearer JWT | Remove Member |
| `PATCH` | `/projects/{project_id}/status` | Bearer JWT | Update Project Status |
| `GET` | `/projects/{project_id}/stories` | Bearer JWT | List Stories |
| `POST` | `/projects/{project_id}/stories` | Bearer JWT | Create Story |
| `GET` | `/reports/project/{project_id}` | Bearer JWT | Get Project Report |
| `GET` | `/reports/project/{project_id}/download` | Bearer JWT | Download Project Report |
| `GET` | `/stories/{story_id}` | Bearer JWT | Get Story |
| `PUT` | `/stories/{story_id}` | Bearer JWT | Update Story |
| `DELETE` | `/stories/{story_id}` | Bearer JWT | Delete Story |
| `GET` | `/stories/{story_id}/tasks` | Bearer JWT | List Tasks |
| `POST` | `/stories/{story_id}/tasks` | Bearer JWT | Create Task |
| `GET` | `/tasks/my/assigned` | Bearer JWT | Get My Tasks |
| `GET` | `/tasks/{task_id}` | Bearer JWT | Get Task |
| `PUT` | `/tasks/{task_id}` | Bearer JWT | Update Task |
| `DELETE` | `/tasks/{task_id}` | Bearer JWT | Delete Task |
| `PATCH` | `/tasks/{task_id}/assign` | Bearer JWT | Assign Task |
| `GET` | `/tasks/{task_id}/comments` | Bearer JWT | List Comments |
| `POST` | `/tasks/{task_id}/comments` | Bearer JWT | Create Comment |
| `PUT` | `/tasks/{task_id}/comments/{comment_id}` | Bearer JWT | Update Comment Nested |
| `DELETE` | `/tasks/{task_id}/comments/{comment_id}` | Bearer JWT | Delete Comment Nested |
| `PATCH` | `/tasks/{task_id}/status` | Bearer JWT | Update Task Status |
| `GET` | `/tasks/{task_id}/time-logs` | Bearer JWT | List Time Logs |
| `POST` | `/tasks/{task_id}/time-logs` | Bearer JWT | Create Time Log |

## 5. System

### `GET /`

**Summary:** Health Check

**Authentication:** Public

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `—` (application/json) |

---

## 6. Authentication & Users

### `POST /auth/login`

**Summary:** Login

**Authentication:** Public

#### Request Body

**Content-Type:** `application/json`

**Schema:** `LoginRequest`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `email` | `string (email)` | Yes | — | — |
| `password` | `string` | Yes | — | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `TokenResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`TokenResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `access_token` | `string` | Yes | — | — |
| `token_type` | `string` | No | default: `bearer` | — |
| `user` | `UserResponse` | Yes | — | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /auth/me`

**Summary:** Get Me

**Authentication:** Bearer JWT required

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `UserResponse` (application/json) |

#### Response model details

**`UserResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | Yes | — | — |
| `email` | `string (email)` | Yes | — | — |
| `id` | `integer` | Yes | — | — |
| `role` | `UserRole` | Yes | — | — |
| `avatar_color` | `string` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |

---

### `PUT /auth/me`

**Summary:** Update Me

**Authentication:** Bearer JWT required

#### Request Body

**Content-Type:** `application/json`

**Schema:** `UserUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | No | nullable | — |
| `avatar_color` | `string` | No | nullable | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `UserResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`UserResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | Yes | — | — |
| `email` | `string (email)` | Yes | — | — |
| `id` | `integer` | Yes | — | — |
| `role` | `UserRole` | Yes | — | — |
| `avatar_color` | `string` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `POST /auth/register`

**Summary:** Register

**Authentication:** Public

#### Request Body

**Content-Type:** `application/json`

**Schema:** `UserCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | Yes | — | — |
| `email` | `string (email)` | Yes | — | — |
| `password` | `string` | Yes | — | — |
| `role` | `object` | No | default: `MEMBER` | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `201` | Successful Response | `TokenResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`TokenResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `access_token` | `string` | Yes | — | — |
| `token_type` | `string` | No | default: `bearer` | — |
| `user` | `UserResponse` | Yes | — | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /auth/users`

**Summary:** List Users

List all users — used by manager/leaders to add members to projects.

**Authentication:** Bearer JWT required

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `array<UserResponse>` (application/json) |

---

## 7. AI Assistant

### `POST /chat`

**Summary:** Chat With Assistant

**Authentication:** Bearer JWT required

#### Request Body

**Content-Type:** `application/json`

**Schema:** `ChatRequest`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `message` | `string` | Yes | — | User prompt or question |
| `history` | `array<ChatMessage>` | No | default: `[]`; nullable | Recent conversation history |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `ChatResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`ChatResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `response` | `string` | Yes | — | AI assistant response message |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

## 8. Comments

### `PUT /comments/{comment_id}`

**Summary:** Update Comment Standalone

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `comment_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `CommentUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `content` | `string` | Yes | — | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `CommentResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`CommentResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `task_id` | `integer` | Yes | — | — |
| `user_id` | `integer` | Yes | — | — |
| `content` | `string` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `user` | `UserPublic` | Yes | — | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `DELETE /comments/{comment_id}`

**Summary:** Delete Comment Standalone

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `comment_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `204` | Successful Response | — |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

## 9. Dashboard

### `GET /dashboard/activity`

**Summary:** Get Activity

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `query` | `integer` | No | — |
| `limit` | `query` | `integer` | No | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `array<ActivityLogResponse>` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /dashboard/stats`

**Summary:** Get Dashboard Stats

**Authentication:** Bearer JWT required

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `DashboardStats` (application/json) |

#### Response model details

**`DashboardStats`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `total_projects` | `integer` | Yes | — | — |
| `active_projects` | `integer` | Yes | — | — |
| `pending_projects` | `integer` | Yes | — | — |
| `total_tasks` | `integer` | Yes | — | — |
| `completed_tasks` | `integer` | Yes | — | — |
| `in_progress_tasks` | `integer` | Yes | — | — |
| `overdue_tasks` | `integer` | Yes | — | — |
| `urgent_tasks` | `integer` | Yes | — | — |
| `total_story_points` | `integer` | Yes | — | — |
| `completed_story_points` | `integer` | Yes | — | — |
| `my_assigned_tasks` | `integer` | Yes | — | — |
| `recent_activity` | `array<ActivityLogResponse>` | No | default: `[]` | — |

---

## 10. Notifications

### `GET /notifications`

**Summary:** List Notifications

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `unread_only` | `query` | `boolean` | No | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `array<NotificationResponse>` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `PATCH /notifications/mark-all-read`

**Summary:** Mark All Read

**Authentication:** Bearer JWT required

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `—` (application/json) |

---

### `PATCH /notifications/mark-read`

**Summary:** Mark Read

**Authentication:** Bearer JWT required

#### Request Body

**Content-Type:** `application/json`

**Schema:** `NotificationMarkRead`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `notification_ids` | `array<integer>` | Yes | — | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `—` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /notifications/unread-count`

**Summary:** Unread Count

**Authentication:** Bearer JWT required

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `—` (application/json) |

---

### `DELETE /notifications/{notification_id}`

**Summary:** Delete Notification

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `notification_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `204` | Successful Response | — |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

## 11. Projects, Members & Kanban

### `GET /projects`

**Summary:** List Projects

**Authentication:** Bearer JWT required

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `array<ProjectSummary>` (application/json) |

---

### `POST /projects`

**Summary:** Create Project

**Authentication:** Bearer JWT required

#### Request Body

**Content-Type:** `application/json`

**Schema:** `ProjectCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | Yes | — | — |
| `description` | `string` | No | nullable | — |
| `status` | `object` | No | default: `PLANNING` | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `team_leader_id` | `integer` | No | nullable | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `201` | Successful Response | `ProjectResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`ProjectResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `name` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `ProjectStatus` | Yes | — | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `created_by` | `integer` | Yes | — | — |
| `created_by_user` | `UserPublic` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `members` | `array<ProjectMemberResponse>` | No | default: `[]` | — |
| `total_stories` | `integer` | No | default: `0`; nullable | — |
| `total_tasks` | `integer` | No | default: `0`; nullable | — |
| `completed_tasks` | `integer` | No | default: `0`; nullable | — |
| `progress` | `number` | No | default: `0.0`; nullable | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /projects/{project_id}`

**Summary:** Get Project

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `ProjectResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`ProjectResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `name` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `ProjectStatus` | Yes | — | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `created_by` | `integer` | Yes | — | — |
| `created_by_user` | `UserPublic` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `members` | `array<ProjectMemberResponse>` | No | default: `[]` | — |
| `total_stories` | `integer` | No | default: `0`; nullable | — |
| `total_tasks` | `integer` | No | default: `0`; nullable | — |
| `completed_tasks` | `integer` | No | default: `0`; nullable | — |
| `progress` | `number` | No | default: `0.0`; nullable | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `PUT /projects/{project_id}`

**Summary:** Update Project

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `ProjectUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | No | nullable | — |
| `description` | `string` | No | nullable | — |
| `status` | `ProjectStatus` | No | nullable | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `comment` | `string` | No | nullable | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `ProjectResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`ProjectResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `name` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `ProjectStatus` | Yes | — | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `created_by` | `integer` | Yes | — | — |
| `created_by_user` | `UserPublic` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `members` | `array<ProjectMemberResponse>` | No | default: `[]` | — |
| `total_stories` | `integer` | No | default: `0`; nullable | — |
| `total_tasks` | `integer` | No | default: `0`; nullable | — |
| `completed_tasks` | `integer` | No | default: `0`; nullable | — |
| `progress` | `number` | No | default: `0.0`; nullable | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `DELETE /projects/{project_id}`

**Summary:** Delete Project

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `204` | Successful Response | — |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /projects/{project_id}/hierarchy`

**Summary:** Get Project Hierarchy

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `ProjectHierarchy` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`ProjectHierarchy`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `name` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `ProjectStatus` | Yes | — | — |
| `stories` | `array<StoryHierarchy>` | No | default: `[]` | — |
| `total_tasks` | `integer` | No | default: `0` | — |
| `completed_tasks` | `integer` | No | default: `0` | — |
| `progress` | `number` | No | default: `0.0` | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /projects/{project_id}/kanban`

**Summary:** Get Kanban

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `object` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `POST /projects/{project_id}/members`

**Summary:** Add Member

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `AddMemberRequest`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `user_id` | `integer` | Yes | — | — |
| `role` | `object` | No | default: `MEMBER` | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `ProjectMemberResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`ProjectMemberResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `user` | `UserPublic` | Yes | — | — |
| `role` | `MemberRole` | Yes | — | — |
| `joined_at` | `string (date-time)` | Yes | — | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `PUT /projects/{project_id}/members/{user_id}`

**Summary:** Update Member Role

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |
| `user_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `UpdateMemberRoleRequest`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `role` | `MemberRole` | Yes | — | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `ProjectMemberResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`ProjectMemberResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `user` | `UserPublic` | Yes | — | — |
| `role` | `MemberRole` | Yes | — | — |
| `joined_at` | `string (date-time)` | Yes | — | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `DELETE /projects/{project_id}/members/{user_id}`

**Summary:** Remove Member

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |
| `user_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `204` | Successful Response | — |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `PATCH /projects/{project_id}/status`

**Summary:** Update Project Status

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `ProjectUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | No | nullable | — |
| `description` | `string` | No | nullable | — |
| `status` | `ProjectStatus` | No | nullable | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `comment` | `string` | No | nullable | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `ProjectResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`ProjectResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `name` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `ProjectStatus` | Yes | — | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `created_by` | `integer` | Yes | — | — |
| `created_by_user` | `UserPublic` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `members` | `array<ProjectMemberResponse>` | No | default: `[]` | — |
| `total_stories` | `integer` | No | default: `0`; nullable | — |
| `total_tasks` | `integer` | No | default: `0`; nullable | — |
| `completed_tasks` | `integer` | No | default: `0`; nullable | — |
| `progress` | `number` | No | default: `0.0`; nullable | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /projects/{project_id}/stories`

**Summary:** List Stories

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `array<StoryResponse>` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `POST /projects/{project_id}/stories`

**Summary:** Create Story

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `StoryCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `title` | `string` | Yes | — | — |
| `description` | `string` | No | nullable | — |
| `priority` | `object` | No | default: `MEDIUM` | — |
| `status` | `object` | No | default: `TODO` | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `201` | Successful Response | `StoryResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`StoryResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `project_id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `priority` | `Priority` | Yes | — | — |
| `status` | `StoryStatus` | Yes | — | — |
| `created_by` | `integer` | Yes | — | — |
| `created_by_user` | `UserPublic` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `tasks` | `array<TaskInStory>` | No | default: `[]` | — |
| `total_tasks` | `integer` | No | default: `0` | — |
| `completed_tasks` | `integer` | No | default: `0` | — |
| `progress` | `number` | No | default: `0.0` | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

## 12. Reports

### `GET /reports/project/{project_id}`

**Summary:** Get Project Report

Generate a project status report in JSON format.

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `—` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /reports/project/{project_id}/download`

**Summary:** Download Project Report

Generate and download a project status report as CSV.

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `project_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `—` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

## 13. User Stories

### `GET /stories/{story_id}`

**Summary:** Get Story

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `story_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `StoryResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`StoryResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `project_id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `priority` | `Priority` | Yes | — | — |
| `status` | `StoryStatus` | Yes | — | — |
| `created_by` | `integer` | Yes | — | — |
| `created_by_user` | `UserPublic` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `tasks` | `array<TaskInStory>` | No | default: `[]` | — |
| `total_tasks` | `integer` | No | default: `0` | — |
| `completed_tasks` | `integer` | No | default: `0` | — |
| `progress` | `number` | No | default: `0.0` | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `PUT /stories/{story_id}`

**Summary:** Update Story

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `story_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `StoryUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `title` | `string` | No | nullable | — |
| `description` | `string` | No | nullable | — |
| `priority` | `Priority` | No | nullable | — |
| `status` | `StoryStatus` | No | nullable | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `StoryResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`StoryResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `project_id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `priority` | `Priority` | Yes | — | — |
| `status` | `StoryStatus` | Yes | — | — |
| `created_by` | `integer` | Yes | — | — |
| `created_by_user` | `UserPublic` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `tasks` | `array<TaskInStory>` | No | default: `[]` | — |
| `total_tasks` | `integer` | No | default: `0` | — |
| `completed_tasks` | `integer` | No | default: `0` | — |
| `progress` | `number` | No | default: `0.0` | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `DELETE /stories/{story_id}`

**Summary:** Delete Story

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `story_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `204` | Successful Response | — |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /stories/{story_id}/tasks`

**Summary:** List Tasks

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `story_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `array<TaskResponse>` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `POST /stories/{story_id}/tasks`

**Summary:** Create Task

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `story_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `TaskCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `title` | `string` | Yes | — | — |
| `description` | `string` | No | nullable | — |
| `priority` | `object` | No | default: `MEDIUM` | — |
| `status` | `object` | No | default: `TODO` | — |
| `assigned_to` | `integer` | No | nullable | — |
| `due_date` | `string (date-time) | string (date) | string` | No | nullable | — |
| `story_points` | `integer` | No | default: `1` | — |
| `estimated_hours` | `number` | No | nullable | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `201` | Successful Response | `TaskResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`TaskResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `story_id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `TaskStatus` | Yes | — | — |
| `priority` | `Priority` | Yes | — | — |
| `assigned_to` | `integer` | Yes | nullable | — |
| `assignee` | `UserPublic` | No | nullable | — |
| `due_date` | `string (date-time) | string (date) | string` | No | nullable | — |
| `story_points` | `integer` | Yes | — | — |
| `estimated_hours` | `number` | No | nullable | — |
| `logged_hours` | `number` | No | default: `0.0` | — |
| `created_by` | `integer` | Yes | — | — |
| `creator` | `UserPublic` | No | nullable | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `story_title` | `string` | No | nullable | — |
| `project_id` | `integer` | No | nullable | — |
| `project_name` | `string` | No | nullable | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

## 14. Tasks, Comments & Time Logs

### `GET /tasks/my/assigned`

**Summary:** Get My Tasks

**Authentication:** Bearer JWT required

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `array<TaskResponse>` (application/json) |

---

### `GET /tasks/{task_id}`

**Summary:** Get Task

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `TaskResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`TaskResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `story_id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `TaskStatus` | Yes | — | — |
| `priority` | `Priority` | Yes | — | — |
| `assigned_to` | `integer` | Yes | nullable | — |
| `assignee` | `UserPublic` | No | nullable | — |
| `due_date` | `string (date-time) | string (date) | string` | No | nullable | — |
| `story_points` | `integer` | Yes | — | — |
| `estimated_hours` | `number` | No | nullable | — |
| `logged_hours` | `number` | No | default: `0.0` | — |
| `created_by` | `integer` | Yes | — | — |
| `creator` | `UserPublic` | No | nullable | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `story_title` | `string` | No | nullable | — |
| `project_id` | `integer` | No | nullable | — |
| `project_name` | `string` | No | nullable | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `PUT /tasks/{task_id}`

**Summary:** Update Task

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `TaskUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `title` | `string` | No | nullable | — |
| `description` | `string` | No | nullable | — |
| `priority` | `Priority` | No | nullable | — |
| `status` | `TaskStatus` | No | nullable | — |
| `assigned_to` | `integer` | No | nullable | — |
| `due_date` | `string (date-time) | string (date) | string` | No | nullable | — |
| `story_points` | `integer` | No | nullable | — |
| `estimated_hours` | `number` | No | nullable | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `TaskResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`TaskResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `story_id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `TaskStatus` | Yes | — | — |
| `priority` | `Priority` | Yes | — | — |
| `assigned_to` | `integer` | Yes | nullable | — |
| `assignee` | `UserPublic` | No | nullable | — |
| `due_date` | `string (date-time) | string (date) | string` | No | nullable | — |
| `story_points` | `integer` | Yes | — | — |
| `estimated_hours` | `number` | No | nullable | — |
| `logged_hours` | `number` | No | default: `0.0` | — |
| `created_by` | `integer` | Yes | — | — |
| `creator` | `UserPublic` | No | nullable | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `story_title` | `string` | No | nullable | — |
| `project_id` | `integer` | No | nullable | — |
| `project_name` | `string` | No | nullable | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `DELETE /tasks/{task_id}`

**Summary:** Delete Task

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `204` | Successful Response | — |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `PATCH /tasks/{task_id}/assign`

**Summary:** Assign Task

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `TaskAssignUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `assigned_to` | `integer` | No | nullable | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `TaskResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`TaskResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `story_id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `TaskStatus` | Yes | — | — |
| `priority` | `Priority` | Yes | — | — |
| `assigned_to` | `integer` | Yes | nullable | — |
| `assignee` | `UserPublic` | No | nullable | — |
| `due_date` | `string (date-time) | string (date) | string` | No | nullable | — |
| `story_points` | `integer` | Yes | — | — |
| `estimated_hours` | `number` | No | nullable | — |
| `logged_hours` | `number` | No | default: `0.0` | — |
| `created_by` | `integer` | Yes | — | — |
| `creator` | `UserPublic` | No | nullable | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `story_title` | `string` | No | nullable | — |
| `project_id` | `integer` | No | nullable | — |
| `project_name` | `string` | No | nullable | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /tasks/{task_id}/comments`

**Summary:** List Comments

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `array<CommentResponse>` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `POST /tasks/{task_id}/comments`

**Summary:** Create Comment

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `CommentCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `content` | `string` | Yes | — | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `201` | Successful Response | `CommentResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`CommentResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `task_id` | `integer` | Yes | — | — |
| `user_id` | `integer` | Yes | — | — |
| `content` | `string` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `user` | `UserPublic` | Yes | — | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `PUT /tasks/{task_id}/comments/{comment_id}`

**Summary:** Update Comment Nested

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |
| `comment_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `CommentUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `content` | `string` | Yes | — | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `CommentResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`CommentResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `task_id` | `integer` | Yes | — | — |
| `user_id` | `integer` | Yes | — | — |
| `content` | `string` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `user` | `UserPublic` | Yes | — | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `DELETE /tasks/{task_id}/comments/{comment_id}`

**Summary:** Delete Comment Nested

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |
| `comment_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `204` | Successful Response | — |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `PATCH /tasks/{task_id}/status`

**Summary:** Update Task Status

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `TaskStatusUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `status` | `TaskStatus` | Yes | — | — |
| `comment` | `string` | No | nullable | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `TaskResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`TaskResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `story_id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `TaskStatus` | Yes | — | — |
| `priority` | `Priority` | Yes | — | — |
| `assigned_to` | `integer` | Yes | nullable | — |
| `assignee` | `UserPublic` | No | nullable | — |
| `due_date` | `string (date-time) | string (date) | string` | No | nullable | — |
| `story_points` | `integer` | Yes | — | — |
| `estimated_hours` | `number` | No | nullable | — |
| `logged_hours` | `number` | No | default: `0.0` | — |
| `created_by` | `integer` | Yes | — | — |
| `creator` | `UserPublic` | No | nullable | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `story_title` | `string` | No | nullable | — |
| `project_id` | `integer` | No | nullable | — |
| `project_name` | `string` | No | nullable | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `GET /tasks/{task_id}/time-logs`

**Summary:** List Time Logs

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `200` | Successful Response | `array<TimeLogResponse>` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

### `POST /tasks/{task_id}/time-logs`

**Summary:** Create Time Log

**Authentication:** Bearer JWT required

#### Parameters

| Name | Location | Type | Required | Description |
|---|---|---|---:|---|
| `task_id` | `path` | `integer` | Yes | — |

#### Request Body

**Content-Type:** `application/json`

**Schema:** `TimeLogCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `hours` | `number` | Yes | — | — |
| `description` | `string` | No | nullable | — |

#### Responses

| Status | Description | Response schema |
|---:|---|---|
| `201` | Successful Response | `TimeLogResponse` (application/json) |
| `422` | Validation Error | `HTTPValidationError` (application/json) |

#### Response model details

**`TimeLogResponse`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `task_id` | `integer` | Yes | — | — |
| `user_id` | `integer` | Yes | — | — |
| `hours` | `number` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `logged_at` | `string (date-time)` | Yes | — | — |
| `user` | `UserPublic` | Yes | — | — |

**`HTTPValidationError`**

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |

---

## 14. Data Models & Enums

The following schemas are exposed by the uploaded OpenAPI specification. Request and response models used by endpoints above are defined here as a complete reference.

### `ActivityLogResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `project_id` | `integer` | Yes | nullable | — |
| `user` | `UserPublic` | Yes | — | — |
| `action` | `string` | Yes | — | — |
| `entity_type` | `string` | Yes | — | — |
| `entity_id` | `integer` | Yes | nullable | — |
| `entity_name` | `string` | Yes | nullable | — |
| `detail` | `string` | Yes | nullable | — |
| `created_at` | `string (date-time)` | Yes | — | — |


### `AddMemberRequest`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `user_id` | `integer` | Yes | — | — |
| `role` | `object` | No | default: `MEMBER` | — |


### `ChatMessage`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `role` | `string` | Yes | — | Role of the speaker: 'user' or 'assistant' |
| `content` | `string` | Yes | — | Message content |


### `ChatRequest`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `message` | `string` | Yes | — | User prompt or question |
| `history` | `array<ChatMessage>` | No | default: `[]`; nullable | Recent conversation history |


### `ChatResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `response` | `string` | Yes | — | AI assistant response message |


### `CommentCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `content` | `string` | Yes | — | — |


### `CommentResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `task_id` | `integer` | Yes | — | — |
| `user_id` | `integer` | Yes | — | — |
| `content` | `string` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `user` | `UserPublic` | Yes | — | — |


### `CommentUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `content` | `string` | Yes | — | — |


### `DashboardStats`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `total_projects` | `integer` | Yes | — | — |
| `active_projects` | `integer` | Yes | — | — |
| `pending_projects` | `integer` | Yes | — | — |
| `total_tasks` | `integer` | Yes | — | — |
| `completed_tasks` | `integer` | Yes | — | — |
| `in_progress_tasks` | `integer` | Yes | — | — |
| `overdue_tasks` | `integer` | Yes | — | — |
| `urgent_tasks` | `integer` | Yes | — | — |
| `total_story_points` | `integer` | Yes | — | — |
| `completed_story_points` | `integer` | Yes | — | — |
| `my_assigned_tasks` | `integer` | Yes | — | — |
| `recent_activity` | `array<ActivityLogResponse>` | No | default: `[]` | — |


### `HTTPValidationError`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `detail` | `array<ValidationError>` | No | — | — |


### `LoginRequest`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `email` | `string (email)` | Yes | — | — |
| `password` | `string` | Yes | — | — |


### `MemberRole`

**Enum values:**

| Value |
|---|
| `OWNER` |
| `TEAM_LEADER` |
| `MEMBER` |


### `NotificationMarkRead`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `notification_ids` | `array<integer>` | Yes | — | — |


### `NotificationResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `user_id` | `integer` | Yes | — | — |
| `type` | `NotificationType` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `message` | `string` | Yes | — | — |
| `is_read` | `boolean` | Yes | — | — |
| `related_project_id` | `integer` | Yes | nullable | — |
| `related_task_id` | `integer` | Yes | nullable | — |
| `related_story_id` | `integer` | Yes | nullable | — |
| `created_at` | `string (date-time)` | Yes | — | — |


### `NotificationType`

**Enum values:**

| Value |
|---|
| `TASK_ASSIGNED` |
| `TASK_STATUS_CHANGED` |
| `TASK_DUE_SOON` |
| `TASK_OVERDUE` |
| `STORY_COMPLETED` |
| `PROJECT_ADDED` |
| `PROJECT_STATUS_CHANGED` |
| `PROJECT_DEADLINE_APPROACHING` |
| `COMMENT_ADDED` |
| `TASK_COMMENTED` |
| `TASK_UNASSIGNED` |
| `TASK_SUBMITTED_FOR_REVIEW` |
| `TASK_CHANGES_REQUESTED` |
| `TASK_APPROVED` |
| `PROJECT_SUBMITTED_FOR_REVIEW` |
| `PROJECT_CHANGES_REQUESTED` |
| `PROJECT_COMPLETED` |
| `DAILY_DIGEST` |
| `URGENT_TASK_ASSIGNED` |
| `TASK_URGENT_DUE` |
| `URGENT_TASK_DUE_SOON` |


### `Priority`

**Enum values:**

| Value |
|---|
| `LOW` |
| `MEDIUM` |
| `HIGH` |
| `URGENT` |


### `ProjectCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | Yes | — | — |
| `description` | `string` | No | nullable | — |
| `status` | `object` | No | default: `PLANNING` | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `team_leader_id` | `integer` | No | nullable | — |


### `ProjectHierarchy`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `name` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `ProjectStatus` | Yes | — | — |
| `stories` | `array<StoryHierarchy>` | No | default: `[]` | — |
| `total_tasks` | `integer` | No | default: `0` | — |
| `completed_tasks` | `integer` | No | default: `0` | — |
| `progress` | `number` | No | default: `0.0` | — |


### `ProjectMemberResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `user` | `UserPublic` | Yes | — | — |
| `role` | `MemberRole` | Yes | — | — |
| `joined_at` | `string (date-time)` | Yes | — | — |


### `ProjectPriority`

**Enum values:**

| Value |
|---|
| `LOW` |
| `MEDIUM` |
| `HIGH` |
| `URGENT` |


### `ProjectResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `name` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `ProjectStatus` | Yes | — | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `created_by` | `integer` | Yes | — | — |
| `created_by_user` | `UserPublic` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `members` | `array<ProjectMemberResponse>` | No | default: `[]` | — |
| `total_stories` | `integer` | No | default: `0`; nullable | — |
| `total_tasks` | `integer` | No | default: `0`; nullable | — |
| `completed_tasks` | `integer` | No | default: `0`; nullable | — |
| `progress` | `number` | No | default: `0.0`; nullable | — |


### `ProjectStatus`

**Enum values:**

| Value |
|---|
| `PLANNING` |
| `ACTIVE` |
| `PENDING` |
| `PENDING_REVIEW` |
| `ON_HOLD` |
| `COMPLETED` |
| `ARCHIVED` |


### `ProjectSummary`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `name` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `ProjectStatus` | Yes | — | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `total_stories` | `integer` | No | default: `0` | — |
| `total_tasks` | `integer` | No | default: `0` | — |
| `completed_tasks` | `integer` | No | default: `0` | — |
| `progress` | `number` | No | default: `0.0` | — |
| `member_count` | `integer` | No | default: `0` | — |


### `ProjectUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | No | nullable | — |
| `description` | `string` | No | nullable | — |
| `status` | `ProjectStatus` | No | nullable | — |
| `priority` | `ProjectPriority` | No | nullable | — |
| `deadline` | `string (date)` | No | nullable | — |
| `comment` | `string` | No | nullable | — |


### `StoryCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `title` | `string` | Yes | — | — |
| `description` | `string` | No | nullable | — |
| `priority` | `object` | No | default: `MEDIUM` | — |
| `status` | `object` | No | default: `TODO` | — |


### `StoryHierarchy`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `priority` | `Priority` | Yes | — | — |
| `status` | `StoryStatus` | Yes | — | — |
| `tasks` | `array<TaskHierarchy>` | No | default: `[]` | — |
| `total_tasks` | `integer` | No | default: `0` | — |
| `completed_tasks` | `integer` | No | default: `0` | — |
| `progress` | `number` | No | default: `0.0` | — |


### `StoryResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `project_id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `priority` | `Priority` | Yes | — | — |
| `status` | `StoryStatus` | Yes | — | — |
| `created_by` | `integer` | Yes | — | — |
| `created_by_user` | `UserPublic` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `tasks` | `array<TaskInStory>` | No | default: `[]` | — |
| `total_tasks` | `integer` | No | default: `0` | — |
| `completed_tasks` | `integer` | No | default: `0` | — |
| `progress` | `number` | No | default: `0.0` | — |


### `StoryStatus`

**Enum values:**

| Value |
|---|
| `TODO` |
| `IN_PROGRESS` |
| `DONE` |


### `StoryUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `title` | `string` | No | nullable | — |
| `description` | `string` | No | nullable | — |
| `priority` | `Priority` | No | nullable | — |
| `status` | `StoryStatus` | No | nullable | — |


### `TaskAssignUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `assigned_to` | `integer` | No | nullable | — |


### `TaskCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `title` | `string` | Yes | — | — |
| `description` | `string` | No | nullable | — |
| `priority` | `object` | No | default: `MEDIUM` | — |
| `status` | `object` | No | default: `TODO` | — |
| `assigned_to` | `integer` | No | nullable | — |
| `due_date` | `string (date-time) | string (date) | string` | No | nullable | — |
| `story_points` | `integer` | No | default: `1` | — |
| `estimated_hours` | `number` | No | nullable | — |


### `TaskHierarchy`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `TaskStatus` | Yes | — | — |
| `priority` | `Priority` | Yes | — | — |
| `assignee` | `UserPublic` | Yes | nullable | — |
| `due_date` | `string (date)` | Yes | nullable | — |
| `story_points` | `integer` | Yes | — | — |


### `TaskInStory`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `status` | `string` | Yes | — | — |
| `priority` | `string` | Yes | — | — |
| `assignee` | `UserPublic` | No | nullable | — |
| `due_date` | `string (date)` | No | nullable | — |
| `story_points` | `integer` | No | default: `1` | — |


### `TaskResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `story_id` | `integer` | Yes | — | — |
| `title` | `string` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `status` | `TaskStatus` | Yes | — | — |
| `priority` | `Priority` | Yes | — | — |
| `assigned_to` | `integer` | Yes | nullable | — |
| `assignee` | `UserPublic` | No | nullable | — |
| `due_date` | `string (date-time) | string (date) | string` | No | nullable | — |
| `story_points` | `integer` | Yes | — | — |
| `estimated_hours` | `number` | No | nullable | — |
| `logged_hours` | `number` | No | default: `0.0` | — |
| `created_by` | `integer` | Yes | — | — |
| `creator` | `UserPublic` | No | nullable | — |
| `created_at` | `string (date-time)` | Yes | — | — |
| `updated_at` | `string (date-time)` | Yes | — | — |
| `story_title` | `string` | No | nullable | — |
| `project_id` | `integer` | No | nullable | — |
| `project_name` | `string` | No | nullable | — |


### `TaskStatus`

**Enum values:**

| Value |
|---|
| `TODO` |
| `IN_PROGRESS` |
| `IN_REVIEW` |
| `DONE` |


### `TaskStatusUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `status` | `TaskStatus` | Yes | — | — |
| `comment` | `string` | No | nullable | — |


### `TaskUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `title` | `string` | No | nullable | — |
| `description` | `string` | No | nullable | — |
| `priority` | `Priority` | No | nullable | — |
| `status` | `TaskStatus` | No | nullable | — |
| `assigned_to` | `integer` | No | nullable | — |
| `due_date` | `string (date-time) | string (date) | string` | No | nullable | — |
| `story_points` | `integer` | No | nullable | — |
| `estimated_hours` | `number` | No | nullable | — |


### `TimeLogCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `hours` | `number` | Yes | — | — |
| `description` | `string` | No | nullable | — |


### `TimeLogResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `task_id` | `integer` | Yes | — | — |
| `user_id` | `integer` | Yes | — | — |
| `hours` | `number` | Yes | — | — |
| `description` | `string` | Yes | nullable | — |
| `logged_at` | `string (date-time)` | Yes | — | — |
| `user` | `UserPublic` | Yes | — | — |


### `TokenResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `access_token` | `string` | Yes | — | — |
| `token_type` | `string` | No | default: `bearer` | — |
| `user` | `UserResponse` | Yes | — | — |


### `UpdateMemberRoleRequest`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `role` | `MemberRole` | Yes | — | — |


### `UserCreate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | Yes | — | — |
| `email` | `string (email)` | Yes | — | — |
| `password` | `string` | Yes | — | — |
| `role` | `object` | No | default: `MEMBER` | — |


### `UserPublic`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `id` | `integer` | Yes | — | — |
| `name` | `string` | Yes | — | — |
| `email` | `string` | Yes | — | — |
| `role` | `UserRole` | Yes | — | — |
| `avatar_color` | `string` | Yes | — | — |


### `UserResponse`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | Yes | — | — |
| `email` | `string (email)` | Yes | — | — |
| `id` | `integer` | Yes | — | — |
| `role` | `UserRole` | Yes | — | — |
| `avatar_color` | `string` | Yes | — | — |
| `created_at` | `string (date-time)` | Yes | — | — |


### `UserRole`

**Enum values:**

| Value |
|---|
| `MANAGER` |
| `TEAM_LEADER` |
| `MEMBER` |


### `UserUpdate`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `name` | `string` | No | nullable | — |
| `avatar_color` | `string` | No | nullable | — |


### `ValidationError`

| Field | Type | Required | Default / Constraints | Description |
|---|---|---:|---|---|
| `loc` | `array<string | integer>` | Yes | — | — |
| `msg` | `string` | Yes | — | — |
| `type` | `string` | Yes | — | — |


## 15. Validation Error Format

FastAPI validation failures use the following structure:

```json
{
  "detail": [
    {
      "loc": [
        "body",
        "field_name"
      ],
      "msg": "Field required",
      "type": "missing"
    }
  ]
}
```

The OpenAPI schemas are `HTTPValidationError` and `ValidationError`.

## 16. API Usage Flow

### Login

```text
POST /auth/login
        ↓
Receive access_token
        ↓
Authorization: Bearer <access_token>
        ↓
Call protected TeamFlow APIs
```

### Project → User Story → Task hierarchy

```text
POST /projects
        ↓
POST /projects/{project_id}/stories
        ↓
POST /stories/{story_id}/tasks
        ↓
PATCH /tasks/{task_id}/assign
        ↓
PATCH /tasks/{task_id}/status
```

### Task collaboration

```text
POST /tasks/{task_id}/comments
GET  /tasks/{task_id}/comments
        ↓
POST /tasks/{task_id}/time-logs
GET  /tasks/{task_id}/time-logs
```

### AI Assistant

```text
POST /chat
        ↓
Authenticated TeamFlow user
        ↓
TeamFlow knowledge + authorized live context
        ↓
Groq-backed assistant response
```

