import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { clients, documents, teamMembers } from '../data'
import { useReturnsData } from '../context/ReturnsDataContext'
import { useCurrentUser } from '../context/CurrentUserContext'
import { useMessageThreads } from '../context/MessageThreadsContext'
import { ReturnStatusBadge, StageTimeline } from '../design-system'
import { dueDateLabel, dueDateRelativeLabel } from '../lib/scoring'
import { Breadcrumbs, type BreadcrumbItem } from '../components/Breadcrumbs'
import { FieldList } from '../components/return-review/FieldList'
import { FieldDetail } from '../components/return-review/FieldDetail'
import { MessageThreadList } from '../components/return-review/MessageThreadList'
import { DocumentList } from '../components/return-review/DocumentList'
import type { EditActorType, StaffRole } from '../types'

function roleToActorType(role: StaffRole): EditActorType {
  if (role === 'reviewer' || role === 'partner') return 'reviewer'
  return 'preparer'
}

export function ReturnReview() {
  const { returnId } = useParams<{ returnId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { getReturn, saveFieldValue } = useReturnsData()
  const { currentUser } = useCurrentUser()
  const { messageThreads, toggleThreadStatus } = useMessageThreads()
  const ret = returnId ? getReturn(returnId) : undefined

  const threadsForReturn = ret ? messageThreads.filter((t) => t.returnId === ret.id) : []
  const threadParam = searchParams.get('thread')
  const focusedThread = threadParam ? threadsForReturn.find((t) => t.id === threadParam) : undefined
  // A field param wins if present; otherwise, deep-linking straight to a
  // thread still shows the field it's about, so the two panels agree.
  const fieldParam = searchParams.get('field') ?? focusedThread?.relatedFieldId
  const selectedField = ret?.fields.find((f) => f.id === fieldParam) ?? ret?.fields[0]

  // Whichever cross-link was followed (or a direct deep link was pasted in),
  // scroll the relevant panel into view. Only fires when a param is actually
  // present, so a plain click into a return from the dashboard never
  // auto-scrolls anywhere.
  useEffect(() => {
    if (threadParam) {
      document.getElementById('messages-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (searchParams.get('field')) {
      document.getElementById('field-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadParam, searchParams.get('field')])

  // Every in-page selection change uses `replace`, not the default push —
  // these are all "look at something else within the same return," not
  // separate pages, so they shouldn't each grow the browser history stack.
  // Without this, the "Dashboard" breadcrumb's navigate(-1) would only undo
  // the last field/thread selection instead of actually leaving the page.
  function selectField(fieldId: string) {
    setSearchParams({ field: fieldId }, { replace: true })
  }

  function jumpToField(fieldId: string) {
    setSearchParams({ field: fieldId }, { replace: true })
  }

  function jumpToThread(threadId: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('thread', threadId)
        return next
      },
      { replace: true },
    )
  }

  if (!ret) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Return not found.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  const client = clients.find((c) => c.id === ret.clientId)!
  const preparer = teamMembers.find((tm) => tm.id === ret.preparerId)
  const reviewer = ret.reviewerId ? teamMembers.find((tm) => tm.id === ret.reviewerId) : undefined
  const relatedThreadsForSelectedField = selectedField
    ? threadsForReturn.filter((t) => t.relatedFieldId === selectedField.id)
    : []

  const breadcrumbItems: BreadcrumbItem[] = [{ label: 'Dashboard', onClick: () => navigate(-1) }]
  breadcrumbItems.push({ label: client.name, onClick: () => setSearchParams({}, { replace: true }) })
  if (threadParam && focusedThread) {
    breadcrumbItems.push({ label: focusedThread.subject })
  } else if (selectedField) {
    breadcrumbItems.push({ label: selectedField.label })
  }

  return (
    <div className="min-h-svh bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{client.name}</h1>
            <p className="text-sm text-slate-500">
              {ret.id} · TY{ret.taxYear} · Due {dueDateLabel(ret)} · {dueDateRelativeLabel(ret)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ReturnStatusBadge status={ret.status} />
            <div className="text-xs text-slate-500">
              {preparer && <span>Preparer: {preparer.name}</span>}
              {reviewer && <span className="ml-2">Reviewer: {reviewer.name}</span>}
            </div>
          </div>
        </div>
        <div className="mt-4 max-w-xl">
          <StageTimeline status={ret.status} />
        </div>
      </header>

      {ret.fields.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-slate-400">No fields have been built out for this return yet.</div>
      ) : (
        <div id="field-panel" className="flex h-[560px] scroll-mt-6 overflow-hidden border-b border-slate-200">
          <FieldList fields={ret.fields} selectedFieldId={selectedField?.id ?? null} onSelect={selectField} />
          {selectedField && (
            <FieldDetail
              key={selectedField.id}
              field={selectedField}
              relatedThreads={relatedThreadsForSelectedField}
              onSave={(newValue) =>
                saveFieldValue(ret.id, selectedField.id, newValue, {
                  type: roleToActorType(currentUser.role),
                  name: currentUser.name,
                })
              }
              onJumpToThread={jumpToThread}
            />
          )}
        </div>
      )}

      <MessageThreadList
        threads={threadsForReturn}
        fields={ret.fields}
        focusedThreadId={threadParam}
        onToggleStatus={toggleThreadStatus}
        onJumpToField={jumpToField}
      />

      <DocumentList documents={documents.filter((d) => d.returnId === ret.id)} />
    </div>
  )
}
