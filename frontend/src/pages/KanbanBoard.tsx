import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { ArrowLeft, Plus, X, Filter, Trash2, Pencil, RotateCcw, Check, MessageSquare } from 'lucide-react'
import { projectsApi, storiesApi, tasksApi, authApi } from '../api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import Modal from '../components/Modal'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import TaskDiscussionDrawer from '../components/TaskDiscussionDrawer'
import type { KanbanBoard as KanbanBoardType, Task, Story, Project, User } from '../types'
import { priorityColors, priorityDot, formatDate, isOverdue, TASK_STATUS_LABELS } from '../utils'

const COLUMNS: { key: keyof KanbanBoardType; label: string; color: string; dot: string }[] = [
  { key: 'TODO',        label: 'To Do',      color: 'bg-slate-100',  dot: 'bg-slate-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50',   dot: 'bg-blue-500' },
  { key: 'IN_REVIEW',   label: 'In Review',  color: 'bg-purple-50',  dot: 'bg-purple-500' },
  { key: 'DONE',        label: 'Done',       color: 'bg-green-50',   dot: 'bg-green-500' },
]

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']

// ── Draggable task card ────────────────────────────────────────────────────────

function KanbanCard({
  task, index, canEdit, onEdit, onDelete, onRequestChanges, onApprove, onOpenComments,
}: {
  task: Task; index: number; canEdit: boolean
  onEdit: (t: Task) => void; onDelete: (t: Task) => void
  onRequestChanges?: (t: Task) => void; onApprove?: (t: Task) => void
  onOpenComments?: (t: Task) => void
}) {
  const overdue = isOverdue(task.due_date, task.status)
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-xl border p-3.5 mb-2.5 group transition-shadow ${
            snapshot.isDragging
              ? 'shadow-xl border-brand-300 rotate-1'
              : 'border-slate-200 shadow-sm hover:shadow-md hover:border-brand-200'
          }`}
        >
          {/* priority dot + title */}
          <div className="flex items-start gap-2">
            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[task.priority]}`} />
            <p className="text-sm font-medium text-slate-800 leading-snug flex-1 line-clamp-2">
              {task.title}
            </p>
            {canEdit && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                <button
                  onClick={() => onEdit(task)}
                  title="Edit Task"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => onDelete(task)}
                  title="Delete Task"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

          </div>

          {/* story context */}
          {task.story_title && (
            <p className="text-xs text-slate-400 mt-1.5 ml-4 truncate">{task.story_title}</p>
          )}

          {/* tags */}
          <div className="flex flex-wrap gap-1.5 mt-2.5 ml-4">
            <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
            {task.story_points > 1 && (
              <Badge className="bg-slate-100 text-slate-600">{task.story_points} pts</Badge>
            )}
          </div>

          {/* footer */}
          <div className="flex items-center justify-between mt-3 ml-4 gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.due_date ? (
                <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                  📅 {formatDate(task.due_date)}{overdue ? ' ⚠' : ''}
                </span>
              ) : null}
              {onOpenComments && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenComments(task) }}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-600 hover:bg-brand-50 px-1.5 py-0.5 rounded transition-colors"
                  title="Open task discussion"
                >
                  <MessageSquare size={11} />
                  <span>Comments</span>
                </button>
              )}
            </div>
            {task.assignee ? (
              <Avatar name={task.assignee.name} color={task.assignee.avatar_color} size="xs" />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300" title="Unassigned" />
            )}
          </div>

          {/* Quick review actions for Leaders/Managers when task is IN_REVIEW */}
          {canEdit && task.status === 'IN_REVIEW' && (
            <div className="mt-2.5 pt-2 border-t border-purple-100 flex items-center justify-between gap-1.5" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onRequestChanges && onRequestChanges(task)}
                className="flex-1 py-1 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <RotateCcw size={11} /> Request Changes
              </button>
              <button
                onClick={() => onApprove && onApprove(task)}
                className="py-1 px-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <Check size={11} /> Approve
              </button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function KanbanBoard() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const projectId = Number(id)

  const [board, setBoard] = useState<KanbanBoardType>({ TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] })
  const [project, setProject] = useState<Project | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  // filters
  const [filterAssignee, setFilterAssignee] = useState<number | ''>('')
  const [filterStory, setFilterStory]       = useState<number | ''>('')
  const [filterPriority, setFilterPriority] = useState('')

  // task modal
  const [editTask, setEditTask]   = useState<Task | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [activeDrawerTask, setActiveDrawerTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm] = useState({
    story_id: 0, title: '', description: '', priority: 'MEDIUM',
    status: 'TODO', assigned_to: null as number | null,
    due_date: null as string | null, story_points: 1,
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const isManagerOrLeader = user?.role === 'MANAGER' || user?.role === 'TEAM_LEADER'

  useEffect(() => { loadAll() }, [projectId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [bRes, pRes, sRes] = await Promise.all([
        projectsApi.kanban(projectId),
        projectsApi.get(projectId),
        storiesApi.list(projectId),
      ])
      setBoard(bRes.data)
      setProject(pRes.data)
      setStories(sRes.data)
    } finally { setLoading(false) }
  }

  // Reject comment state for Kanban drag
  const [kanbanReject, setKanbanReject] = useState<{ taskId: number } | null>(null)
  const [kanbanRejectComment, setKanbanRejectComment] = useState('')

  // Allowed transitions for members
  const memberAllowed: Record<string, string[]> = {
    'TODO': ['IN_PROGRESS'],
    'IN_PROGRESS': ['TODO', 'IN_REVIEW'],
    'IN_REVIEW': ['IN_PROGRESS'],
    'DONE': [],
  }

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const srcCol  = source.droppableId as keyof KanbanBoardType
    const dstCol  = destination.droppableId as keyof KanbanBoardType
    const taskId  = Number(draggableId)

    // Members can only move their own tasks
    const movedTask = board[srcCol][source.index]
    if (user?.role === 'MEMBER' && movedTask.assigned_to !== user.id) {
      loadAll(); return
    }

    // Enforce member transition rules
    if (user?.role === 'MEMBER') {
      const allowed = memberAllowed[srcCol] || []
      if (!allowed.includes(dstCol)) {
        alert(dstCol === 'DONE'
          ? 'Members cannot mark tasks as completed. Submit for review instead.'
          : `You cannot move tasks from ${srcCol} to ${dstCol}.`)
        loadAll(); return
      }
    }

    // If leader/manager is rejecting (IN_REVIEW → IN_PROGRESS), ask for comment
    if (
      srcCol === 'IN_REVIEW' && dstCol === 'IN_PROGRESS' &&
      (user?.role === 'MANAGER' || user?.role === 'TEAM_LEADER')
    ) {
      // Optimistic update
      const newBoard = { ...board }
      const [moved] = newBoard[srcCol].splice(source.index, 1)
      moved.status = dstCol
      newBoard[dstCol].splice(destination.index, 0, moved)
      setBoard({ ...newBoard })
      setKanbanReject({ taskId })
      setKanbanRejectComment('')
      return
    }

    // Optimistic update
    const newBoard = { ...board }
    const [moved] = newBoard[srcCol].splice(source.index, 1)
    moved.status = dstCol
    newBoard[dstCol].splice(destination.index, 0, moved)
    setBoard({ ...newBoard })

    try {
      await tasksApi.updateStatus(taskId, dstCol)
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update status')
      loadAll() // revert on failure
    }
  }

  const confirmKanbanReject = async () => {
    if (!kanbanReject) return
    try {
      await tasksApi.updateStatus(kanbanReject.taskId, 'IN_PROGRESS', kanbanRejectComment)
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed')
      loadAll()
    }
    setKanbanReject(null)
    setKanbanRejectComment('')
  }

  // ── Task edit / delete ───────────────────────────────────────────────────────

  const openEdit = (t: Task) => {
    setTaskForm({
      story_id: t.story_id, title: t.title, description: t.description || '',
      priority: t.priority, status: t.status, assigned_to: t.assigned_to,
      due_date: t.due_date, story_points: t.story_points,
    })
    setFormError(''); setEditTask(t)
  }

  const saveEdit = async () => {
    if (!taskForm.title.trim()) { setFormError('Title is required'); return }
    setSaving(true); setFormError('')
    try {
      await tasksApi.update(editTask!.id, taskForm)
      setEditTask(null); loadAll()
    } catch (e: any) { setFormError(e.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  const openAddTask = () => {
    const firstStory = stories[0]
    setTaskForm({
      story_id: firstStory?.id || 0, title: '', description: '',
      priority: 'MEDIUM', status: 'TODO', assigned_to: null, due_date: null, story_points: 1,
    })
    setFormError(''); setShowAddTask(true)
  }

  const saveAdd = async () => {
    if (!taskForm.title.trim()) { setFormError('Title is required'); return }
    if (!taskForm.story_id) { setFormError('Select a story'); return }
    setSaving(true); setFormError('')
    try {
      await tasksApi.create(taskForm.story_id, taskForm)
      setShowAddTask(false); loadAll()
    } catch (e: any) { setFormError(e.response?.data?.detail || 'Failed to create')
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTask) return
    try { await tasksApi.delete(deleteTask.id); setDeleteTask(null); loadAll() } catch {}
  }

  // ── Filtering ────────────────────────────────────────────────────────────────

  const filterTasks = (tasks: Task[]) => tasks.filter(t => {
    if (filterAssignee && t.assigned_to !== filterAssignee) return false
    if (filterStory && t.story_id !== filterStory) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const hasFilter = filterAssignee !== '' || filterStory !== '' || filterPriority !== ''
  const members = project?.members || []

  if (loading) return <Layout><Spinner className="mt-32" /></Layout>

  // ── Shared task form ─────────────────────────────────────────────────────────

  const TaskModalForm = () => (
    <div className="space-y-4">
      {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
      {!editTask && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Story *</label>
          <select value={taskForm.story_id} onChange={e => setTaskForm({ ...taskForm, story_id: Number(e.target.value) })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            <option value={0}>Select story…</option>
            {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
        <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
          placeholder="Task title…"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
        <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
          rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
          <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
          <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
          <select value={taskForm.assigned_to ?? ''} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date & Time</label>
          <input type="datetime-local" value={taskForm.due_date ?? ''} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value || null })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={() => { setEditTask(null); setShowAddTask(false) }}
          className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
        <button onClick={editTask ? saveEdit : saveAdd} disabled={saving}
          className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : editTask ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Link to={`/projects/${projectId}`} className="hover:text-brand-500 flex items-center gap-1">
                <ArrowLeft size={14} /> {project?.name}
              </Link>
              <span>/</span>
              <span className="text-slate-600 font-medium">Kanban Board</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Kanban Board</h1>
            <p className="text-sm text-slate-400 mt-0.5">Drag cards between columns to update task status</p>
          </div>
          {isManagerOrLeader && (
            <button onClick={openAddTask}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm flex-shrink-0">
              <Plus size={18} /> New Task
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 mb-6 flex flex-wrap items-center gap-3">
          <Filter size={15} className="text-slate-400 flex-shrink-0" />
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="">All Assignees</option>
            {members.map(m => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
          </select>
          <select value={filterStory} onChange={e => setFilterStory(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="">All Stories</option>
            {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          {hasFilter && (
            <button onClick={() => { setFilterAssignee(''); setFilterStory(''); setFilterPriority('') }}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
              <X size={13} /> Clear filters
            </button>
          )}
          {/* Legend */}
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
            {PRIORITIES.map(p => (
              <span key={p} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${p === 'LOW' ? 'bg-slate-400' : p === 'MEDIUM' ? 'bg-blue-500' : p === 'HIGH' ? 'bg-orange-500' : 'bg-red-500'}`} />
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {COLUMNS.map(col => {
              const tasks = filterTasks(board[col.key])
              return (
                <div key={col.key} className={`${col.color} rounded-2xl p-4 min-h-[400px]`}>
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                      <span className="font-semibold text-slate-700 text-sm">{col.label}</span>
                    </div>
                    <span className="bg-white text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {tasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={col.key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] transition-colors rounded-xl ${snapshot.isDraggingOver ? 'bg-white/60 ring-2 ring-brand-300' : ''}`}
                      >
                        {tasks.map((task, index) => (
                          <KanbanCard
                            key={task.id} task={task} index={index}
                            canEdit={isManagerOrLeader}
                            onEdit={openEdit} onDelete={setDeleteTask}
                            onOpenComments={(t) => setActiveDrawerTask(t)}
                            onRequestChanges={(t) => { setKanbanReject({ taskId: t.id }); setKanbanRejectComment('') }}
                            onApprove={async (t) => {
                              try {
                                await tasksApi.updateStatus(t.id, 'DONE')
                                loadAll()
                              } catch (e: any) {
                                alert(e.response?.data?.detail || 'Failed to approve task')
                              }
                            }}
                          />
                        ))}
                        {provided.placeholder}
                        {tasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl">
                            <p className="text-xs text-slate-400">Drop tasks here</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Edit Task Modal */}
      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)} size="lg">
          <TaskModalForm />
        </Modal>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <Modal title="New Task" onClose={() => setShowAddTask(false)} size="lg">
          <TaskModalForm />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTask && (
        <Modal title="Delete Task" onClose={() => setDeleteTask(null)} size="sm">
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">Delete <span className="font-semibold">"{deleteTask.title}"</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTask(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Request Changes (Reject) Comment Modal */}
      {kanbanReject && (
        <Modal title="Request Changes" onClose={() => { setKanbanReject(null); loadAll() }} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              You are requesting changes on this task. The member will be notified and the task will be moved back to{' '}
              <span className="font-semibold text-blue-600">In Progress</span>.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Feedback / Comment <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={kanbanRejectComment}
                onChange={(e) => setKanbanRejectComment(e.target.value)}
                rows={3}
                placeholder="Describe what changes are needed..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setKanbanReject(null); loadAll() }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={confirmKanbanReject}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
                Request Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Task Discussion Side Panel Drawer */}
      <TaskDiscussionDrawer
        task={activeDrawerTask}
        onClose={() => setActiveDrawerTask(null)}
        isManagerOrLeader={isManagerOrLeader}
      />
    </Layout>
  )
}
