import { useEffect } from 'react'
import { X, Calendar } from 'lucide-react'
import TaskComments from './TaskComments'
import Avatar from './Avatar'
import Badge from './Badge'
import type { Task } from '../types'
import { priorityColors, taskStatusColors, formatDate, getTaskStatusLabel } from '../utils'

interface TaskDiscussionDrawerProps {
  task: Task | null
  onClose: () => void
  isManagerOrLeader?: boolean
}

export default function TaskDiscussionDrawer({ task, onClose, isManagerOrLeader }: TaskDiscussionDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!task) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-all animate-in slide-in-from-right duration-300 border-l border-slate-200">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80 gap-3">
            <div className="space-y-1.5 pr-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                <Badge className={taskStatusColors[task.status]}>{getTaskStatusLabel(task.status)}</Badge>
              </div>
              <h3 className="text-base font-bold text-slate-800 leading-snug break-words">
                {task.title}
              </h3>
              {task.story_title && (
                <p className="text-xs text-slate-500 truncate">Story: {task.story_title}</p>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              title="Close side panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Task Summary Info */}
          <div className="px-5 py-3 bg-slate-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Assigned:</span>
              {task.assignee ? (
                <div className="flex items-center gap-1 font-medium text-slate-700">
                  <Avatar name={task.assignee.name} color={task.assignee.avatar_color} size="xs" />
                  <span>{task.assignee.name}</span>
                </div>
              ) : (
                <span className="italic text-slate-400">Unassigned</span>
              )}
            </div>

            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />
                <span>{formatDate(task.due_date)}</span>
              </div>
            )}
          </div>

          {/* Body: Discussion Section */}
          <div className="flex-1 overflow-y-auto p-5">
            <TaskComments taskId={task.id} isManagerOrLeader={isManagerOrLeader} />
          </div>
        </div>
      </div>
    </div>
  )
}
