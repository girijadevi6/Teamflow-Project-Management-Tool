export type UserRole = 'MANAGER' | 'TEAM_LEADER' | 'MEMBER'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  avatar_color: string
  created_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
}

// ── Project ──────────────────────────────────────────────────────────────────

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'PENDING' | 'PENDING_REVIEW' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'

export interface ProjectMember {
  id: number
  user: User
  role: 'OWNER' | 'TEAM_LEADER' | 'MEMBER'
  joined_at: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  status: ProjectStatus
  priority: Priority
  deadline: string | null
  created_by: number
  created_by_user: User
  created_at: string
  updated_at: string
  members: ProjectMember[]
  total_stories: number
  total_tasks: number
  completed_tasks: number
  progress: number
}

export interface ProjectSummary {
  id: number
  name: string
  description: string | null
  status: ProjectStatus
  priority: Priority
  deadline: string | null
  created_at: string
  total_stories: number
  total_tasks: number
  completed_tasks: number
  progress: number
  member_count: number
}

// ── Story ────────────────────────────────────────────────────────────────────

export type StoryStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Story {
  id: number
  project_id: number
  title: string
  description: string | null
  priority: Priority
  status: StoryStatus
  created_by: number
  created_by_user: User
  created_at: string
  updated_at: string
  tasks: Task[]
  total_tasks: number
  completed_tasks: number
  progress: number
}

// ── Task ─────────────────────────────────────────────────────────────────────

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'

export interface Task {
  id: number
  story_id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  assigned_to: number | null
  assignee: User | null
  due_date: string | null
  story_points: number
  estimated_hours?: number
  logged_hours: number
  created_by: number
  creator: User | null
  created_at: string
  updated_at: string
  story_title?: string
  project_id?: number
  project_name?: string
}

// ── Comment ─────────────────────────────────────────────────────────────────────

export interface Comment {
  id: number
  task_id: number
  user_id: number
  content: string
  created_at: string
  updated_at: string
  user?: User
}

// ── TimeLog ─────────────────────────────────────────────────────────────────────

export interface TimeLog {
  id: number
  task_id: number
  user_id: number
  hours: number
  description: string | null
  logged_at: string
  user?: User
}

// ── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'STORY_COMPLETED'
  | 'PROJECT_ADDED'
  | 'PROJECT_STATUS_CHANGED'
  | 'PROJECT_DEADLINE_APPROACHING'
  | 'COMMENT_ADDED'
  | 'TASK_COMMENTED'
  | 'TASK_UNASSIGNED'
  | 'TASK_SUBMITTED_FOR_REVIEW'
  | 'TASK_CHANGES_REQUESTED'
  | 'TASK_APPROVED'
  | 'PROJECT_SUBMITTED_FOR_REVIEW'
  | 'PROJECT_CHANGES_REQUESTED'
  | 'PROJECT_COMPLETED'
  | 'DAILY_DIGEST'
  | 'URGENT_TASK_ASSIGNED'
  | 'TASK_URGENT_DUE'
  | 'URGENT_TASK_DUE_SOON'

export interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  related_project_id: number | null
  related_task_id: number | null
  related_story_id: number | null
  created_at: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: number
  project_id: number | null
  user: User
  action: string
  entity_type: string
  entity_id: number | null
  entity_name: string | null
  detail: string | null
  created_at: string
}

export interface DashboardStats {
  total_projects: number
  active_projects: number
  pending_projects: number
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  overdue_tasks: number
  urgent_tasks: number
  total_story_points: number
  completed_story_points: number
  my_assigned_tasks: number
  recent_activity: ActivityLog[]
}

// ── Kanban ────────────────────────────────────────────────────────────────────

export interface KanbanBoard {
  TODO: Task[]
  IN_PROGRESS: Task[]
  IN_REVIEW: Task[]
  DONE: Task[]
}
