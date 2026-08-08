import type { Priority, TaskStatus, StoryStatus, ProjectStatus, UserRole } from '../types'

export const priorityColors: Record<Priority, string> = {
  LOW:    'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH:   'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

export const priorityDot: Record<Priority, string> = {
  LOW:    'bg-slate-400',
  MEDIUM: 'bg-blue-500',
  HIGH:   'bg-orange-500',
  URGENT: 'bg-red-500',
}

export const taskStatusColors: Record<TaskStatus, string> = {
  TODO:        'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW:   'bg-purple-100 text-purple-700',
  DONE:        'bg-green-100 text-green-700',
}

export const storyStatusColors: Record<StoryStatus, string> = {
  TODO:        'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE:        'bg-green-100 text-green-700',
}

export const projectStatusColors: Record<ProjectStatus, string> = {
  PLANNING:       'bg-yellow-100 text-yellow-700 border-yellow-200',
  ACTIVE:         'bg-emerald-100 text-emerald-700 border-emerald-200',
  PENDING:        'bg-blue-100 text-blue-700 border-blue-200',
  PENDING_REVIEW: 'bg-purple-100 text-purple-700 border-purple-200',
  ON_HOLD:        'bg-orange-100 text-orange-700 border-orange-200',
  COMPLETED:      'bg-green-100 text-green-700 border-green-200',
  ARCHIVED:       'bg-slate-100 text-slate-500 border-slate-200',
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatRelative(dateStr: string): string {
  // Backend returns UTC timestamps — ensure proper parsing
  let dateVal: number
  if (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.includes('T')) {
    // Already has timezone info or is ISO format
    dateVal = new Date(dateStr).getTime()
  } else {
    // Treat as UTC if no timezone info (backend uses datetime.utcnow)
    dateVal = new Date(dateStr + 'Z').getTime()
  }

  if (isNaN(dateVal)) return dateStr

  const diff = Date.now() - dateVal
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === 'DONE') return false
  return new Date(dueDate) < new Date()
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING:       'Planning',
  ACTIVE:         'Active',
  PENDING:        'Pending',
  PENDING_REVIEW: 'Pending Review',
  ON_HOLD:        'On Hold',
  COMPLETED:      'Completed',
  ARCHIVED:       'Archived',
}

export function getProjectStatusLabel(status: ProjectStatus, role?: string): string {
  if (status === 'PENDING_REVIEW' && (role === 'TEAM_LEADER' || role === 'MEMBER')) {
    return 'Submit for Review'
  }
  return PROJECT_STATUS_LABELS[status] || status
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO:        'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW:   'In Review',
  DONE:        'Done',
}

/** Role-aware status labels: members see "Submit for Review" instead of "In Review" */
export function getTaskStatusLabel(status: string, userRole?: UserRole): string {
  if (status === 'REQUEST_CHANGES') {
    return '🔙 Request Changes'
  }
  if (status === 'IN_REVIEW' && userRole === 'MEMBER') {
    return 'Submit for Review'
  }
  return TASK_STATUS_LABELS[status as TaskStatus] || status
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent',
}
