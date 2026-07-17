import type { FieldState, ReturnField } from '../../types'

// Plain-language stand-ins for the preparer-facing FieldState vocabulary.
// Deliberately separate from design-system/tokens.ts's FIELD_STATE_CONFIG —
// that one is written for preparers ("needs-review", "locked"); this one is
// written for the person whose return it is.
const CLIENT_STATUS_TEXT: Record<FieldState, string> = {
  'ai-extracted': 'Pulled from your documents',
  'needs-review': 'Your preparer is double-checking this',
  verified: 'Confirmed by your preparer',
  'client-provided': 'Provided by you',
  locked: 'Finalized',
}

export function ClientFieldRow({ field }: { field: ReturnField }) {
  return (
    <div className="border-b border-slate-100 px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">{field.label}</p>
        <p className="text-sm text-slate-700">{field.value}</p>
      </div>
      <p className="mt-1 text-xs text-slate-400">{CLIENT_STATUS_TEXT[field.state]}</p>
      {field.transformationExplanation && <p className="mt-1 text-xs text-slate-500">{field.transformationExplanation}</p>}
    </div>
  )
}
