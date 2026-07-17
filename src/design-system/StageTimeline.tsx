import { Check, CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ReturnStatus } from '../types'
import { RETURN_STATUS_CONFIG } from './tokens'
import { Tooltip } from './Tooltip'

export type TimelineStage = 'documents' | 'preparation' | 'review' | 'ready-to-file' | 'filed'

const STAGE_ORDER: TimelineStage[] = ['documents', 'preparation', 'review', 'ready-to-file', 'filed']

const STAGE_LABELS: Record<TimelineStage, string> = {
  documents: 'Documents',
  preparation: 'Preparation',
  review: 'Review',
  'ready-to-file': 'Ready to file',
  filed: 'Filed',
}

// Maps the preparer's 8 granular statuses onto the 5 client-facing stages.
// Statuses that really mean "we're waiting on the client" (gathering-documents,
// client-action-needed) aren't their own stage bubble — they set a "blocked"
// flag on whichever stage they interrupt, so a client and a preparer looking
// at the same return read identical progress, just with an extra signal for
// who owes the next move. "on-extension" is an administrative flag, not a
// client-blocking one, so it doesn't get the overlay.
function stageForStatus(status: ReturnStatus): { stage: TimelineStage; blocked: boolean } {
  switch (status) {
    case 'not-started':
      return { stage: 'documents', blocked: false }
    case 'gathering-documents':
      return { stage: 'documents', blocked: true }
    case 'in-preparation':
      return { stage: 'preparation', blocked: false }
    case 'client-action-needed':
      return { stage: 'preparation', blocked: true }
    case 'on-extension':
      return { stage: 'preparation', blocked: false }
    case 'in-review':
      return { stage: 'review', blocked: false }
    case 'ready-to-file':
      return { stage: 'ready-to-file', blocked: false }
    case 'filed':
      return { stage: 'filed', blocked: false }
  }
}

interface StageTimelineProps {
  status: ReturnStatus
  compact?: boolean
}

export function StageTimeline({ status, compact = false }: StageTimelineProps) {
  const { stage: currentStage, blocked } = stageForStatus(status)
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  const isDone = status === 'filed'
  const statusConfig = RETURN_STATUS_CONFIG[status]
  const tooltipContent = blocked ? `${statusConfig.label} — ${statusConfig.description}` : statusConfig.description

  const cells = STAGE_ORDER.flatMap((stage, index) => {
    const isCompleted = isDone || index < currentIndex
    const isCurrent = !isDone && index === currentIndex
    const isLast = index === STAGE_ORDER.length - 1

    let bubbleClass: string
    let icon: ReactNode = null
    if (isCompleted) {
      bubbleClass = 'border-emerald-500 bg-emerald-500 text-white'
      icon = !compact && <Check className="size-3.5" aria-hidden="true" />
    } else if (isCurrent && blocked) {
      bubbleClass = 'border-amber-500 bg-amber-500 text-white'
      icon = !compact && <CircleAlert className="size-3.5" aria-hidden="true" />
    } else if (isCurrent) {
      bubbleClass = 'border-indigo-600 bg-indigo-600 text-white'
      icon = !compact && <span className="size-2 rounded-full bg-white" />
    } else {
      bubbleClass = 'border-slate-300 bg-white text-slate-400'
    }

    const labelClass = isCurrent
      ? blocked
        ? 'text-amber-700'
        : 'text-indigo-700'
      : isCompleted
        ? 'text-emerald-700'
        : 'text-slate-400'

    const cell = (
      <div key={`${stage}-cell`} className="flex flex-col items-center gap-1.5">
        <div
          className={`flex shrink-0 items-center justify-center rounded-full border-2 ${compact ? 'size-2.5' : 'size-7'} ${bubbleClass}`}
        >
          {icon}
        </div>
        {!compact && <span className={`text-[11px] font-medium whitespace-nowrap ${labelClass}`}>{STAGE_LABELS[stage]}</span>}
      </div>
    )

    if (isLast) return [cell]
    const line = <div key={`${stage}-line`} className={`h-0.5 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
    return [cell, line]
  })

  return (
    <Tooltip content={tooltipContent}>
      <div
        tabIndex={0}
        className={`inline-grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto] items-center ${
          compact ? 'w-20' : 'w-full gap-y-1.5'
        }`}
      >
        {cells}
      </div>
    </Tooltip>
  )
}
