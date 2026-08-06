import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Plus, ArrowLeft, Users, LayoutDashboard, Pencil, Trash2,
  ChevronDown, ChevronUp, MoreHorizontal, KanbanSquare, UserPlus, X,
} from 'lucide-react'
import { projectsApi, storiesApi, tasksApi, authApi } from '../api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import ProgressBar from '../components/ProgressBar'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Avatar from '../components/Avatar'
import TaskCard from '../components/TaskCard'
import type { Project, Story, Task, User } from '../types'
import {
  priorityColors, storyStatusColors, projectStatusColors,
  taskStatusColors, formatDate, TASK_STATUS_LABELS,
} from '../utils'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const STORY_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE']
const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
const MEMBER_ROLES = ['MEMBER', 'TEAM_LEADER']

// ── small sub-components ───────────────────────────────────────────────────────

function StoryForm({ form, setForm, members, onCancel, onSave, saving, error }: any) {
  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
        <input value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })}
          placeholder="As a user, I want to…"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
        <textarea value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })}
          rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
          <select value={form.priority} onChange={(e: any) => setForm({ ...form, priority: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
          <select value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            {STORY_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
        <button onClick={onSave} disabled={saving}
          className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function TaskForm({ form, setForm, members, onCancel, onSave, saving, error }: any) {
  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
        <input value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })}
          placeholder="Implement login API…"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
        <textarea value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })}
          rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
          <select value={form.priority} onChange={(e: any) => setForm({ ...form, priority: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
          <select value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label>
          <select value={form.assigned_to ?? ''} onChange={(e: any) => setForm({ ...form, assigned_to: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="">Unassigned</option>
            {members.map((m: any) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
          <input type="date" value={form.due_date ?? ''} onChange={(e: any) => setForm({ ...form, due_date: e.target.value || null })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Story Points</label>
          <input type="number" min={1} max={13} value={form.story_points} onChange={(e: any) => setForm({ ...form, story_points: Number(e.target.value) })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Est. Hours</label>
          <input type="number" min={0.5} step={0.5} value={form.estimated_hours ?? ''} onChange={(e: any) => setForm({ ...form, estimated_hours: e.target.value ? Number(e.target.value) : null })}
            placeholder="e.g. 8"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
        <button onClick={onSave} disabled={saving}
          className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const projectId = Number(id)

  const [project, setProject] = useState<Project | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Expand/collapse per story
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  // Modal states
  const [showAddStory, setShowAddStory] = useState(false)
  const [editStory, setEditStory] = useState<Story | null>(null)
  const [deleteStory, setDeleteStory] = useState<Story | null>(null)
  const [showAddTask, setShowAddTask] = useState<number | null>(null) // story id
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const [showMembers, setShowMembers] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  // Forms
  const [storyForm, setStoryForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', assigned_to: null as number | null, due_date: null as string | null, story_points: 1 })
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'MEMBER' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const isManagerOrLeader = user?.role === 'MANAGER' || user?.role === 'TEAM_LEADER'
  const isManager = user?.role === 'MANAGER'

  useEffect(() => { loadAll() }, [projectId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pRes, sRes] = await Promise.all([
        projectsApi.get(projectId),
        storiesApi.list(projectId),
      ])
      setProject(pRes.data)
      setStories(sRes.data)
      // expand first story by default
      if (sRes.data.length > 0) setExpanded({ [sRes.data[0].id]: true })
    } finally { setLoading(false) }
  }

  const loadUsers = async () => {
    const { data } = await authApi.listUsers()
    setAllUsers(data)
  }

  // ── Story CRUD ───────────────────────────────────────────────────────────────

  const openAddStory = () => {
    setStoryForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO' })
    setFormError(''); setShowAddStory(true)
  }
  const openEditStory = (s: Story) => {
    setStoryForm({ title: s.title, description: s.description || '', priority: s.priority, status: s.status })
    setFormError(''); setEditStory(s)
  }

  const saveStory = async () => {
    if (!storyForm.title.trim()) { setFormError('Title is required'); return }
    setSaving(true); setFormError('')
    try {
      if (editStory) {
        await storiesApi.update(editStory.id, storyForm)
        setEditStory(null)
      } else {
        const res = await storiesApi.create(projectId, storyForm)
        setExpanded(prev => ({ ...prev, [res.data.id]: true }))
        setShowAddStory(false)
      }
      loadAll()
    } catch (e: any) { setFormError(e.response?.data?.detail || 'Failed to save story')
    } finally { setSaving(false) }
  }

  const confirmDeleteStory = async () => {
    if (!deleteStory) return
    try { await storiesApi.delete(deleteStory.id); setDeleteStory(null); loadAll() } catch {}
  }

  // ── Task CRUD ────────────────────────────────────────────────────────────────

  const openAddTask = (storyId: number) => {
    setTaskForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', assigned_to: null, due_date: null, story_points: 1 })
    setFormError(''); setShowAddTask(storyId)
  }
  const openEditTask = (t: Task) => {
    setTaskForm({ title: t.title, description: t.description || '', priority: t.priority, status: t.status, assigned_to: t.assigned_to, due_date: t.due_date, story_points: t.story_points })
    setFormError(''); setEditTask(t)
  }

  const saveTask = async () => {
    if (!taskForm.title.trim()) { setFormError('Title is required'); return }
    setSaving(true); setFormError('')
    try {
      if (editTask) {
        await tasksApi.update(editTask.id, taskForm)
        setEditTask(null)
      } else {
        await tasksApi.create(showAddTask!, taskForm)
        setShowAddTask(null)
      }
      loadAll()
    } catch (e: any) { setFormError(e.response?.data?.detail || 'Failed to save task')
    } finally { setSaving(false) }
  }

  const confirmDeleteTask = async () => {
    if (!deleteTask) return
    try { await tasksApi.delete(deleteTask.id); setDeleteTask(null); loadAll() } catch {}
  }

  const changeTaskStatus = async (taskId: number, status: string) => {
    try { await tasksApi.updateStatus(taskId, status); loadAll() } catch {}
  }

  // ── Member management ────────────────────────────────────────────────────────

  const openAddMember = async () => {
    await loadUsers()
    setMemberForm({ user_id: '', role: 'MEMBER' })
    setFormError(''); setShowAddMember(true)
  }

  const saveMember = async () => {
    if (!memberForm.user_id) { setFormError('Select a user'); return }
    setSaving(true); setFormError('')
    try {
      await projectsApi.addMember(projectId, Number(memberForm.user_id), memberForm.role)
      setShowAddMember(false); loadAll()
    } catch (e: any) { setFormError(e.response?.data?.detail || 'Failed to add member')
    } finally { setSaving(false) }
  }

  const removeMember = async (userId: number) => {
    try { await projectsApi.removeMember(projectId, userId); loadAll() } catch {}
  }

  if (loading) return <Layout><Spinner className="mt-32" /></Layout>
  if (!project) return <Layout><p className="text-center mt-32 text-slate-500">Project not found.</p></Layout>

  const totalTasks = stories.reduce((a, s) => a + s.total_tasks, 0)
  const doneTasks  = stories.reduce((a, s) => a + s.completed_tasks, 0)
  const progress   = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0

  // Users not yet in the project
  const memberIds = new Set(project.members.map(m => m.user.id))
  const availableUsers = allUsers.filter(u => !memberIds.has(u.id))

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb + header */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link to="/projects" className="hover:text-brand-500 flex items-center gap-1"><ArrowLeft size={14} /> Projects</Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">{project.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
              <Badge className={projectStatusColors[project.status]}>{project.status}</Badge>
              {project.priority && (
                <Badge className={project.priority === 'URGENT' ? 'bg-red-100 text-red-700' : project.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}>
                  {project.priority}
                </Badge>
              )}
            </div>
            {project.description && <p className="text-slate-500 mt-1 text-sm">{project.description}</p>}
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span>Created by {project.created_by_user.name}</span>
              {project.deadline && <span>📅 Deadline: {project.deadline}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowMembers(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
              <Users size={15} /> Members ({project.members.length})
            </button>
            <button onClick={() => navigate(`/projects/${projectId}/kanban`)}
              className="flex items-center gap-2 px-4 py-2 border border-brand-200 bg-brand-50 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors">
              <KanbanSquare size={15} /> Kanban
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
            <span className="text-sm font-bold text-brand-600">{progress}%</span>
          </div>
          <ProgressBar value={progress} showLabel={false} />
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div><p className="text-xl font-bold text-slate-800">{stories.length}</p><p className="text-xs text-slate-400 mt-0.5">Stories</p></div>
            <div><p className="text-xl font-bold text-slate-800">{totalTasks}</p><p className="text-xs text-slate-400 mt-0.5">Total Tasks</p></div>
            <div><p className="text-xl font-bold text-green-600">{doneTasks}</p><p className="text-xs text-slate-400 mt-0.5">Completed</p></div>
          </div>
        </div>

        {/* Stories section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">User Stories</h2>
          {isManagerOrLeader && (
            <button onClick={openAddStory}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus size={16} /> Add Story
            </button>
          )}
        </div>

        {stories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <LayoutDashboard size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No user stories yet</p>
            {isManagerOrLeader && (
              <button onClick={openAddStory}
                className="mt-4 px-5 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
                Add first story
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => {
              const isOpen = expanded[story.id]
              return (
                <div key={story.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* Story header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpanded(prev => ({ ...prev, [story.id]: !isOpen }))}>
                    <div className="flex items-center gap-3 min-w-0">
                      {isOpen ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 truncate">{story.title}</span>
                          <Badge className={storyStatusColors[story.status]}>{story.status.replace('_', ' ')}</Badge>
                          <Badge className={priorityColors[story.priority]}>{story.priority}</Badge>
                        </div>
                        {story.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{story.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-700">{story.completed_tasks}/{story.total_tasks}</p>
                        <p className="text-xs text-slate-400">tasks done</p>
                      </div>
                      <div className="w-16">
                        <ProgressBar value={story.progress} showLabel={false} />
                        <p className="text-xs text-slate-400 text-center mt-0.5">{story.progress}%</p>
                      </div>
                      {isManagerOrLeader && (
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditStory(story)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteStory(story)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tasks list */}
                  {isOpen && (
                    <div className="border-t border-slate-100 p-4">
                      {story.tasks.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No tasks yet</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                          {story.tasks.map((task) => (
                            <div key={task.id} className="relative group">
                              <TaskCard task={task} onClick={() => openEditTask(task)} />
                              {/* Quick status change */}
                              <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                                {TASK_STATUSES.filter(s => s !== task.status).map(s => (
                                  <button key={s} onClick={(e) => { e.stopPropagation(); changeTaskStatus(task.id, s) }}
                                    className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-600 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-600 shadow-sm transition-colors"
                                    title={`Move to ${TASK_STATUS_LABELS[s as keyof typeof TASK_STATUS_LABELS]}`}>
                                    → {TASK_STATUS_LABELS[s as keyof typeof TASK_STATUS_LABELS]}
                                  </button>
                                ))}
                                {isManagerOrLeader && (
                                  <button onClick={(e) => { e.stopPropagation(); setDeleteTask(task) }}
                                    className="p-0.5 bg-white border border-slate-200 rounded text-red-400 hover:bg-red-50 shadow-sm transition-colors">
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {isManagerOrLeader && (
                        <button onClick={() => openAddTask(story.id)}
                          className="flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-700 font-medium transition-colors mt-1">
                          <Plus size={15} /> Add task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* Add Story */}
      {showAddStory && (
        <Modal title="New User Story" onClose={() => setShowAddStory(false)}>
          <StoryForm form={storyForm} setForm={setStoryForm} members={project.members}
            onCancel={() => setShowAddStory(false)} onSave={saveStory} saving={saving} error={formError} />
        </Modal>
      )}

      {/* Edit Story */}
      {editStory && (
        <Modal title="Edit Story" onClose={() => setEditStory(null)}>
          <StoryForm form={storyForm} setForm={setStoryForm} members={project.members}
            onCancel={() => setEditStory(null)} onSave={saveStory} saving={saving} error={formError} />
        </Modal>
      )}

      {/* Delete Story */}
      {deleteStory && (
        <Modal title="Delete Story" onClose={() => setDeleteStory(null)} size="sm">
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">Delete <span className="font-semibold">"{deleteStory.title}"</span>? All tasks inside will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteStory(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDeleteStory} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Task */}
      {showAddTask !== null && (
        <Modal title="New Task" onClose={() => setShowAddTask(null)} size="lg">
          <TaskForm form={taskForm} setForm={setTaskForm} members={project.members}
            onCancel={() => setShowAddTask(null)} onSave={saveTask} saving={saving} error={formError} />
        </Modal>
      )}

      {/* Edit Task */}
      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)} size="lg">
          <TaskForm form={taskForm} setForm={setTaskForm} members={project.members}
            onCancel={() => setEditTask(null)} onSave={saveTask} saving={saving} error={formError} />
        </Modal>
      )}

      {/* Delete Task */}
      {deleteTask && (
        <Modal title="Delete Task" onClose={() => setDeleteTask(null)} size="sm">
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">Delete task <span className="font-semibold">"{deleteTask.title}"</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTask(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDeleteTask} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Members panel */}
      {showMembers && (
        <Modal title={`Team Members (${project.members.length})`} onClose={() => setShowMembers(false)} size="md">
          <div className="space-y-3">
            {project.members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <Avatar name={m.user.name} color={m.user.avatar_color} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.user.name}</p>
                    <p className="text-xs text-slate-400">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-600">{m.role}</Badge>
                  {(isManager || (user?.role === 'TEAM_LEADER')) && m.role !== 'OWNER' && (
                    <button onClick={() => removeMember(m.user.id)}
                      className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(isManager || user?.role === 'TEAM_LEADER') && (
              <button onClick={openAddMember}
                className="w-full mt-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-brand-300 hover:text-brand-500 flex items-center justify-center gap-2 transition-colors">
                <UserPlus size={15} /> Add Member
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Add Member */}
      {showAddMember && (
        <Modal title="Add Team Member" onClose={() => setShowAddMember(false)} size="sm">
          <div className="space-y-4">
            {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">User</label>
              <select value={memberForm.user_id} onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select user…</option>
                {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Role</label>
              <select value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
                {MEMBER_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowAddMember(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={saveMember} disabled={saving}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                {saving ? 'Adding…' : 'Add Member'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  )
}
