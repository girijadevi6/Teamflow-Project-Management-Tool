import { useState, FormEvent } from 'react'
import { User, Palette, Save, Shield } from 'lucide-react'
import { authApi } from '../api'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Avatar from '../components/Avatar'

const AVATAR_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
  '#f97316', '#84cc16',
]

const ROLE_INFO: Record<string, { label: string; description: string; icon: string; color: string }> = {
  MANAGER:     { label: 'Manager',     icon: '👑', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', description: 'Can create projects, manage all members and oversee the full team.' },
  TEAM_LEADER: { label: 'Team Leader', icon: '🧑‍💼', color: 'bg-blue-50 text-blue-700 border-blue-200',   description: 'Can create user stories, assign tasks, and manage project members.' },
  MEMBER:      { label: 'Member',      icon: '👤', color: 'bg-slate-50 text-slate-700 border-slate-200',  description: 'Can view assigned tasks and update their status.' },
}

export default function Profile() {
  const { user, login, token } = useAuth()
  const [name, setName]           = useState(user?.name || '')
  const [color, setColor]         = useState(user?.avatar_color || '#6366f1')
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true); setError(''); setSuccess(false)
    try {
      const { data } = await authApi.updateMe({ name, avatar_color: color })
      login(token!, data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to update profile')
    } finally { setSaving(false) }
  }

  const roleInfo = user ? ROLE_INFO[user.role] : null

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User size={22} className="text-brand-500" /> Profile
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your account settings</p>
        </div>

        <div className="space-y-5">
          {/* Avatar preview */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5">
            <Avatar name={name || 'U'} color={color} size="lg" className="w-16 h-16 text-xl" />
            <div>
              <p className="font-semibold text-slate-800 text-lg">{name || 'Your Name'}</p>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              {roleInfo && (
                <span className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleInfo.color}`}>
                  {roleInfo.icon} {roleInfo.label}
                </span>
              )}
            </div>
          </div>

          {/* Edit form */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <Palette size={16} className="text-brand-500" /> Appearance
            </h2>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mb-4 flex items-center gap-2"><Save size={14} /> Profile updated successfully!</p>}

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Avatar Color</label>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`w-9 h-9 rounded-full transition-all hover:scale-110 ${color === c ? 'ring-4 ring-offset-2 ring-brand-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input value={user?.email || ''} disabled
                  className="w-full px-4 py-2.5 border border-slate-100 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Role info card */}
          {roleInfo && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Shield size={16} className="text-brand-500" /> Role & Permissions
              </h2>
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${roleInfo.color}`}>
                <span className="text-2xl">{roleInfo.icon}</span>
                <div>
                  <p className="font-semibold">{roleInfo.label}</p>
                  <p className="text-sm mt-0.5 opacity-80">{roleInfo.description}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {user?.role === 'MANAGER' && (
                  <>
                    <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Create and delete projects</p>
                    <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Add / remove team members</p>
                    <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Full access to all project data</p>
                  </>
                )}
                {user?.role === 'TEAM_LEADER' && (
                  <>
                    <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Create user stories and tasks</p>
                    <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Assign tasks to members</p>
                    <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Update and delete stories/tasks</p>
                  </>
                )}
                {user?.role === 'MEMBER' && (
                  <>
                    <p className="flex items-center gap-2"><span className="text-green-500">✓</span> View assigned tasks</p>
                    <p className="flex items-center gap-2"><span className="text-green-500">✓</span> Update status of your tasks</p>
                    <p className="flex items-center gap-2"><span className="text-red-400">✗</span> Cannot create stories or tasks</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
