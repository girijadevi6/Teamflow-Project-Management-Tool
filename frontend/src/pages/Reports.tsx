import { useState, useEffect } from 'react'
import { BarChart3, Download, FileText, TrendingUp, Users, AlertTriangle, CheckCircle2, Clock, Timer } from 'lucide-react'
import { projectsApi, reportsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import Badge from '../components/Badge'
import type { ProjectSummary } from '../types'
import { projectStatusColors } from '../utils'

interface ProjectReport {
  project: {
    id: number
    name: string
    status: string
    description: string | null
    deadline: string | null
    total_members: number
  }
  summary: {
    total_stories: number
    total_tasks: number
    completed_tasks: number
    in_progress_tasks: number
    in_review_tasks: number
    todo_tasks: number
    overdue_tasks: number
    progress: number
    total_story_points: number
    completed_story_points: number
    velocity: number
  }
  story_breakdown: {
    story_id: number
    story_title: string
    status: string
    priority: string
    total_tasks: number
    todo: number
    in_progress: number
    in_review: number
    done: number
    progress: number
  }[]
  team_workload: {
    user_id: number
    name: string
    total_assigned: number
    completed: number
    in_progress: number
    in_review: number
    todo: number
    story_points_completed: number
  }[]
  overdue_tasks: {
    task_id: number
    title: string
    due_date: string | null
    assignee: string
    status: string
    story_title: string
  }[]
  generated_at: string
}

function ProgressDonut({ value, size = 120, strokeWidth = 10 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = value >= 80 ? '#10b981' : value >= 50 ? '#3b82f6' : value >= 25 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
          fill="none" stroke="#e2e8f0" />
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
          fill="none" stroke={color} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold text-slate-800">{value}%</span>
      </div>
    </div>
  )
}

function StatusBar({ todo, inProgress, inReview, done, total }: {
  todo: number; inProgress: number; inReview: number; done: number; total: number
}) {
  if (total === 0) return <div className="h-3 bg-slate-100 rounded-full" />
  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
      {done > 0 && <div className="bg-green-500 transition-all" style={{ width: `${(done / total) * 100}%` }} title={`Done: ${done}`} />}
      {inReview > 0 && <div className="bg-purple-500 transition-all" style={{ width: `${(inReview / total) * 100}%` }} title={`In Review: ${inReview}`} />}
      {inProgress > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${(inProgress / total) * 100}%` }} title={`In Progress: ${inProgress}`} />}
      {todo > 0 && <div className="bg-slate-300 transition-all" style={{ width: `${(todo / total) * 100}%` }} title={`To Do: ${todo}`} />}
    </div>
  )
}

export default function Reports() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [report, setReport] = useState<ProjectReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const { data } = await projectsApi.list()
      setProjects(data)
      if (data.length > 0) {
        setSelectedProject(data[0].id)
        loadReport(data[0].id)
      }
    } finally { setLoading(false) }
  }

  const loadReport = async (projectId: number) => {
    setReportLoading(true)
    try {
      const { data } = await reportsApi.getProjectReport(projectId)
      setReport(data as ProjectReport)
    } catch {
      setReport(null)
    } finally { setReportLoading(false) }
  }

  const downloadCSV = async () => {
    if (!selectedProject || !report) return
    try {
      const token = localStorage.getItem('tf_token')
      const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${base}/reports/project/${selectedProject}/download`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${report.project.name.replace(/\s+/g, '_').toLowerCase()}_${report.generated_at}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('CSV download failed', e)
    }
  }

  const handleProjectChange = (id: number) => {
    setSelectedProject(id)
    loadReport(id)
  }

  if (loading) return <Layout><Spinner className="mt-32" /></Layout>

  const isManagerOrLeader = user?.role === 'MANAGER' || user?.role === 'TEAM_LEADER'
  if (!isManagerOrLeader) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-700">Reports are available for managers and team leaders</h2>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={24} className="text-brand-500" /> Reports
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Project status reports and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedProject ?? ''}
              onChange={e => handleProjectChange(Number(e.target.value))}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none min-w-[200px]"
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={downloadCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
              <Download size={16} /> Download CSV
            </button>
          </div>
        </div>

        {reportLoading ? (
          <Spinner className="mt-16" />
        ) : !report ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Select a project to view its report</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-center">
                <ProgressDonut value={report.summary.progress} />
                <p className="text-sm font-medium text-slate-600 mt-2">Overall Progress</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 size={20} className="text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{report.summary.completed_tasks}</p>
                    <p className="text-xs text-slate-400">Completed</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Timer size={20} className="text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{report.summary.in_progress_tasks}</p>
                    <p className="text-xs text-slate-400">In Progress</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <FileText size={20} className="text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{report.summary.in_review_tasks}</p>
                    <p className="text-xs text-slate-400">In Review</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <FileText size={20} className="text-slate-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{report.summary.todo_tasks}</p>
                    <p className="text-xs text-slate-400">To Do</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <AlertTriangle size={20} className="text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">{report.summary.overdue_tasks}</p>
                    <p className="text-xs text-slate-400">Overdue</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <TrendingUp size={20} className="text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{report.summary.velocity}</p>
                    <p className="text-xs text-slate-400">SP Done</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Distribution Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Task Distribution</h3>
              <StatusBar
                todo={report.summary.todo_tasks}
                inProgress={report.summary.in_progress_tasks}
                inReview={report.summary.in_review_tasks}
                done={report.summary.completed_tasks}
                total={report.summary.total_tasks}
              />
              <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Done ({report.summary.completed_tasks})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> In Review ({report.summary.in_review_tasks})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> In Progress ({report.summary.in_progress_tasks})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> To Do ({report.summary.todo_tasks})</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Story Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Story Breakdown</h3>
                <div className="space-y-4">
                  {report.story_breakdown.map(s => (
                    <div key={s.story_id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700 truncate flex-1">{s.story_title}</span>
                        <span className="text-xs text-slate-400 ml-2">{s.progress}%</span>
                      </div>
                      <StatusBar todo={s.todo} inProgress={s.in_progress} inReview={s.in_review} done={s.done} total={s.total_tasks} />
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <Badge className={s.status === 'DONE' ? 'bg-green-100 text-green-700' : s.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}>{s.status}</Badge>
                        <span>{s.total_tasks} tasks</span>
                      </div>
                    </div>
                  ))}
                  {report.story_breakdown.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No stories</p>
                  )}
                </div>
              </div>

              {/* Team Workload */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Users size={16} className="text-brand-500" /> Team Workload
                </h3>
                <div className="space-y-3">
                  {report.team_workload.map(w => (
                    <div key={w.user_id} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{w.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBar todo={w.todo} inProgress={w.in_progress} inReview={w.in_review} done={w.completed} total={w.total_assigned} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-shrink-0">
                        <span>{w.total_assigned} tasks</span>
                        <span className="text-green-600 font-medium">{w.completed} done</span>
                        <span>{w.story_points_completed} SP</span>
                      </div>
                    </div>
                  ))}
                  {report.team_workload.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No team members</p>
                  )}
                </div>
              </div>
            </div>

            {/* Overdue Tasks */}
            {report.overdue_tasks.length > 0 && (
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-red-600 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} /> Overdue Tasks ({report.overdue_tasks.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                        <th className="pb-2 font-medium">Task</th>
                        <th className="pb-2 font-medium">Story</th>
                        <th className="pb-2 font-medium">Assignee</th>
                        <th className="pb-2 font-medium">Due Date</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.overdue_tasks.map(t => (
                        <tr key={t.task_id} className="border-b border-slate-50 last:border-0">
                          <td className="py-2.5 font-medium text-slate-700">{t.title}</td>
                          <td className="py-2.5 text-slate-500">{t.story_title}</td>
                          <td className="py-2.5 text-slate-500">{t.assignee}</td>
                          <td className="py-2.5 text-red-500 font-medium">{t.due_date}</td>
                          <td className="py-2.5"><Badge className="bg-red-100 text-red-700">{t.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 text-right">Report generated: {report.generated_at}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
