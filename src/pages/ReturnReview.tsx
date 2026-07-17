import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { clients, teamMembers } from '../data'
import { useReturnsData } from '../context/ReturnsDataContext'
import { useCurrentUser } from '../context/CurrentUserContext'
import { ReturnStatusBadge } from '../design-system'
import { dueDateLabel, dueDateRelativeLabel } from '../lib/scoring'
import { FieldList } from '../components/return-review/FieldList'
import { FieldDetail } from '../components/return-review/FieldDetail'
import type { EditActorType, StaffRole } from '../types'

function roleToActorType(role: StaffRole): EditActorType {
  if (role === 'reviewer' || role === 'partner') return 'reviewer'
  return 'preparer'
}

export function ReturnReview() {
  const { returnId } = useParams<{ returnId: string }>()
  const { getReturn, saveFieldValue } = useReturnsData()
  const { currentUser } = useCurrentUser()
  const ret = returnId ? getReturn(returnId) : undefined
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(ret?.fields[0]?.id ?? null)

  if (!ret) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Return not found.</p>
          <Link to="/" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const client = clients.find((c) => c.id === ret.clientId)!
  const preparer = teamMembers.find((tm) => tm.id === ret.preparerId)
  const reviewer = ret.reviewerId ? teamMembers.find((tm) => tm.id === ret.reviewerId) : undefined
  const selectedField = ret.fields.find((f) => f.id === selectedFieldId) ?? ret.fields[0]

  return (
    <div className="flex min-h-svh flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Dashboard
        </Link>
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
      </header>

      {ret.fields.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          No fields have been built out for this return yet.
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <FieldList fields={ret.fields} selectedFieldId={selectedField?.id ?? null} onSelect={setSelectedFieldId} />
          {selectedField && (
            <FieldDetail
              key={selectedField.id}
              field={selectedField}
              onSave={(newValue) =>
                saveFieldValue(ret.id, selectedField.id, newValue, {
                  type: roleToActorType(currentUser.role),
                  name: currentUser.name,
                })
              }
            />
          )}
        </div>
      )}
    </div>
  )
}
