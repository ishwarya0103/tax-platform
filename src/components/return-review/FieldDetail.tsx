import { useState } from 'react'
import { ArrowRight, CheckCircle2, CircleAlert, FileText, Info, Lock, Pencil, type LucideIcon } from 'lucide-react'
import { documents } from '../../data'
import { FieldStateBadge, ThreadVisibilityBadge } from '../../design-system'
import { formatDateTime } from '../../lib/format'
import { valueAppearsInSnippet } from '../../lib/traceability'
import type { EditHistoryEntry, FieldWarning, FieldWarningSeverity, MessageThread, ReturnField } from '../../types'

const WARNING_STYLES: Record<FieldWarningSeverity, { className: string; icon: LucideIcon }> = {
  critical: { className: 'border-rose-200 bg-rose-50 text-rose-800', icon: CircleAlert },
  warning: { className: 'border-amber-200 bg-amber-50 text-amber-800', icon: CircleAlert },
  info: { className: 'border-slate-200 bg-slate-50 text-slate-700', icon: Info },
}

function WarningItem({ warning }: { warning: FieldWarning }) {
  const { className, icon: Icon } = WARNING_STYLES[warning.severity]
  return (
    <li className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{warning.message}</span>
    </li>
  )
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const tone =
    value >= 0.85
      ? { bar: 'bg-emerald-500', text: 'text-emerald-700', label: 'High confidence' }
      : value >= 0.6
        ? { bar: 'bg-amber-500', text: 'text-amber-700', label: 'Medium confidence' }
        : { bar: 'bg-rose-500', text: 'text-rose-700', label: 'Low confidence' }
  return (
    <div>
      <p className={`text-sm font-semibold ${tone.text}`}>
        {pct}% · {tone.label}
      </p>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// A binary badge, deliberately not a meter/percentage like ConfidenceMeter above
// it — this is a different KIND of signal (a plain textual fact-check, not a
// graduated self-reported belief), and the flat shape says so before the color
// or copy does.
function TraceabilityCheck({ field }: { field: ReturnField }) {
  if (!field.source) return null
  const matched = valueAppearsInSnippet(field.value, field.source.snippet)

  return matched ? (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
      <span>Verified against source text</span>
    </div>
  ) : (
    <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
      <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
      <span>Could not confirm this exact figure in the cited source</span>
    </div>
  )
}

function RelatedConversation({ threads, onJumpToThread }: { threads: MessageThread[]; onJumpToThread: (threadId: string) => void }) {
  if (threads.length === 0) return null
  return (
    <ul className="mt-2 space-y-2">
      {threads.map((thread) => (
        <li key={thread.id}>
          <button
            type="button"
            onClick={() => onJumpToThread(thread.id)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ThreadVisibilityBadge visibility={thread.visibility} />
              <span className="truncate text-slate-700">{thread.subject}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-600">
              View conversation
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function EditHistoryItem({ entry }: { entry: EditHistoryEntry }) {
  return (
    <li className="border-l-2 border-slate-200 pl-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{entry.actorName}</span>
        <span className="text-xs text-slate-400">{formatDateTime(entry.timestamp)}</span>
      </div>
      <p className="text-sm text-slate-600">
        {entry.previousValue && <span className="text-slate-400 line-through">{entry.previousValue} </span>}
        <span className="font-medium text-slate-900">{entry.newValue}</span>
      </p>
      {entry.note && <p className="text-xs text-slate-400">{entry.note}</p>}
    </li>
  )
}

function ValueEditor({ field, onSave }: { field: ReturnField; onSave: (newValue: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(field.value)
  const editable = field.state !== 'locked'

  if (!editable) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500">
        <Lock className="size-4 shrink-0" aria-hidden="true" />
        <span className="font-medium">{field.value}</span>
        <span className="ml-auto text-xs text-slate-400">Locked — can't be edited</span>
      </div>
    )
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const trimmed = draft.trim()
          if (trimmed && trimmed !== field.value) onSave(trimmed)
          setEditing(false)
        }}
      >
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDraft(field.value)
                setEditing(false)
              }
            }}
            className="flex-1 rounded-lg border border-indigo-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(field.value)
              setEditing(false)
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">Press Enter to save, Esc to cancel.</p>
      </form>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-left hover:border-indigo-400 hover:bg-indigo-50"
      >
        <span className="font-medium text-slate-900">{field.value}</span>
        <Pencil className="ml-auto size-4 text-slate-400" aria-hidden="true" />
      </button>
      <p className="mt-1 text-xs text-slate-400">Click to correct this value.</p>
    </div>
  )
}

interface FieldDetailProps {
  field: ReturnField
  relatedThreads: MessageThread[]
  onSave: (newValue: string) => void
  onJumpToThread: (threadId: string) => void
}

export function FieldDetail({ field, relatedThreads, onSave, onJumpToThread }: FieldDetailProps) {
  const source = field.source
  const document = source ? documents.find((d) => d.id === source.documentId) : undefined

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-2xl">
        <p className="text-xs tracking-wide text-slate-400 uppercase">{field.formLine}</p>
        <div className="mt-1 flex items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">{field.label}</h2>
          <FieldStateBadge state={field.state} />
        </div>

        <section className="mt-6">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Value</h3>
          <div className="mt-2">
            <ValueEditor field={field} onSave={onSave} />
          </div>
        </section>

        {field.transformationExplanation && (
          <section className="mt-6">
            <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">How this was filled in</h3>
            <p className="mt-2 text-sm text-slate-700">{field.transformationExplanation}</p>
          </section>
        )}

        {field.aiConfidence !== undefined && (
          <section className="mt-6">
            <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">AI confidence</h3>
            <div className="mt-2">
              <ConfidenceMeter value={field.aiConfidence} />
            </div>
            {field.aiReasoning && <p className="mt-3 text-sm text-slate-700">{field.aiReasoning}</p>}
          </section>
        )}

        {field.source && (
          <section className="mt-6">
            <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Traceability check</h3>
            <p className="mt-1 text-xs text-slate-400">
              An independent, deterministic check of the cited text — not the AI's own confidence score.
            </p>
            <div className="mt-2">
              <TraceabilityCheck field={field} />
            </div>
          </section>
        )}

        {field.warnings.length > 0 && (
          <section className="mt-6">
            <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Warnings</h3>
            <ul className="mt-2 space-y-2">
              {field.warnings.map((warning) => (
                <WarningItem key={warning.id} warning={warning} />
              ))}
            </ul>
          </section>
        )}

        {source && (
          <section className="mt-6">
            <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Source document</h3>
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="size-4 text-slate-400" aria-hidden="true" />
                {document?.fileName ?? 'Unknown document'}
                <span className="font-normal text-slate-400">· Page {source.page}</span>
              </div>
              <blockquote className="mt-2 border-l-2 border-indigo-300 pl-3 text-sm text-slate-600 italic">
                {source.snippet}
              </blockquote>
            </div>
          </section>
        )}

        {relatedThreads.length > 0 && (
          <section className="mt-6">
            <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Related conversation</h3>
            <RelatedConversation threads={relatedThreads} onJumpToThread={onJumpToThread} />
          </section>
        )}

        <section className="mt-6 mb-6">
          <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Edit history</h3>
          {field.editHistory.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No edits yet.</p>
          ) : (
            <ol className="mt-2 space-y-3">
              {[...field.editHistory].reverse().map((entry) => (
                <EditHistoryItem key={entry.id} entry={entry} />
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
