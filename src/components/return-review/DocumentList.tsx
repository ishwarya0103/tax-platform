import { useState } from 'react'
import { ChevronRight, FileText, Search } from 'lucide-react'
import { DocumentStatusBadge } from '../../design-system'
import { DOCUMENT_TYPE_LABELS } from '../../lib/labels'
import { formatDateTime } from '../../lib/format'
import type { DocumentStatus, DocumentType, SourceDocument } from '../../types'

const TYPE_FILTER_OPTIONS: { value: DocumentType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  ...(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((value) => ({ value, label: DOCUMENT_TYPE_LABELS[value] })),
]

const STATUS_FILTER_OPTIONS: { value: DocumentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'processed', label: 'Processed' },
  { value: 'processing', label: 'Processing' },
  { value: 'needs-attention', label: 'Needs attention' },
]

export function DocumentList({ documents }: { documents: SourceDocument[] }) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')

  if (documents.length === 0) return null

  const filtered = documents.filter((doc) => {
    if (typeFilter !== 'all' && doc.documentType !== typeFilter) return false
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return doc.fileName.toLowerCase().includes(q)
  })

  const needsAttentionCount = documents.filter((d) => d.status === 'needs-attention').length

  return (
    <section id="documents-panel" className="scroll-mt-6 border-t border-slate-200 px-6 py-6">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-center gap-2 text-left">
        <ChevronRight className={`size-3.5 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} aria-hidden="true" />
        <h2 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Documents ({documents.length})</h2>
        {needsAttentionCount > 0 && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">{needsAttentionCount} need attention</span>
        )}
      </button>

      {expanded && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search file names…"
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-sm text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocumentType | 'all')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600"
            >
              {TYPE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="shrink-0 text-xs text-slate-400">
              {filtered.length} of {documents.length}
            </span>
          </div>

          <div className="mt-3 max-h-96 overflow-y-auto rounded-xl border border-slate-200">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No documents match.</p>
            ) : (
              filtered.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0">
                  <FileText className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{doc.fileName}</p>
                    <p className="text-xs text-slate-400">
                      {DOCUMENT_TYPE_LABELS[doc.documentType]} · {doc.pageCount} page{doc.pageCount === 1 ? '' : 's'} · uploaded {formatDateTime(doc.uploadedAt)}
                    </p>
                  </div>
                  <DocumentStatusBadge status={doc.status} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  )
}
