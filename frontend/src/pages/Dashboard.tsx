import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, FolderKanban, CheckCircle2, Clock, Hourglass, Timer, AlertTriangle, Zap,
  Users, TrendingUp, Activity, ChevronRight, Pencil, Trash2, X,
} from 'lucide-react'
import { projectsApi, dashboardApi, authApi } from '../api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import ProgressBar from '../components/ProgressBar'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Avatar from '../components/Avatar'
import type { ProjectSummary, DashboardStats, User } from '../types'
import { projectStatusColors, formatRelative } from '../utils'

const STATUSES = ['PLANNING', 'ACTIVE', 'PENDING', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']

// ── Extracted to top-level so React keeps a stable component identity ──────────

interface ProjectFormFields {
  name: string
  description: string
  status: string
  priority: string
  deadline: string | null
  team_leader_id: number | null
}

interface ProjectFormProps {
  form: ProjectFormFields
  setForm: (f: ProjectFormFields) => void
  error: string
  isEdit: boolean
  saving: boolean
  onSave: () => void
  onCancel: () => void
  teamLeaders: User[]
}

function ProjectForm({ form, setForm, error, isEdit, saving, onSave, onCancel, teamLeaders }: ProjectFormProps) {
  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Name *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. E-Commerce Platform"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3} placeholder="What is this project about?"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white">
          <option value="">-- Select Priority --</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline (optional)</label>
        <input type="date" value={form.deadline || ''} onChange={(e) => setForm({ ...form, deadline: e.target.value || null })}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {/* Team Leader assignment — only on create, not edit */}
      {!isEdit && teamLeaders.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Assign Team Leader (optional)</label>
          <select value={form.team_leader_id ?? ''} onChange={(e) => setForm({ ...form, team_leader_id: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white">
            <option value="">-- No Team Leader --</option>
            {teamLeaders.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onSave} disabled={saving}
          className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<ProjectSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null)
  const [form, setForm] = useState<ProjectFormFields>({ name: '', description: '', status: 'PLANNING', priority: '', deadline: null, team_leader_id: null })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [teamLeaders, setTeamLeaders] = useState<User[]>([])

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pRes, sRes] = await Promise.all([projectsApi.list(), dashboardApi.stats()])
      setProjects(pRes.data)
      setStats(sRes.data)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamLeaders = async () => {
    try {
      const { data } = await authApi.listUsers()
      setTeamLeaders(data.filter((u: User) => u.role === 'TEAM_LEADER'))
    } catch {
      setTeamLeaders([])
    }
  }

  const openCreate = async () => {
    setForm({ name: '', description: '', status: 'PLANNING', priority: '', deadline: null, team_leader_id: null })
    setError('')
    await fetchTeamLeaders()
    setShowCreate(true)
  }

  const openEdit = (p: ProjectSummary) => {
    setForm({
      name: p.name,
      description: p.description || '',
      status: p.status,
      priority: p.priority ?? '',
      deadline: p.deadline,
      team_leader_id: null,
    })
    setError('')
    setShowEdit(p)
  }

  const saveCreate = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority || undefined,
        deadline: form.deadline || null,
        team_leader_id: form.team_leader_id || null,
      }
      await projectsApi.create(payload)
      setShowCreate(false)
      loadAll()
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to create project')
    } finally { setSaving(false) }
  }

  const saveEdit = async () => {
    if (!showEdit || !form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority || undefined,
        deadline: form.deadline || null,
      }
      await projectsApi.update(showEdit.id, payload)
      setShowEdit(null)
      loadAll()
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to update')
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await projectsApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      loadAll()
    } catch {}
  }

  const isManager = user?.role === 'MANAGER'

  const statCards = stats
    ? [
        { icon: FolderKanban, label: 'Total Projects', value: stats.total_projects, color: 'text-brand-500', bg: 'bg-brand-50' },
        { icon: TrendingUp, label: 'Active Projects', value: stats.active_projects, color: 'text-green-600', bg: 'bg-green-50' },
        { icon: Hourglass, label: 'Pending Projects', value: stats.pending_projects, color: 'text-purple-600', bg: 'bg-purple-50' },
        { icon: CheckCircle2, label: 'Tasks Done', value: stats.completed_tasks, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { icon: Timer, label: 'In Progress', value: stats.in_progress_tasks, color: 'text-blue-600', bg: 'bg-blue-50' },
        { icon: Zap, label: 'Urgent Tasks', value: stats.urgent_tasks, color: 'text-red-600', bg: 'bg-red-50' },
        { icon: AlertTriangle, label: 'Overdue', value: stats.overdue_tasks, color: 'text-red-500', bg: 'bg-red-50' },
        { icon: Users, label: 'Assigned to Me', value: stats.my_assigned_tasks, color: 'text-purple-600', bg: 'bg-purple-50' },
      ]
    : []

  if (loading) return <Layout><Spinner className="mt-32" /></Layout>

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 mt-0.5 text-sm">Here's what's happening across your projects</p>
          </div>
          {isManager && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-brand-200">
              <Plus size={18} /> New Project
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm card-hover-lift">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Projects grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Projects</h2>
              <span className="text-sm text-slate-400">{projects.length} total</span>
            </div>

            {projects.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <FolderKanban size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No projects yet</p>
                {isManager && (
                  <button onClick={openCreate}
                    className="mt-4 px-5 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
                    Create your first project
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <div key={p.id}
                    className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-brand-100 transition-all cursor-pointer group"
                    onClick={() => navigate(`/projects/${p.id}`)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate">
                            {p.name}
                          </h3>
                          {(isManager || user?.role === 'TEAM_LEADER') ? (
                            <select
                              value={p.status}
                              onChange={(e) => {
                                e.stopPropagation()
                                const newStatus = e.target.value
                                if (newStatus === p.status) return
                                projectsApi.updateStatus(p.id, newStatus).then(() => loadAll()).catch((err) => {
                                  alert(err.response?.data?.detail || 'Failed to update status')
                                })
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-xs font-bold rounded-lg px-2.5 py-1 border outline-none cursor-pointer transition-colors ${
                                p.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                                p.status === 'PENDING_REVIEW' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isManager ? (
                                <>
                                  <option value="PLANNING">Planning</option>
                                  <option value="ACTIVE">Active</option>
                                  <option value="PENDING_REVIEW">Pending Review</option>
                                  <option value="COMPLETED">Completed</option>
                                  <option value="ON_HOLD">On Hold</option>
                                  <option value="ARCHIVED">Archived</option>
                                </>
                              ) : (
                                <>
                                  {p.status === 'PLANNING' && <option value="PLANNING">Planning</option>}
                                  {p.status === 'PLANNING' && <option value="ACTIVE">Active</option>}
                                  {p.status === 'ACTIVE' && <option value="ACTIVE">Active</option>}
                                  {p.status === 'ACTIVE' && <option value="PENDING_REVIEW">Submit for Review</option>}
                                  {p.status === 'PENDING_REVIEW' && <option value="PENDING_REVIEW">Pending Review</option>}
                                  {p.status === 'PENDING_REVIEW' && <option value="ACTIVE">Withdraw Review</option>}
                                  {p.status === 'COMPLETED' && <option value="COMPLETED">Completed</option>}
                                </>
                              )}
                            </select>
                          ) : (
                            <Badge className={projectStatusColors[p.status]}>{p.status === 'PENDING_REVIEW' ? 'PENDING REVIEW' : p.status}</Badge>
                          )}
                          {p.priority && (
                            <Badge className={p.priority === 'URGENT' ? 'bg-red-100 text-red-700' : p.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}>
                              {p.priority}
                            </Badge>
                          )}
                        </div>
                        {p.description && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">{p.description}</p>
                        )}
                        {p.deadline && (
                          <p className="text-xs text-slate-400 mt-1">📅 Deadline: {p.deadline}</p>
                        )}
                      </div>

                      {/* Actions — only visible for manager */}
                      {isManager && (
                        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(p)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span>{p.total_stories} {p.total_stories === 1 ? 'story' : 'stories'}</span>
                      <span>{p.completed_tasks}/{p.total_tasks} tasks</span>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {p.member_count}
                      </span>
                    </div>

                    <div className="mt-3">
                      <ProgressBar value={p.progress} showLabel={false} />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-slate-400">{p.progress}% complete</span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-brand-500" /> Recent Activity
            </h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {!stats?.recent_activity?.length ? (
                <p className="text-sm text-slate-400 text-center py-8">No activity yet</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {stats.recent_activity.map((a) => (
                    <div key={a.id} className="px-4 py-3 flex gap-3 items-start hover:bg-slate-50 transition-colors">
                      <Avatar name={a.user.name} color={a.user.avatar_color} size="xs" className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-snug">
                          <span className="font-medium">{a.user.name}</span>{' '}
                          <span className="text-slate-500">{a.action.replace(/_/g, ' ')}</span>{' '}
                          {a.entity_name && (
                            <span className="font-medium text-slate-700 truncate">"{a.entity_name}"</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatRelative(a.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="New Project" onClose={() => setShowCreate(false)}>
          <ProjectForm
            form={form} setForm={setForm} error={error}
            isEdit={false} saving={saving}
            onSave={saveCreate} onCancel={() => setShowCreate(false)}
            teamLeaders={teamLeaders}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="Edit Project" onClose={() => setShowEdit(null)}>
          <ProjectForm
            form={form} setForm={setForm} error={error}
            isEdit={true} saving={saving}
            onSave={saveEdit} onCancel={() => setShowEdit(null)}
            teamLeaders={[]}
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="Delete Project" onClose={() => setDeleteTarget(null)} size="sm">
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">
              Are you sure you want to delete <span className="font-semibold">"{deleteTarget.name}"</span>?
              This will permanently remove all stories and tasks inside it.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  )
}
