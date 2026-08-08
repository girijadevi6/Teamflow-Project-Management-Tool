import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckSquare, Clock, AlertTriangle, Calendar,
  ArrowRight, Filter, ChevronRight, MessageSquare
} from 'lucide-react'
import { tasksApi } from '../api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import TaskDiscussionDrawer from '../components/TaskDiscussionDrawer'
import type { Task, TaskStatus } from '../types'
import {
  priorityColors, priorityDot, taskStatusColors,
  formatDate, isOverdue, TASK_STATUS_LABELS, PRIORITY_LABELS
} from '../utils'

export default function MyTasks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | null>(null)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await tasksApi.myTasks()
      setTasks(res.data)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus)
      loadTasks()
    } catch (err) {
      console.error(err)
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'ALL') return true
    return t.status === statusFilter
  })

  // Group by project
  const tasksByProject: Record<string, Task[]> = {}
  filteredTasks.forEach((task) => {
    const projectName = task.project_name || 'Other Tasks'
    if (!tasksByProject[projectName]) {
      tasksByProject[projectName] = []
    }
    tasksByProject[projectName].push(task)
  })

  if (loading) return <Layout><Spinner className="mt-32" /></Layout>

  const totalAssigned = tasks.length
  const completed = tasks.filter((t) => t.status === 'DONE').length
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status)).length

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Assigned Tasks</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and update tasks assigned directly to you across all projects</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Total Assigned</p>
            <p className="text-2xl font-bold text-slate-800">{totalAssigned}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completed}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Overdue</p>
            <p className="text-2xl font-bold text-red-500">{overdue}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter size={14} /> Filter:
          </span>
          {['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s === 'ALL' ? 'All Tasks' : TASK_STATUS_LABELS[s as TaskStatus]}
            </button>
          ))}
        </div>

        {/* Task List grouped by Project */}
        {Object.keys(tasksByProject).length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <CheckSquare size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No tasks found</p>
            <p className="text-xs text-slate-400 mt-1">You don't have any assigned tasks matching this filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(tasksByProject).map(([projectName, projTasks]) => (
              <div key={projectName} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-slate-50/70 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <span>📁</span> {projectName}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">{projTasks.length} tasks</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {projTasks.map((task) => {
                    const taskOverdue = isOverdue(task.due_date, task.status)
                    return (
                      <div key={task.id} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`w-2.5 h-2.5 rounded-full ${priorityDot[task.priority]}`} />
                            <h4 className="font-medium text-slate-800 text-base">{task.title}</h4>
                            <Badge className={taskStatusColors[task.status]}>{TASK_STATUS_LABELS[task.status]}</Badge>
                            <Badge className={priorityColors[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                            {task.story_title && <span>Story: {task.story_title}</span>}
                            {task.due_date && (
                              <span className={taskOverdue ? 'text-red-500 font-medium flex items-center gap-1' : 'flex items-center gap-1'}>
                                <Calendar size={12} /> Due: {formatDate(task.due_date)} {taskOverdue && '⚠️'}
                              </span>
                            )}
                            {task.estimated_hours && (
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> {task.logged_hours}/{task.estimated_hours} hrs
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Change Control */}
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-brand-500 outline-none text-slate-700 shadow-sm"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="DONE">Done</option>
                          </select>
                          <button
                            onClick={() => setSelectedTaskForComments(task)}
                            className="px-2.5 py-1.5 border border-slate-200 rounded-xl hover:bg-brand-50 hover:border-brand-200 text-slate-600 hover:text-brand-600 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                            title="View task discussion & comments"
                          >
                            <MessageSquare size={13} /> Discussion
                          </button>
                          {task.project_id && (
                            <Link
                              to={`/projects/${task.project_id}`}
                              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                              title="Go to project"
                            >
                              <ArrowRight size={14} />
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskDiscussionDrawer
        task={selectedTaskForComments}
        onClose={() => setSelectedTaskForComments(null)}
      />
    </Layout>
  )
}
