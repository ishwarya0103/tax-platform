import { CheckCircle2, CircleAlert, Lock } from 'lucide-react'
import type { MessageThread, ThreadStatus } from '../types'
import type { StatusVisual } from './tokens'
import { StatusBadge } from './StatusBadge'

// Same literal color families used throughout the design system (tokens.ts,
// FieldDetail.tsx) — amber for "needs attention," emerald for "done," slate
// for "neutral/inert." Redeclared locally rather than imported because
// Tailwind's scanner needs the literal class strings present in each file
// that uses them; this mirrors the existing pattern elsewhere in this app.
const amber = 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
const emerald = 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
const slate = 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'

const THREAD_STATUS_CONFIG: Record<ThreadStatus, StatusVisual> = {
  open: {
    label: 'Open',
    description: 'Still needs a reply before this can be closed out.',
    icon: CircleAlert,
    className: amber,
  },
  answered: {
    label: 'Answered',
    description: 'This conversation has been resolved.',
    icon: CheckCircle2,
    className: emerald,
  },
}

export function ThreadStatusBadge({ status }: { status: ThreadStatus }) {
  return <StatusBadge {...THREAD_STATUS_CONFIG[status]} />
}

const INTERNAL_VISUAL: StatusVisual = {
  label: 'Internal',
  description: "Firm-only — never visible to the client.",
  icon: Lock,
  className: slate,
}

// Deliberately renders nothing for 'client-visible' — that's the norm, and
// only the exceptional case (a thread the client will never see) is worth a
// preparer's attention at a glance.
export function ThreadVisibilityBadge({ visibility }: { visibility: MessageThread['visibility'] }) {
  if (visibility !== 'internal') return null
  return <StatusBadge {...INTERNAL_VISUAL} />
}
