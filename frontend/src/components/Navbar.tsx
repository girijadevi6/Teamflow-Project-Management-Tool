import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, LayoutDashboard, FolderKanban, LogOut, User, ChevronDown, CheckSquare, BarChart3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { notificationsApi } from '../api'
import Avatar from './Avatar'
import type { Notification } from '../types'
import { formatRelative } from '../utils'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnread = async () => {
    try {
      const { data } = await notificationsApi.unreadCount()
      setUnread(data.count)
    } catch {}
  }

  const openNotifs = async () => {
    setShowNotifs(!showNotifs)
    setShowUserMenu(false)
    if (!showNotifs) {
      const { data } = await notificationsApi.list()
      setNotifs(data)
    }
  }

  const markAllRead = async () => {
    await notificationsApi.markAllRead()
    setUnread(0)
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navLink = (to: string, label: string, Icon: React.ElementType) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/')
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Icon size={16} />
        {label}
      </Link>
    )
  }

  const notifIcon: Record<string, string> = {
    TASK_ASSIGNED: '📋', TASK_STATUS_CHANGED: '🔄', TASK_DUE_SOON: '⏰', TASK_OVERDUE: '⚠️',
    STORY_COMPLETED: '✅', PROJECT_ADDED: '🏗️', PROJECT_STATUS_CHANGED: '📢',
    PROJECT_DEADLINE_APPROACHING: '🚨', COMMENT_ADDED: '💬', TASK_UNASSIGNED: '👤',
    TASK_SUBMITTED_FOR_REVIEW: '📝', TASK_CHANGES_REQUESTED: '🔙', TASK_APPROVED: '✅',
    PROJECT_SUBMITTED_FOR_REVIEW: '📥', PROJECT_CHANGES_REQUESTED: '📢', PROJECT_COMPLETED: '🎉',
    DAILY_DIGEST: '📊', URGENT_TASK_ASSIGNED: '🚨', TASK_URGENT_DUE: '🚨', URGENT_TASK_DUE_SOON: '🚨',
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-brand-600 select-none">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">TF</div>
        TeamFlow
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-1">
        {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
        {navLink('/projects', 'Projects', FolderKanban)}
        {navLink('/my-tasks', 'My Tasks', CheckSquare)}
        {(user?.role === 'MANAGER' || user?.role === 'TEAM_LEADER') && navLink('/reports', 'Reports', BarChart3)}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifs}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand-500 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No notifications</p>
                ) : (
                  notifs.map((n) => (
                    <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 cursor-default ${!n.is_read ? 'bg-brand-50' : ''}`}>
                      <div className="flex gap-3 items-start">
                        <span className="text-lg mt-0.5">{notifIcon[n.type] || '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!n.is_read ? 'text-slate-800' : 'text-slate-600'}`}>{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatRelative(n.created_at)}</p>
                        </div>
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-100">
                <Link
                  to="/notifications"
                  className="block text-center text-sm text-brand-500 hover:underline font-medium"
                  onClick={() => setShowNotifs(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false) }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Avatar name={user?.name || 'U'} color={user?.avatar_color} size="sm" />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-800 leading-none">{user?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setShowUserMenu(false)}
              >
                <User size={15} /> Profile
              </Link>
              <button
                onClick={() => { logout(); navigate('/login') }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
