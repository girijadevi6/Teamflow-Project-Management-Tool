import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, Filter, X } from 'lucide-react'
import { notificationsApi } from '../api'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import type { Notification, NotificationType } from '../types'
import { formatRelative } from '../utils'

const TYPE_META: Record<NotificationType, { icon: string; color: string }> = {
  TASK_ASSIGNED:                { icon: '📋', color: 'bg-blue-50 border-blue-100' },
  TASK_STATUS_CHANGED:          { icon: '🔄', color: 'bg-purple-50 border-purple-100' },
  TASK_DUE_SOON:                { icon: '⏰', color: 'bg-yellow-50 border-yellow-100' },
  TASK_OVERDUE:                 { icon: '⚠️', color: 'bg-red-50 border-red-100' },
  STORY_COMPLETED:              { icon: '✅', color: 'bg-green-50 border-green-100' },
  PROJECT_ADDED:                { icon: '🏗️', color: 'bg-brand-50 border-brand-100' },
  PROJECT_STATUS_CHANGED:       { icon: '📌', color: 'bg-indigo-50 border-indigo-100' },
  PROJECT_DEADLINE_APPROACHING: { icon: '⏳', color: 'bg-amber-50 border-amber-100' },
  COMMENT_ADDED:                { icon: '💬', color: 'bg-slate-50 border-slate-100' },
  TASK_COMMENTED:               { icon: '💬', color: 'bg-slate-50 border-slate-100' },
  TASK_UNASSIGNED:              { icon: '👤', color: 'bg-orange-50 border-orange-100' },
}

const FILTER_TYPES: { value: string; label: string }[] = [
  { value: '',                   label: 'All Types' },
  { value: 'TASK_ASSIGNED',      label: 'Task Assigned' },
  { value: 'TASK_STATUS_CHANGED',label: 'Status Changed' },
  { value: 'TASK_DUE_SOON',      label: 'Due Soon' },
  { value: 'STORY_COMPLETED',    label: 'Story Completed' },
  { value: 'PROJECT_ADDED',      label: 'Project Added' },
  { value: 'TASK_UNASSIGNED',    label: 'Unassigned' },
]

export default function Notifications() {
  const [notifs, setNotifs]         = useState<Notification[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterType, setFilterType] = useState('')
  const [showUnread, setShowUnread] = useState(false)
  const [selected, setSelected]     = useState<Set<number>>(new Set())

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await notificationsApi.list()
      setNotifs(data)
    } finally { setLoading(false) }
  }

  const markRead = async (ids: number[]) => {
    await notificationsApi.markRead(ids)
    setNotifs(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await notificationsApi.markAllRead()
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const deleteNotif = async (id: number) => {
    await notificationsApi.delete(id)
    setNotifs(prev => prev.filter(n => n.id !== id))
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const deleteSelected = async () => {
    await Promise.all([...selected].map(id => notificationsApi.delete(id)))
    setNotifs(prev => prev.filter(n => !selected.has(n.id)))
    setSelected(new Set())
  }

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const selectAll = () => {
    const visible = filtered.map(n => n.id)
    const allSelected = visible.every(id => selected.has(id))
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(visible))
  }

  const filtered = notifs.filter(n => {
    if (showUnread && n.is_read) return false
    if (filterType && n.type !== filterType) return false
    return true
  })

  const unreadCount = notifs.filter(n => !n.is_read).length

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Bell size={22} className="text-brand-500" /> Notifications
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button onClick={deleteSelected}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                <Trash2 size={14} /> Delete ({selected.size})
              </button>
            )}
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-50 text-brand-600 border border-brand-200 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 outline-none">
            {FILTER_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={showUnread} onChange={e => setShowUnread(e.target.checked)}
              className="w-4 h-4 rounded accent-brand-500" />
            Unread only
          </label>
          {(filterType || showUnread) && (
            <button onClick={() => { setFilterType(''); setShowUnread(false) }}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
              <X size={13} /> Clear
            </button>
          )}
          <div className="ml-auto">
            <button onClick={selectAll} className="text-xs text-slate-400 hover:text-brand-500 font-medium transition-colors">
              {filtered.every(n => selected.has(n.id)) && filtered.length > 0 ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <Spinner className="mt-16" />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <Bell size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No notifications</p>
            <p className="text-slate-400 text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => {
              const meta = TYPE_META[n.type] || { icon: '🔔', color: 'bg-slate-50 border-slate-100' }
              const isSelected = selected.has(n.id)
              return (
                <div key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                    isSelected ? 'ring-2 ring-brand-400 ' : ''
                  }${!n.is_read ? meta.color + ' shadow-sm' : 'bg-white border-slate-100'}`}>

                  {/* Checkbox */}
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(n.id)}
                    className="mt-1 w-4 h-4 rounded accent-brand-500 flex-shrink-0 cursor-pointer" />

                  {/* Icon */}
                  <span className="text-xl flex-shrink-0 mt-0.5">{meta.icon}</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-snug ${!n.is_read ? 'text-slate-800' : 'text-slate-600'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1.5">{formatRelative(n.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.is_read && (
                      <button onClick={() => markRead([n.id])}
                        title="Mark as read"
                        className="p-1.5 rounded-lg hover:bg-green-50 text-slate-300 hover:text-green-500 transition-colors">
                        <Check size={15} />
                      </button>
                    )}
                    <button onClick={() => deleteNotif(n.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
