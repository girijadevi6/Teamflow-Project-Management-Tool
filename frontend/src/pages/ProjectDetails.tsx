import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Plus, ArrowLeft, Users, LayoutDashboard, Pencil, Trash2,
  ChevronDown, ChevronUp, MoreHorizontal, KanbanSquare, UserPlus, X,
  Send, CheckCircle, RotateCcw, Check, Filter, ArrowUpDown, ListFilter,
  Search, LayoutGrid, List,
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
import TaskDiscussionDrawer from '../components/TaskDiscussionDrawer'
import type { Project, Story, Task, User } from '../types'
import {
  priorityColors, storyStatusColors, projectStatusColors,
  taskStatusColors, formatDate, getTaskStatusLabel,
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

function TaskForm({ form, setForm, members, onCancel, onSave, saving, error, taskId, isManagerOrLeader }: any) {
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
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date & Time</label>
          <input type="datetime-local" value={form.due_date ?? ''} onChange={(e: any) => setForm({ ...form, due_date: e.target.value || null })}
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
  const [loadError, setLoadError] = useState('')

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
  const [activeDrawerTask, setActiveDrawerTask] = useState<Task | null>(null)

  // Project review modal
  const [showProjectReviewModal, setShowProjectReviewModal] = useState(false)
  const [projectReviewComment, setProjectReviewComment] = useState('')

  // Forms
  const [storyForm, setStoryForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', assigned_to: null as number | null, due_date: null as string | null, story_points: 1, estimated_hours: null as number | null })
  const [showRejectComment, setShowRejectComment] = useState<{ taskId: number } | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'MEMBER' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // User Story Search, View Mode, Filter & Sort state
  const [storySearch, setStorySearch] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [storyViewMode, setStoryViewMode] = useState<'grid' | 'list'>('list')
  const [storyStatusFilter, setStoryStatusFilter] = useState('')
  const [storyPriorityFilter, setStoryPriorityFilter] = useState('')
  const [storySortBy, setStorySortBy] = useState('default')

  // Per-Story Task Filter & Sort state
  const [taskFilters, setTaskFilters] = useState<Record<number, { status: string; priority: string; sortBy: string }>>({})
  const [openTaskFilterPopover, setOpenTaskFilterPopover] = useState<number | null>(null)

  // Close task filter popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openTaskFilterPopover !== null) {
        const target = event.target as HTMLElement
        if (!target.closest('.task-filter-popover-container')) {
          setOpenTaskFilterPopover(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openTaskFilterPopover])


  const updateTaskFilter = (storyId: number, key: 'status' | 'priority' | 'sortBy', value: string) => {
    setTaskFilters(prev => ({
      ...prev,
      [storyId]: {
        status: prev[storyId]?.status || '',
        priority: prev[storyId]?.priority || '',
        sortBy: prev[storyId]?.sortBy || 'default',
        [key]: value,
      }
    }))
  }

  const priorityRankMap: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
  const storyStatusRankMap: Record<string, number> = { TODO: 1, IN_PROGRESS: 2, DONE: 3 }
  const taskStatusRankMap: Record<string, number> = { TODO: 1, IN_PROGRESS: 2, IN_REVIEW: 3, DONE: 4 }

  const filteredStories = stories.filter(s => {
    if (storySearch.trim()) {
      const q = storySearch.toLowerCase()
      const titleMatch = s.title.toLowerCase().includes(q)
      const descMatch = s.description ? s.description.toLowerCase().includes(q) : false
      if (!titleMatch && !descMatch) return false
    }
    if (storyStatusFilter && s.status !== storyStatusFilter) return false
    if (storyPriorityFilter && s.priority !== storyPriorityFilter) return false
    return true
  }).sort((a, b) => {
    if (storySortBy === 'priority_desc') return (priorityRankMap[b.priority] || 0) - (priorityRankMap[a.priority] || 0)
    if (storySortBy === 'priority_asc') return (priorityRankMap[a.priority] || 0) - (priorityRankMap[b.priority] || 0)
    if (storySortBy === 'status') return (storyStatusRankMap[a.status] || 0) - (storyStatusRankMap[b.status] || 0)
    if (storySortBy === 'title') return a.title.localeCompare(b.title)
    return 0
  })


  const getFilteredTasksForStory = (story: Story) => {
    const filter = taskFilters[story.id] || { status: '', priority: '', sortBy: 'default' }
    let list = [...story.tasks]

    if (filter.status) {
      list = list.filter(t => t.status === filter.status)
    }
    if (filter.priority) {
      list = list.filter(t => t.priority === filter.priority)
    }

    if (filter.sortBy === 'priority_desc') {
      list.sort((a, b) => (priorityRankMap[b.priority] || 0) - (priorityRankMap[a.priority] || 0))
    } else if (filter.sortBy === 'priority_asc') {
      list.sort((a, b) => (priorityRankMap[a.priority] || 0) - (priorityRankMap[b.priority] || 0))
    } else if (filter.sortBy === 'status') {
      list.sort((a, b) => (taskStatusRankMap[a.status] || 0) - (taskStatusRankMap[b.status] || 0))
    } else if (filter.sortBy === 'due_date') {
      list.sort((a, b) => (a.due_date || '9999-12-31').localeCompare(b.due_date || '9999-12-31'))
    } else if (filter.sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title))
    }

    return list
  }

  const isManagerOrLeader = user?.role === 'MANAGER' || user?.role === 'TEAM_LEADER'

  const isManager = user?.role === 'MANAGER'
  const isTeamLeader = user?.role === 'TEAM_LEADER' || (project?.members.some(m => m.user.id === user?.id && m.role === 'TEAM_LEADER'))

  useEffect(() => { loadAll() }, [projectId])

  const loadAll = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [pRes, sRes] = await Promise.all([
        projectsApi.get(projectId),
        storiesApi.list(projectId),
      ])
      setProject(pRes.data)
      setStories(sRes.data)
      // expand first story by default
      if (sRes.data.length > 0) setExpanded({ [sRes.data[0].id]: true })
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Failed to load project'
      setLoadError(msg)
    } finally { setLoading(false) }
  }

  const loadUsers = async () => {
    const { data } = await authApi.listUsers()
    setAllUsers(data)
  }

  // Project review actions
  const handleSubmitProjectForReview = async () => {
    const incompleteStoriesCount = stories.filter(s => s.status !== 'DONE').length
    const allTasks = stories.flatMap(s => s.tasks)
    const incompleteTasksCount = allTasks.filter(t => t.status !== 'DONE').length

    if (stories.length === 0) {
      alert("Task incomplete: Cannot submit project for review. The project has no user stories. All user stories and tasks must be created and completed first.")
      return
    }

    if (incompleteStoriesCount > 0 || incompleteTasksCount > 0) {
      const parts = []
      if (incompleteStoriesCount > 0) parts.push(`${incompleteStoriesCount} incomplete user story(ies)`)
      if (incompleteTasksCount > 0) parts.push(`${incompleteTasksCount} incomplete task(s)`)
      alert(`Task incomplete: Cannot submit project to manager for review. All user stories and tasks must be marked as DONE before submitting (${parts.join(', ')} remaining).`)
      return
    }

    try {
      await projectsApi.updateStatus(projectId, 'PENDING_REVIEW')
      loadAll()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to submit project for review')
    }
  }

  const handleApproveProject = async () => {
    try {
      await projectsApi.updateStatus(projectId, 'COMPLETED')
      loadAll()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to mark project as completed')
    }
  }

  const handleRequestProjectChanges = async () => {
    try {
      await projectsApi.updateStatus(projectId, 'ACTIVE', projectReviewComment)
      setShowProjectReviewModal(false)
      setProjectReviewComment('')
      loadAll()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to request changes')
    }
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
    } catch (e: any) {
      setFormError(e.response?.data?.detail || 'Failed to save story')
    } finally { setSaving(false) }
  }

  const confirmDeleteStory = async () => {
    if (!deleteStory) return
    try { await storiesApi.delete(deleteStory.id); setDeleteStory(null); loadAll() } catch { }
  }

  // ── Task CRUD ────────────────────────────────────────────────────────────────

  const openAddTask = (storyId: number) => {
    setTaskForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', assigned_to: null, due_date: null, story_points: 1, estimated_hours: null })
    setFormError(''); setShowAddTask(storyId)
  }
  const openEditTask = (t: Task) => {
    setTaskForm({ title: t.title, description: t.description || '', priority: t.priority, status: t.status, assigned_to: t.assigned_to, due_date: t.due_date, story_points: t.story_points, estimated_hours: t.estimated_hours ?? null })
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
    } catch (e: any) {
      setFormError(e.response?.data?.detail || 'Failed to save task')
    } finally { setSaving(false) }
  }

  const confirmDeleteTask = async () => {
    if (!deleteTask) return
    try { await tasksApi.delete(deleteTask.id); setDeleteTask(null); loadAll() } catch { }
  }

  const changeTaskStatus = async (taskId: number, status: string, comment?: string) => {
    try { await tasksApi.updateStatus(taskId, status, comment); loadAll() } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update status')
    }
  }

  // Role-based allowed status transitions
  const getAllowedStatuses = (currentStatus: string): string[] => {
    if (user?.role === 'MANAGER' || user?.role === 'TEAM_LEADER') {
      if (currentStatus === 'IN_REVIEW') {
        return ['IN_REVIEW', 'DONE', 'REQUEST_CHANGES']
      }
      return TASK_STATUSES
    }
    const allowed: Record<string, string[]> = {
      'TODO': ['IN_PROGRESS'],
      'IN_PROGRESS': ['TODO', 'IN_REVIEW'],
      'IN_REVIEW': ['IN_PROGRESS'],
      'DONE': [],
    }
    return [currentStatus, ...(allowed[currentStatus] || [])]
  }

  const handleStatusChange = (taskId: number, currentStatus: string, newStatus: string) => {
    if (newStatus === currentStatus) return
    if (
      (newStatus === 'REQUEST_CHANGES' || (currentStatus === 'IN_REVIEW' && newStatus === 'IN_PROGRESS')) &&
      (user?.role === 'MANAGER' || user?.role === 'TEAM_LEADER')
    ) {
      setShowRejectComment({ taskId })
      setRejectComment('')
      return
    }
    changeTaskStatus(taskId, newStatus)
  }

  const handleStoryStatusChange = async (storyId: number, newStatus: string) => {
    try {
      await storiesApi.update(storyId, { status: newStatus as any })
      loadAll()
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update story status')
    }
  }

  const confirmReject = () => {
    if (!showRejectComment) return
    changeTaskStatus(showRejectComment.taskId, 'IN_PROGRESS', rejectComment)
    setShowRejectComment(null)
    setRejectComment('')
  }

  // Role-based allowed project status transitions
  const getAllowedProjectStatuses = (currentStatus: string): string[] => {
    if (isManager) {
      return ['PLANNING', 'ACTIVE', 'PENDING_REVIEW', 'COMPLETED', 'ON_HOLD', 'ARCHIVED']
    }
    if (isTeamLeader) {
      const allowed: Record<string, string[]> = {
        'PLANNING': ['PLANNING', 'ACTIVE'],
        'ACTIVE': ['ACTIVE', 'PENDING_REVIEW'],
        'PENDING_REVIEW': ['PENDING_REVIEW', 'ACTIVE'],
        'COMPLETED': ['COMPLETED'],
        'ON_HOLD': ['ON_HOLD'],
        'ARCHIVED': ['ARCHIVED'],
      }
      return allowed[currentStatus] || [currentStatus]
    }
    return [currentStatus]
  }

  const handleProjectStatusSelect = (newStatus: string) => {
    if (!project || newStatus === project.status) return

    if (newStatus === 'PENDING_REVIEW' && project.status !== 'PENDING_REVIEW') {
      const incompleteStoriesCount = stories.filter(s => s.status !== 'DONE').length
      const allTasks = stories.flatMap(s => s.tasks)
      const incompleteTasksCount = allTasks.filter(t => t.status !== 'DONE').length

      if (stories.length === 0) {
        alert("Task incomplete: Cannot submit project for review. The project has no user stories. All user stories and tasks must be created and completed first.")
        return
      }

      if (incompleteStoriesCount > 0 || incompleteTasksCount > 0) {
        const parts = []
        if (incompleteStoriesCount > 0) parts.push(`${incompleteStoriesCount} incomplete user story(ies)`)
        if (incompleteTasksCount > 0) parts.push(`${incompleteTasksCount} incomplete task(s)`)
        alert(`Task incomplete: Cannot submit project to manager for review. All user stories and tasks must be marked as DONE before submitting (${parts.join(', ')} remaining).`)
        return
      }
    }

    // If manager moves from PENDING_REVIEW back to ACTIVE (or requests changes)
    if (isManager && project.status === 'PENDING_REVIEW' && newStatus === 'ACTIVE') {
      setShowProjectReviewModal(true)
      return
    }
    // General update
    projectsApi.updateStatus(projectId, newStatus).then(() => loadAll()).catch((e) => {
      alert(e.response?.data?.detail || 'Failed to update project status')
    })
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
    } catch (e: any) {
      setFormError(e.response?.data?.detail || 'Failed to add member')
    } finally { setSaving(false) }
  }

  const removeMember = async (userId: number) => {
    try { await projectsApi.removeMember(projectId, userId); loadAll() } catch { }
  }

  if (loading) return <Layout><Spinner className="mt-32" /></Layout>
  if (loadError || !project) return (
    <Layout>
      <div className="max-w-md mx-auto mt-32 text-center">
        <p className="text-slate-500 mb-2">{loadError || 'Project not found.'}</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => navigate('/projects')}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            ← Back to Projects
          </button>
          <button onClick={loadAll}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
            Retry
          </button>
        </div>
      </div>
    </Layout>
  )

  const totalTasks = stories.reduce((a, s) => a + s.total_tasks, 0)
  const doneTasks = stories.reduce((a, s) => a + s.completed_tasks, 0)
  const doneStories = stories.filter(s => s.status === 'DONE').length
  const progress = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0

  // Users not yet in the project
  const memberIds = new Set(project.members.map(m => m.user.id))
  const availableUsers = allUsers.filter(u => !memberIds.has(u.id))

  const allowedProjectStatuses = getAllowedProjectStatuses(project.status)

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb + header */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link to="/projects" className="hover:text-brand-500 flex items-center gap-1"><ArrowLeft size={14} /> Projects</Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">{project.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>

              {/* Interactive Status Dropdown */}
              {(isManager || isTeamLeader) ? (
                <div className="relative inline-flex items-center">
                  <select
                    value={project.status}
                    onChange={(e) => handleProjectStatusSelect(e.target.value)}
                    className={`text-xs font-bold rounded-xl px-3 py-1.5 border outline-none cursor-pointer shadow-sm transition-all ${project.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-300' :
                      project.status === 'PENDING_REVIEW' ? 'bg-purple-100 text-purple-700 border-purple-300 ring-2 ring-purple-200' :
                        project.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                          'bg-slate-100 text-slate-700 border-slate-300'
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
                        <option value="PLANNING">Planning</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING_REVIEW">Submit for Review</option>
                        {project.status === 'COMPLETED' && <option value="COMPLETED" disabled>Completed</option>}
                      </>
                    )}
                  </select>
                </div>
              ) : (
                <Badge className={projectStatusColors[project.status]}>
                  {project.status === 'PENDING_REVIEW' ? 'PENDING REVIEW' : project.status}
                </Badge>
              )}

              {project.priority && (
                <Badge className={project.priority === 'URGENT' ? 'bg-red-100 text-red-700' : project.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}>
                  {project.priority}
                </Badge>
              )}
            </div>
            {project.description && <p className="text-slate-500 mt-2 text-sm max-w-3xl">{project.description}</p>}
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-3">
              <span>Created by {project.created_by_user.name}</span>
              {project.deadline && <span>📅 Deadline: {project.deadline}</span>}
            </div>
          </div>

          {/* Action buttons / quick actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
            {/* Team Leader quick submit button */}
            {isTeamLeader && !isManager && project.status === 'ACTIVE' && (
              <button
                onClick={handleSubmitProjectForReview}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <Send size={15} /> Submit for Review
              </button>
            )}

            {/* Manager quick review buttons when status is PENDING_REVIEW */}
            {isManager && project.status === 'PENDING_REVIEW' && (
              <>
                <button
                  onClick={handleApproveProject}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <CheckCircle size={15} /> Mark Completed
                </button>
                <button
                  onClick={() => setShowProjectReviewModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <RotateCcw size={15} /> Request Changes
                </button>
              </>
            )}

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
            <div>
              <p className="text-xl font-bold text-slate-800">{stories.length}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Total Stories</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{doneStories} <span className="text-xs font-normal text-slate-400">/ {stories.length}</span></p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Stories Completed</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{totalTasks}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Total Tasks</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{doneTasks} <span className="text-xs font-normal text-slate-400">/ {totalTasks}</span></p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Tasks Completed</p>
            </div>
          </div>
        </div>

        {/* Stories section header + search + filter bar + view mode toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">User Stories</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
              {filteredStories.length} of {stories.length}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Icon / Expandable Input */}
            {isSearchOpen || storySearch ? (
              <div className="relative flex items-center animate-in fade-in zoom-in-95 duration-150">
                <Search size={13} className="absolute left-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={storySearch}
                  autoFocus
                  onChange={(e) => setStorySearch(e.target.value)}
                  className="w-44 sm:w-52 bg-slate-50 border border-brand-300 rounded-xl pl-8 pr-7 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-brand-200 transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setStorySearch('')
                    setIsSearchOpen(false)
                  }}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Close search"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                title="Search User Stories"
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-brand-600 rounded-xl transition-all shadow-sm flex items-center gap-1 text-xs font-medium"
              >
                <Search size={14} />
              </button>
            )}

            {/* Story Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-sm hover:border-slate-300 transition-colors">
              <Filter size={12} className="text-slate-400 shrink-0" />
              <select
                value={storyStatusFilter}
                onChange={(e) => setStoryStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Story Priority Filter */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-sm hover:border-slate-300 transition-colors">
              <select
                value={storyPriorityFilter}
                onChange={(e) => setStoryPriorityFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Story Sort By */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-sm hover:border-slate-300 transition-colors">
              <ArrowUpDown size={12} className="text-slate-400 shrink-0" />
              <select
                value={storySortBy}
                onChange={(e) => setStorySortBy(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="default">Default Sort</option>
                <option value="priority_desc">Priority: High → Low</option>
                <option value="priority_asc">Priority: Low → High</option>
                <option value="status">Status</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>


            {/* View Mode Toggle Switch (Grid vs List) matching screenshot */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setStoryViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-all ${
                  storyViewMode === 'grid'
                    ? 'bg-white text-brand-600 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setStoryViewMode('list')}
                title="List View"
                className={`p-1.5 rounded-lg transition-all ${
                  storyViewMode === 'list'
                    ? 'bg-white text-brand-600 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List size={15} />
              </button>
            </div>

            {/* Reset story search & filters */}
            {(storySearch || storyStatusFilter || storyPriorityFilter || storySortBy !== 'default') && (
              <button
                onClick={() => {
                  setStorySearch('')
                  setStoryStatusFilter('')
                  setStoryPriorityFilter('')
                  setStorySortBy('default')
                }}
                className="text-xs text-brand-600 hover:text-brand-700 hover:underline px-1.5 py-1 font-medium"
              >
                Reset
              </button>
            )}

            {isManagerOrLeader && (
              <button onClick={openAddStory}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-medium transition-colors shadow-sm ml-auto sm:ml-0">
                <Plus size={15} /> Add Story
              </button>
            )}
          </div>
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
        ) : filteredStories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <p className="text-slate-500 font-medium text-sm">No user stories match your search or selected filters</p>
            <button
              onClick={() => {
                setStorySearch('')
                setStoryStatusFilter('')
                setStoryPriorityFilter('')
                setStorySortBy('default')
              }}
              className="mt-3 text-xs text-brand-600 hover:underline font-medium"
            >
              Clear story search & filters
            </button>
          </div>
        ) : storyViewMode === 'grid' ? (
          /* Grid View for User Stories */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStories.map((story) => {
              const isOpen = expanded[story.id]
              const storyFilteredTasks = getFilteredTasksForStory(story)
              const storyTaskFilter = taskFilters[story.id] || { status: '', priority: '', sortBy: 'default' }

              return (
                <div key={story.id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative ${openTaskFilterPopover === story.id ? 'z-30' : 'z-10'}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-slate-800 text-base leading-snug line-clamp-2">{story.title}</h3>
                      {isManagerOrLeader && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => openEditStory(story)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Edit Story">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteStory(story)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete Story">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {isManagerOrLeader ? (
                        <select
                          value={story.status}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleStoryStatusChange(story.id, e.target.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs font-semibold rounded-lg px-2.5 py-1 border outline-none cursor-pointer transition-colors shadow-sm ${
                            story.status === 'DONE'
                              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                              : story.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done (Completed)</option>
                        </select>
                      ) : (
                        <Badge className={storyStatusColors[story.status]}>{story.status.replace('_', ' ')}</Badge>
                      )}
                      <Badge className={priorityColors[story.priority]}>{story.priority}</Badge>
                    </div>

                    {story.description && (
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{story.description}</p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1 mt-auto pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Tasks ({story.completed_tasks}/{story.total_tasks})</span>
                        <span className="font-semibold text-slate-700">{story.progress}%</span>
                      </div>
                      <ProgressBar value={story.progress} showLabel={false} />
                    </div>
                  </div>

                  {/* Toggle tasks collapse inside card */}
                  <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [story.id]: !isOpen }))}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                    >
                      {isOpen ? (
                        <>
                          <ChevronUp size={14} /> Hide Tasks ({storyFilteredTasks.length})
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} /> View Tasks ({storyFilteredTasks.length})
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded Tasks List inside Grid Card */}
                  {isOpen && (
                    <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-3">
                      {story.tasks.length > 0 && (
                        <div className="flex items-center justify-between gap-1 text-xs mb-2">
                          <span className="text-[11px] font-medium text-slate-500">
                            Tasks ({storyFilteredTasks.length}/{story.tasks.length})
                          </span>

                          <div className="relative task-filter-popover-container">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenTaskFilterPopover(openTaskFilterPopover === story.id ? null : story.id)
                              }}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
                                storyTaskFilter.status || storyTaskFilter.priority || storyTaskFilter.sortBy !== 'default'
                                  ? 'bg-brand-50 border-brand-300 text-brand-600 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <Filter size={10} /> Filter
                            </button>

                            {openTaskFilterPopover === story.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                              >
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Filter size={12} className="text-brand-500" /> Filter Tasks
                                  </span>
                                  <button onClick={() => setOpenTaskFilterPopover(null)} className="text-slate-400 hover:text-slate-600 p-0.5 rounded">
                                    <X size={12} />
                                  </button>
                                </div>
                                <div className="space-y-2.5 text-xs">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                                    <select
                                      value={storyTaskFilter.status}
                                      onChange={(e) => updateTaskFilter(story.id, 'status', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-brand-400 focus:bg-white transition-all cursor-pointer font-medium"
                                    >
                                      <option value="">All Statuses</option>
                                      <option value="TODO">To Do</option>
                                      <option value="IN_PROGRESS">In Progress</option>
                                      <option value="IN_REVIEW">In Review</option>
                                      <option value="DONE">Done</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                                    <select
                                      value={storyTaskFilter.priority}
                                      onChange={(e) => updateTaskFilter(story.id, 'priority', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-brand-400 focus:bg-white transition-all cursor-pointer font-medium"
                                    >
                                      <option value="">All Priorities</option>
                                      <option value="LOW">Low</option>
                                      <option value="MEDIUM">Medium</option>
                                      <option value="HIGH">High</option>
                                      <option value="URGENT">Urgent</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sort By</label>
                                    <select
                                      value={storyTaskFilter.sortBy}
                                      onChange={(e) => updateTaskFilter(story.id, 'sortBy', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-brand-400 focus:bg-white transition-all cursor-pointer font-medium"
                                    >
                                      <option value="default">Default Sort</option>
                                      <option value="priority_desc">Priority: High → Low</option>
                                      <option value="priority_asc">Priority: Low → High</option>
                                      <option value="status">Status</option>
                                      <option value="due_date">Due Date</option>
                                      <option value="title">Title (A-Z)</option>
                                    </select>
                                  </div>
                                  {(storyTaskFilter.status || storyTaskFilter.priority || storyTaskFilter.sortBy !== 'default') && (
                                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                                      <button
                                        onClick={() => {
                                          updateTaskFilter(story.id, 'status', '')
                                          updateTaskFilter(story.id, 'priority', '')
                                          updateTaskFilter(story.id, 'sortBy', 'default')
                                        }}
                                        className="text-[11px] text-brand-600 hover:underline font-semibold"
                                      >
                                        Reset Filters
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}


                      {storyFilteredTasks.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">
                          {story.tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {storyFilteredTasks.map((task) => (
                            <div key={task.id} className="relative group">
                              <TaskCard
                                task={task}
                                onClick={() => openEditTask(task)}
                                onEdit={() => openEditTask(task)}
                                onDelete={isManagerOrLeader ? () => setDeleteTask(task) : undefined}
                                onCommentsClick={() => setActiveDrawerTask(task)}
                                headerActions={
                                  <select
                                    value={task.status}
                                    onChange={(e) => { e.stopPropagation(); handleStatusChange(task.id, task.status, e.target.value) }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`text-xs font-medium rounded-lg px-2 py-1 border outline-none cursor-pointer transition-colors ${
                                      task.status === 'DONE' ? 'bg-green-100 text-green-700 border-green-200' :
                                      task.status === 'IN_REVIEW' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                      'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {getAllowedStatuses(task.status).map(s => (
                                      <option key={s} value={s}>{getTaskStatusLabel(s as any, user?.role)}</option>
                                    ))}
                                  </select>
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {isManagerOrLeader && (
                        <button onClick={() => openAddTask(story.id)}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors pt-1">
                          <Plus size={13} /> Add task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* List View for User Stories (Accordion) */
          <div className="space-y-4">
            {filteredStories.map((story) => {
              const isOpen = expanded[story.id]
              const storyFilteredTasks = getFilteredTasksForStory(story)
              const storyTaskFilter = taskFilters[story.id] || { status: '', priority: '', sortBy: 'default' }

              return (
                <div key={story.id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm relative ${openTaskFilterPopover === story.id ? 'z-30' : 'z-10'}`}>
                  {/* Story header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpanded(prev => ({ ...prev, [story.id]: !isOpen }))}>
                    <div className="flex items-center gap-3 min-w-0">
                      {isOpen ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <span className="font-semibold text-slate-800 truncate">{story.title}</span>
                          {isManagerOrLeader ? (
                            <select
                              value={story.status}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleStoryStatusChange(story.id, e.target.value)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-xs font-semibold rounded-lg px-2.5 py-1 border outline-none cursor-pointer transition-colors shadow-sm ${
                                story.status === 'DONE'
                                  ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                                  : story.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="DONE">Done (Completed)</option>
                            </select>
                          ) : (
                            <Badge className={storyStatusColors[story.status]}>{story.status.replace('_', ' ')}</Badge>
                          )}
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
                      {/* Per-story task toolbar */}
                      {story.tasks.length > 0 && (
                        <div className="flex items-center justify-between gap-2 mb-3 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-100">
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                            <ListFilter size={13} className="text-slate-400" />
                            Tasks ({storyFilteredTasks.length} of {story.tasks.length})
                          </span>

                          {/* Single Filter Popover Button */}
                          <div className="relative task-filter-popover-container">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenTaskFilterPopover(openTaskFilterPopover === story.id ? null : story.id)
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all shadow-sm ${
                                storyTaskFilter.status || storyTaskFilter.priority || storyTaskFilter.sortBy !== 'default'
                                  ? 'bg-brand-50 border-brand-300 text-brand-600 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                              title="Filter & Sort Tasks"
                            >
                              <Filter size={12} className={storyTaskFilter.status || storyTaskFilter.priority || storyTaskFilter.sortBy !== 'default' ? 'text-brand-600' : 'text-slate-400'} />
                              <span>Filter</span>
                              {(storyTaskFilter.status || storyTaskFilter.priority || storyTaskFilter.sortBy !== 'default') && (
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                              )}
                            </button>

                            {/* Popover Dropdown Menu */}
                            {openTaskFilterPopover === story.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-30 animate-in fade-in zoom-in-95 duration-150"
                              >
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                    <Filter size={12} className="text-brand-500" /> Filter Tasks
                                  </span>
                                  <button
                                    onClick={() => setOpenTaskFilterPopover(null)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>

                                <div className="space-y-2.5 text-xs">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                                    <select
                                      value={storyTaskFilter.status}
                                      onChange={(e) => updateTaskFilter(story.id, 'status', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-brand-400 focus:bg-white transition-all cursor-pointer font-medium"
                                    >
                                      <option value="">All Statuses</option>
                                      <option value="TODO">To Do</option>
                                      <option value="IN_PROGRESS">In Progress</option>
                                      <option value="IN_REVIEW">In Review</option>
                                      <option value="DONE">Done</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
                                    <select
                                      value={storyTaskFilter.priority}
                                      onChange={(e) => updateTaskFilter(story.id, 'priority', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-brand-400 focus:bg-white transition-all cursor-pointer font-medium"
                                    >
                                      <option value="">All Priorities</option>
                                      <option value="LOW">Low</option>
                                      <option value="MEDIUM">Medium</option>
                                      <option value="HIGH">High</option>
                                      <option value="URGENT">Urgent</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Sort By</label>
                                    <select
                                      value={storyTaskFilter.sortBy}
                                      onChange={(e) => updateTaskFilter(story.id, 'sortBy', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:border-brand-400 focus:bg-white transition-all cursor-pointer font-medium"
                                    >
                                      <option value="default">Default Sort</option>
                                      <option value="priority_desc">Priority: High → Low</option>
                                      <option value="priority_asc">Priority: Low → High</option>
                                      <option value="status">Status</option>
                                      <option value="due_date">Due Date</option>
                                      <option value="title">Title (A-Z)</option>
                                    </select>
                                  </div>

                                  {(storyTaskFilter.status || storyTaskFilter.priority || storyTaskFilter.sortBy !== 'default') && (
                                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                                      <button
                                        onClick={() => {
                                          updateTaskFilter(story.id, 'status', '')
                                          updateTaskFilter(story.id, 'priority', '')
                                          updateTaskFilter(story.id, 'sortBy', 'default')
                                        }}
                                        className="text-[11px] text-brand-600 hover:underline font-semibold"
                                      >
                                        Reset Filters
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}


                      {story.tasks.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No tasks yet</p>
                      ) : storyFilteredTasks.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No tasks match the active filters</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                          {storyFilteredTasks.map((task) => (
                            <div key={task.id} className="relative group">
                              <TaskCard
                                task={task}
                                onClick={() => openEditTask(task)}
                                onEdit={() => openEditTask(task)}
                                onDelete={isManagerOrLeader ? () => setDeleteTask(task) : undefined}
                                onCommentsClick={() => setActiveDrawerTask(task)}
                                headerActions={
                                  <select
                                    value={task.status}
                                    onChange={(e) => { e.stopPropagation(); handleStatusChange(task.id, task.status, e.target.value) }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`text-xs font-medium rounded-lg px-2 py-1 border outline-none cursor-pointer transition-colors ${
                                      task.status === 'DONE' ? 'bg-green-100 text-green-700 border-green-200' :
                                      task.status === 'IN_REVIEW' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                      'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {getAllowedStatuses(task.status).map(s => (
                                      <option key={s} value={s}>{getTaskStatusLabel(s as any, user?.role)}</option>
                                    ))}
                                  </select>
                                }
                              />

                              {isManagerOrLeader && task.status === 'IN_REVIEW' && (
                                <div className="mt-2 p-2 bg-purple-50/80 rounded-xl border border-purple-100 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                                  <span className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                                    📝 Under Review
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => { setShowRejectComment({ taskId: task.id }); setRejectComment('') }}
                                      className="px-2.5 py-1 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                                    >
                                      <RotateCcw size={12} /> Request Changes
                                    </button>
                                    <button
                                      onClick={() => changeTaskStatus(task.id, 'DONE')}
                                      className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
                                    >
                                      <Check size={12} /> Approve
                                    </button>
                                  </div>
                                </div>
                              )}
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
            onCancel={() => setEditTask(null)} onSave={saveTask} saving={saving} error={formError}
            taskId={editTask.id} isManagerOrLeader={isManagerOrLeader} />
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
      {/* Project Request Changes Modal */}
      {showProjectReviewModal && (
        <Modal title="Request Project Changes" onClose={() => setShowProjectReviewModal(false)} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Please specify the changes or improvements required before this project can be marked completed.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Feedback / Comments *</label>
              <textarea
                value={projectReviewComment}
                onChange={(e) => setProjectReviewComment(e.target.value)}
                rows={3}
                placeholder="e.g. Please fix the remaining bugs in payment module..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowProjectReviewModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button onClick={handleRequestProjectChanges} disabled={!projectReviewComment.trim()} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">Submit Feedback</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject/Changes Requested Comment Modal */}
      {showRejectComment && (
        <Modal title="Request Changes" onClose={() => setShowRejectComment(null)} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              You are requesting changes on this task. The member will be notified and the task will be moved back to <span className="font-semibold text-blue-600">In Progress</span>.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Feedback / Comment (optional)
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={3}
                placeholder="Describe what changes are needed..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectComment(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={confirmReject}
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
