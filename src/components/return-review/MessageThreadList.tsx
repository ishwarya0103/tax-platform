import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, ChevronRight, RotateCcw, Search } from 'lucide-react'
import { ThreadStatusBadge, ThreadVisibilityBadge } from '../../design-system'
import { formatDateTime } from '../../lib/format'
import { nextActionOwner } from '../../lib/messages'
import type { MessageThread, MessageVisibility, ReturnField, ThreadStatus } from '../../types'

function NextActionLine({ thread }: { thread: MessageThread }) {
  const owner = nextActionOwner(thread)
  if (owner === null) return <p className="text-xs text-slate-400">Resolved — no action needed.</p>
  return (
    <p className="text-xs font-medium text-slate-500">
      Next action: <span className={owner === 'client' ? 'text-violet-600' : 'text-indigo-600'}>{owner === 'client' ? 'Client' : 'Firm'}</span>
    </p>
  )
}

interface MessageThreadCardProps {
  thread: MessageThread
  relatedField?: ReturnField
  focused: boolean
  expanded: boolean
  onToggleExpanded: (threadId: string) => void
  onToggleStatus: (threadId: string) => void
  onJumpToField: (fieldId: string) => void
}

function MessageThreadCard({ thread, relatedField, focused, expanded, onToggleExpanded, onToggleStatus, onJumpToField }: MessageThreadCardProps) {
  return (
    <div
      id={`thread-${thread.id}`}
      className={`scroll-mt-6 rounded-xl border bg-white transition-colors ${focused ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-slate-200'}`}
    >
      <button type="button" onClick={() => onToggleExpanded(thread.id)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
        <div className="flex min-w-0 items-start gap-2">
          <ChevronRight className={`mt-1 size-3.5 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{thread.subject}</p>
            {relatedField && (
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onJumpToField(relatedField.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                    onJumpToField(relatedField.id)
                  }
                }}
                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
              >
                Re: {relatedField.label}
                <ArrowRight className="size-3 shrink-0" aria-hidden="true" />
              </span>
            )}
            {!expanded && <NextActionLine thread={thread} />}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThreadVisibilityBadge visibility={thread.visibility} />
          <ThreadStatusBadge status={thread.status} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <NextActionLine thread={thread} />
          <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            {thread.messages.map((message) => (
              <li key={message.id} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-700">{message.authorName}</span>
                  <span className="text-xs text-slate-400">{formatDateTime(message.createdAt)}</span>
                </div>
                <p className="text-slate-600">{message.body}</p>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleStatus(thread.id)
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {thread.status === 'open' ? (
              <>
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Mark answered
              </>
            ) : (
              <>
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Reopen
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

const STATUS_FILTER_OPTIONS: { value: ThreadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'answered', label: 'Answered' },
]

const VISIBILITY_FILTER_OPTIONS: { value: MessageVisibility | 'all'; label: string }[] = [
  { value: 'all', label: 'All conversations' },
  { value: 'client-visible', label: 'Client-visible' },
  { value: 'internal', label: 'Internal only' },
]

interface MessageThreadListProps {
  threads: MessageThread[]
  fields: ReturnField[]
  focusedThreadId?: string | null
  onToggleStatus: (threadId: string) => void
  onJumpToField: (fieldId: string) => void
}

export function MessageThreadList({ threads, fields, focusedThreadId, onToggleStatus, onJumpToField }: MessageThreadListProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ThreadStatus | 'all'>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<MessageVisibility | 'all'>('all')
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(() => new Set(focusedThreadId ? [focusedThreadId] : []))

  // A deep link into a specific thread (from a field's "Related conversation"
  // list, or restoring a prior view) should always land expanded, not
  // collapsed-and-technically-scrolled-to.
  useEffect(() => {
    if (!focusedThreadId) return
    setExpandedThreads((prev) => (prev.has(focusedThreadId) ? prev : new Set(prev).add(focusedThreadId)))
  }, [focusedThreadId])

  if (threads.length === 0) return null

  const sorted = [...threads].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const filtered = sorted.filter((thread) => {
    if (statusFilter !== 'all' && thread.status !== statusFilter) return false
    if (visibilityFilter !== 'all' && thread.visibility !== visibilityFilter) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return thread.subject.toLowerCase().includes(q) || thread.messages.some((m) => m.body.toLowerCase().includes(q))
  })

  function toggleExpanded(threadId: string) {
    setExpandedThreads((prev) => {
      const next = new Set(prev)
      if (next.has(threadId)) next.delete(threadId)
      else next.add(threadId)
      return next
    })
  }

  return (
    <section id="messages-panel" className="scroll-mt-6 border-t border-slate-200 px-6 py-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Messages</h2>
        <span className="text-xs text-slate-400">
          {filtered.length} of {threads.length}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ThreadStatus | 'all')}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value as MessageVisibility | 'all')}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600"
        >
          {VISIBILITY_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 space-y-3">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No conversations match.</p>
        ) : (
          filtered.map((thread) => {
            const relatedField = thread.relatedFieldId ? fields.find((f) => f.id === thread.relatedFieldId) : undefined
            return (
              <MessageThreadCard
                key={thread.id}
                thread={thread}
                relatedField={relatedField}
                focused={thread.id === focusedThreadId}
                expanded={expandedThreads.has(thread.id)}
                onToggleExpanded={toggleExpanded}
                onToggleStatus={onToggleStatus}
                onJumpToField={onJumpToField}
              />
            )
          })
        )}
      </div>
    </section>
  )
}
