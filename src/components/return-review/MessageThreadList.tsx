import { CheckCircle2, RotateCcw } from 'lucide-react'
import { ThreadStatusBadge, ThreadVisibilityBadge } from '../../design-system'
import { formatDateTime } from '../../lib/format'
import { nextActionOwner } from '../../lib/messages'
import type { MessageThread, ReturnField } from '../../types'

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
  relatedFieldLabel?: string
  onToggleStatus: (threadId: string) => void
}

function MessageThreadCard({ thread, relatedFieldLabel, onToggleStatus }: MessageThreadCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{thread.subject}</p>
          {relatedFieldLabel && <p className="text-xs text-slate-400">Re: {relatedFieldLabel}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThreadVisibilityBadge visibility={thread.visibility} />
          <ThreadStatusBadge status={thread.status} />
        </div>
      </div>

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
        onClick={() => onToggleStatus(thread.id)}
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
  )
}

interface MessageThreadListProps {
  threads: MessageThread[]
  fields: ReturnField[]
  onToggleStatus: (threadId: string) => void
}

export function MessageThreadList({ threads, fields, onToggleStatus }: MessageThreadListProps) {
  if (threads.length === 0) return null

  const sorted = [...threads].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  return (
    <section className="border-t border-slate-200 px-6 py-6">
      <h2 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Messages</h2>
      <div className="mt-3 space-y-3">
        {sorted.map((thread) => {
          const relatedField = thread.relatedFieldId ? fields.find((f) => f.id === thread.relatedFieldId) : undefined
          return (
            <MessageThreadCard
              key={thread.id}
              thread={thread}
              relatedFieldLabel={relatedField?.label}
              onToggleStatus={onToggleStatus}
            />
          )
        })}
      </div>
    </section>
  )
}
