import { Calendar, Flag } from 'lucide-react'
import type { Task } from '../types'
import { priorityColors, priorityDot, formatDate, isOverdue } from '../utils'
import Avatar from './Avatar'
import Badge from './Badge'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  compact?: boolean
}

export default function TaskCard({ task, onClick, compact = false }: TaskCardProps) {
  const overdue = isOverdue(task.due_date, task.status)

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-3.5 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group ${compact ? '' : 'shadow-sm'}`}
    >
      {/* Priority dot + title */}
      <div className="flex items-start gap-2">
        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[task.priority]}`} />
        <p className="text-sm font-medium text-slate-800 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2 flex-1">
          {task.title}
        </p>
      </div>

      {!compact && (
        <>
          {/* Story context */}
          {task.story_title && (
            <p className="text-xs text-slate-400 mt-1.5 ml-4 truncate">{task.story_title}</p>
          )}

          {/* Tags row */}
          <div className="flex flex-wrap gap-1.5 mt-2.5 ml-4">
            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
            {task.story_points > 1 && (
              <Badge className="bg-slate-100 text-slate-600">{task.story_points} pts</Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 ml-4">
            <div className="flex items-center gap-1.5">
              {task.due_date && (
                <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                  <Calendar size={11} />
                  {formatDate(task.due_date)}
                </span>
              )}
            </div>
            {task.assignee ? (
              <Avatar name={task.assignee.name} color={task.assignee.avatar_color} size="xs" />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300" title="Unassigned" />
            )}
          </div>
        </>
      )}
    </div>
  )
}
