import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { authApi } from '../api'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

const ROLES: { value: UserRole; label: string; description: string; icon: string }[] = [
  {
    value: 'MANAGER',
    label: 'Manager',
    icon: '👑',
    description: 'Create & oversee all projects',
  },
  {
    value: 'TEAM_LEADER',
    label: 'Team Leader',
    icon: '🧑‍💼',
    description: 'Create stories, assign tasks',
  },
  {
    value: 'MEMBER',
    label: 'Team Member',
    icon: '👤',
    description: 'Work on assigned tasks',
  },
]

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('MEMBER')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    console.log('=== REGISTER FLOW START ===')
    console.log('1. Form submitted:', { name, email, role })
    
    try {
      console.log('2. Calling register API...')
      const { data } = await authApi.register({ name, email, password, role })
      console.log('3. ✅ Register response:', {
        hasToken: !!data.access_token,
        user: data.user
      })
      
      console.log('4. Saving to localStorage...')
      localStorage.setItem('tf_token', data.access_token)
      localStorage.setItem('tf_user', JSON.stringify(data.user))
      const savedToken = localStorage.getItem('tf_token')
      console.log('5. Token saved:', !!savedToken)
      
      console.log('6. Calling login()...')
      login(data.access_token, data.user)
      
      console.log('7. 🚀 Navigating to /dashboard...')
      navigate('/dashboard', { replace: true })
      console.log('8. navigate() called')
      
    } catch (err: any) {
      console.error('❌ REGISTER ERROR:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
      console.log('=== REGISTER FLOW END ===')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl mb-4 shadow-lg shadow-brand-200">
            <span className="text-white font-bold text-xl">TF</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Join TeamFlow</h1>
          <p className="text-slate-500 mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                required placeholder="John Smith"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required placeholder="Min. 6 characters"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm pr-10 transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      role === r.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio" name="role" value={r.value}
                      checked={role === r.value} onChange={() => setRole(r.value)}
                      className="sr-only"
                    />
                    <span className="text-xl">{r.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${role === r.value ? 'text-brand-700' : 'text-slate-700'}`}>
                        {r.label}
                      </p>
                      <p className="text-xs text-slate-500">{r.description}</p>
                    </div>
                    {role === r.value && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <UserPlus size={18} />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
