import { useState, useEffect } from 'react'
import { MessageSquare, Send, Pencil, Trash2 } from 'lucide-react'
import { commentsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import Spinner from './Spinner'
import type { Comment } from '../types'
import { formatRelative } from '../utils'

interface TaskCommentsProps {
  taskId: number
  isManagerOrLeader?: boolean
}

export default function TaskComments({ taskId, isManagerOrLeader }: TaskCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadComments()
  }, [taskId])

  const loadComments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await commentsApi.list(taskId)
      setComments(res.data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async () => {
    if (!content.trim()) return
    setPosting(true)
    setError('')
    try {
      const res = await commentsApi.create(taskId, { content: content.trim() })
      setComments(prev => [...prev, res.data])
      setContent('')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  const handleStartEdit = (c: Comment) => {
    setEditingId(c.id)
    setEditContent(c.content)
  }

  const handleSaveEdit = async (commentId: number) => {
    if (!editContent.trim()) return
    setUpdating(true)
    try {
      const res = await commentsApi.update(commentId, { content: editContent.trim() })
      setComments(prev => prev.map(c => (c.id === commentId ? res.data : c)))
      setEditingId(null)
      setEditContent('')
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to update comment')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await commentsApi.delete(commentId, taskId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to delete comment')
    }
  }

  const formatCommentTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr.endsWith('Z') || dateStr.includes('T') ? dateStr : dateStr + 'Z')
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return `${timeStr} (${formatRelative(dateStr)})`
    } catch {
      return formatRelative(dateStr)
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare size={16} className="text-brand-500" />
          Discussion <span className="text-xs font-semibold text-slate-400">({comments.length})</span>
        </h4>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</p>}

      {/* Comment List */}
      {loading ? (
        <div className="py-4 text-center">
          <Spinner className="my-2" />
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-4 text-center border border-dashed border-slate-200">
          <p className="text-xs text-slate-400">No comments yet. Start the discussion below!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {comments.map((c) => {
            const isAuthor = c.user_id === user?.id
            const canManage = isAuthor || isManagerOrLeader || user?.role === 'MANAGER'

            return (
              <div key={c.id} className="bg-slate-50/90 rounded-xl p-3 border border-slate-100 space-y-1.5 group">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={c.user?.name || 'User'} color={c.user?.avatar_color} size="xs" />
                    <span className="text-xs font-bold text-slate-800">{c.user?.name}</span>
                    {c.user?.role && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium uppercase">
                        {c.user.role.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400" title={new Date(c.created_at).toLocaleString()}>
                      {formatCommentTime(c.created_at)}
                    </span>
                    {canManage && editingId !== c.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(c)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                            title="Edit comment"
                          >
                            <Pencil size={11} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editingId === c.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(c.id)}
                        disabled={updating || !editContent.trim()}
                        className="px-2.5 py-1 text-xs bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-60 transition-colors"
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-7">{c.content}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Post comment form */}
      <div className="space-y-2 pt-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              handlePost()
            }
          }}
          rows={2}
          placeholder="Write a comment... (Ctrl+Enter to post)"
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs resize-none bg-white"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Ctrl+Enter to submit</span>
          <button
            type="button"
            onClick={handlePost}
            disabled={posting || !content.trim()}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Send size={12} /> {posting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>
    </div>
  )
}
