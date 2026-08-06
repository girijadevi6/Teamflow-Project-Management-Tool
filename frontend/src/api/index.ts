import api from './client'
import type {
  User, Project, ProjectSummary, Story, Task, Comment, TimeLog,
  Notification, DashboardStats, KanbanBoard, ProjectMember,
} from '../types'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<{ access_token: string; user: User }>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/login', { email, password }),

  me: () => api.get<User>('/auth/me'),

  updateMe: (data: { name?: string; avatar_color?: string }) =>
    api.put<User>('/auth/me', data),

  listUsers: () => api.get<User[]>('/auth/users'),
}

// ── Projects ──────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => api.get<ProjectSummary[]>('/projects'),

  get: (id: number) => api.get<Project>(`/projects/${id}`),

  create: (data: { name: string; description?: string; status?: string; priority?: string; deadline?: string | null; team_leader_id?: number | null }) =>
    api.post<Project>('/projects', data),

  update: (id: number, data: Partial<{ name: string; description: string; status: string; priority?: string; deadline?: string | null }>) =>
    api.put<Project>(`/projects/${id}`, data),

  updateStatus: (id: number, status: string) =>
    api.patch<Project>(`/projects/${id}/status`, { status }),

  delete: (id: number) => api.delete(`/projects/${id}`),

  hierarchy: (id: number) => api.get(`/projects/${id}/hierarchy`),

  addMember: (projectId: number, userId: number, role: string) =>
    api.post<ProjectMember>(`/projects/${projectId}/members`, { user_id: userId, role }),

  removeMember: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/members/${userId}`),

  updateMemberRole: (projectId: number, userId: number, role: string) =>
    api.put<ProjectMember>(`/projects/${projectId}/members/${userId}`, { role }),

  kanban: (projectId: number) =>
    api.get<KanbanBoard>(`/projects/${projectId}/kanban`),
}

// ── Stories ───────────────────────────────────────────────────────────────────

export const storiesApi = {
  list: (projectId: number) =>
    api.get<Story[]>(`/projects/${projectId}/stories`),

  get: (storyId: number) => api.get<Story>(`/stories/${storyId}`),

  create: (projectId: number, data: {
    title: string; description?: string; priority?: string; status?: string
  }) => api.post<Story>(`/projects/${projectId}/stories`, data),

  update: (storyId: number, data: Partial<{
    title: string; description: string; priority: string; status: string
  }>) => api.put<Story>(`/stories/${storyId}`, data),

  delete: (storyId: number) => api.delete(`/stories/${storyId}`),
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const tasksApi = {
  list: (storyId: number) => api.get<Task[]>(`/stories/${storyId}/tasks`),

  get: (taskId: number) => api.get<Task>(`/tasks/${taskId}`),

  create: (storyId: number, data: {
    title: string; description?: string; priority?: string;
    status?: string; assigned_to?: number | null;
    due_date?: string | null; story_points?: number
  }) => api.post<Task>(`/stories/${storyId}/tasks`, data),

  update: (taskId: number, data: Partial<{
    title: string; description: string; priority: string;
    status: string; assigned_to: number | null;
    due_date: string | null; story_points: number
  }>) => api.put<Task>(`/tasks/${taskId}`, data),

  delete: (taskId: number) => api.delete(`/tasks/${taskId}`),

  updateStatus: (taskId: number, status: string) =>
    api.patch<Task>(`/tasks/${taskId}/status`, { status }),

  assign: (taskId: number, userId: number | null) =>
    api.patch<Task>(`/tasks/${taskId}/assign`, { assigned_to: userId }),

  myTasks: () => api.get<Task[]>('/tasks/my/assigned'),
}

// ── Comments ──────────────────────────────────────────────────────────────────

export const commentsApi = {
  list: (taskId: number) => api.get<Comment[]>(`/tasks/${taskId}/comments`),
  create: (taskId: number, data: { content: string }) =>
    api.post<Comment>(`/tasks/${taskId}/comments`, data),
  delete: (taskId: number, commentId: number) => api.delete(`/tasks/${taskId}/comments/${commentId}`),
}

// ── Time Logs ─────────────────────────────────────────────────────────────────

export const timeLogsApi = {
  list: (taskId: number) => api.get<TimeLog[]>(`/tasks/${taskId}/time-logs`),
  create: (taskId: number, data: { hours: number; description?: string }) =>
    api.post<TimeLog>(`/tasks/${taskId}/time-logs`, data),
}

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (unreadOnly = false) =>
    api.get<Notification[]>(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),

  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),

  markRead: (ids: number[]) =>
    api.patch('/notifications/mark-read', { notification_ids: ids }),

  markAllRead: () => api.patch('/notifications/mark-all-read'),

  delete: (id: number) => api.delete(`/notifications/${id}`),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats'),
  activity: (projectId?: number) =>
    api.get<import('../types').ActivityLog[]>(
      `/dashboard/activity${projectId ? `?project_id=${projectId}` : ''}`
    ),
}
