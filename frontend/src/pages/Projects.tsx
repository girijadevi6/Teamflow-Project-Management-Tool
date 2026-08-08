import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, FolderKanban, Search, Filter, Grid3X3, List,
  Pencil, Trash2, Users, X, ChevronRight, SlidersHorizontal,
} from 'lucide-react'
import { projectsApi, authApi } from '../api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import ProgressBar from '../components/ProgressBar'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import type { ProjectSummary, User } from '../types'
import { projectStatusColors } from '../utils'

const STATUSES = ['PLANNING', 'ACTIVE', 'PENDING', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

interface ProjectFormFields {
  name: string
  description: string
  status: string
  priority: string
  deadline: string | null
  team_leader_id: number | null
}

function ProjectForm({ form, setForm, error, isEdit, saving, onSave, onCancel, teamLeaders }: {
  form: ProjectFormFields
  setForm: (f: ProjectFormFields) => void
  error: string
  isEdit: boolean
  saving: boolean
  onSave: () => void
  onCancel: () => void
  teamLeaders: User[]
}) {
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

export default function Projects() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<ProjectSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null)
  const [form, setForm] = useState<ProjectFormFields>({ name: '', description: '', status: 'PLANNING', priority: '', deadline: null, team_leader_id: null })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [teamLeaders, setTeamLeaders] = useState<User[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const res = await projectsApi.list()
      setProjects(res.data)
    } finally { setLoading(false) }
  }

  const fetchTeamLeaders = async () => {
    try {
      const { data } = await authApi.listUsers()
      setTeamLeaders(data.filter((u: User) => u.role === 'TEAM_LEADER'))
    } catch { setTeamLeaders([]) }
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
      await projectsApi.create({
        name: form.name,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority || undefined,
        deadline: form.deadline || null,
        team_leader_id: form.team_leader_id || null,
      })
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
      await projectsApi.update(showEdit.id, {
        name: form.name,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority || undefined,
        deadline: form.deadline || null,
      })
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

  // Filtering
  const filtered = projects.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.description || '').toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus && p.status !== filterStatus) return false
    if (filterPriority && p.priority !== filterPriority) return false
    return true
  })

  const hasFilters = search || filterStatus || filterPriority
  const clearFilters = () => { setSearch(''); setFilterStatus(''); setFilterPriority('') }

  // Stats
  const totalActive = projects.filter(p => p.status === 'ACTIVE').length
  const totalCompleted = projects.filter(p => p.status === 'COMPLETED').length

  if (loading) return <Layout><Spinner className="mt-32" /></Layout>

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FolderKanban size={24} className="text-brand-500" /> Projects
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {projects.length} total · {totalActive} active · {totalCompleted} completed
            </p>
          </div>
          {isManager && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm shadow-brand-200">
              <Plus size={18} /> New Project
            </button>
          )}
        </div>

        {/* Search & filter bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <SlidersHorizontal size={15} className="text-slate-400 flex-shrink-0" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
              <X size={13} /> Clear
            </button>
          )}
          <div className="ml-auto flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <Grid3X3 size={16} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Projects */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
            <FolderKanban size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">
              {hasFilters ? 'No projects match your filters' : 'No projects yet'}
            </p>
            {isManager && !hasFilters && (
              <button onClick={openCreate}
                className="mt-4 px-5 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
                Create your first project
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <div key={p.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-brand-100 transition-all cursor-pointer group card-hover-lift"
                onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate">
                        {p.name}
                      </h3>
                    </div>
                  </div>
                  {isManager && (
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-3" onClick={(e) => e.stopPropagation()}>
                  {(isManager || user?.role === 'TEAM_LEADER') ? (
                    <select
                      value={p.status}
                      onChange={(e) => {
                        e.stopPropagation()
                        const newStatus = e.target.value
                        if (newStatus === p.status) return
                        projectsApi.updateStatus(p.id, newStatus).then(() => loadAll()).catch((err) => {
                          alert(err.response?.data?.detail || 'Failed to update project status')
                        })
                      }}
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
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{p.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                  <span>{p.total_stories} {p.total_stories === 1 ? 'story' : 'stories'}</span>
                  <span>{p.completed_tasks}/{p.total_tasks} tasks</span>
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {p.member_count}
                  </span>
                </div>

                {p.deadline && (
                  <p className="text-xs text-slate-400 mb-3">📅 Deadline: {p.deadline}</p>
                )}

                <ProgressBar value={p.progress} showLabel={false} />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-400">{p.progress}% complete</span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {filtered.map((p) => (
              <div key={p.id}
                className="bg-white rounded-xl border border-slate-100 px-5 py-4 hover:shadow-md hover:border-brand-100 transition-all cursor-pointer group flex items-center gap-4"
                onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate">
                      {p.name}
                    </h3>
                    <Badge className={projectStatusColors[p.status]}>{p.status}</Badge>
                    {p.priority && (
                      <Badge className={p.priority === 'URGENT' ? 'bg-red-100 text-red-700' : p.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}>
                        {p.priority}
                      </Badge>
                    )}
                  </div>
                  {p.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>}
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-400 flex-shrink-0">
                  <span>{p.total_stories} stories</span>
                  <span>{p.completed_tasks}/{p.total_tasks} tasks</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {p.member_count}</span>
                  <div className="w-20">
                    <ProgressBar value={p.progress} showLabel={false} />
                    <p className="text-center text-xs text-slate-400 mt-0.5">{p.progress}%</p>
                  </div>
                </div>
                {isManager && (
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(p)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
                <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-400 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
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
