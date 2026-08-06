import type { Priority, TaskStatus, StoryStatus, ProjectStatus } from '../types'

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
  PLANNING:  'bg-yellow-100 text-yellow-700',
  ACTIVE:    'bg-green-100 text-green-700',
  PENDING:   'bg-purple-100 text-purple-700',
  ON_HOLD:   'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ARCHIVED:  'bg-slate-100 text-slate-500',
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
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

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO:        'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW:   'In Review',
  DONE:        'Done',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent',
}
