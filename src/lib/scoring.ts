import type { IssueSeverity, Return, ReturnStatus } from '../types'

// Pinned to match the mock data's tax season rather than the real system clock —
// the dataset was authored assuming "today" is mid-July 2026, on extension season.
export const TODAY = new Date('2026-07-17T00:00:00Z')

const MS_PER_DAY = 1000 * 60 * 60 * 24

function daysUntil(dateStr: string, from: Date): number {
  const target = new Date(`${dateStr}T00:00:00Z`)
  return Math.round((target.getTime() - from.getTime()) / MS_PER_DAY)
}

export function effectiveDueDate(ret: Return): string {
  return ret.extendedDueDate ?? ret.dueDate
}

export function daysUntilDue(ret: Return, from: Date = TODAY): number {
  return daysUntil(effectiveDueDate(ret), from)
}

export function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function dueDateLabel(ret: Return): string {
  return `${formatDate(effectiveDueDate(ret))}${ret.extendedDueDate ? ' (extended)' : ''}`
}

export function dueDateRelativeLabel(ret: Return, from: Date = TODAY): string {
  if (ret.status === 'filed') return 'Filed'
  const days = daysUntilDue(ret, from)
  if (days < 0) return `Overdue by ${Math.abs(days)}d`
  if (days === 0) return 'Due today'
  return `Due in ${days}d`
}

export interface ScoreReason {
  label: string
  points: number
}

export interface ReturnScore {
  total: number
  reasons: ScoreReason[]
}

const SEVERITY_POINTS: Record<IssueSeverity, number> = { high: 15, medium: 8, low: 3 }

// Statuses convey their own urgency independent of dates and issue counts:
// "waiting on the client" means there's nothing more the preparer can do right
// now, so it's demoted below the neutral baseline; "ready to file" is a
// low-effort, high-completion-value quick win, so it's bumped up.
const STATUS_MODIFIERS: Partial<Record<ReturnStatus, ScoreReason>> = {
  'client-action-needed': {
    label: 'Waiting on the client — nothing more to do here until they respond',
    points: -20,
  },
  'gathering-documents': {
    label: 'Waiting on documents from the client',
    points: -10,
  },
  'ready-to-file': {
    label: 'Quick win — fully reviewed, just needs to be filed',
    points: 15,
  },
  'in-review': {
    label: 'Actively under review',
    points: 5,
  },
}

export function scoreReturn(ret: Return, from: Date = TODAY): ReturnScore {
  if (ret.status === 'filed') {
    return { total: -1, reasons: [{ label: 'Filed — no further action needed', points: -1 }] }
  }

  const reasons: ScoreReason[] = []
  const days = daysUntilDue(ret, from)

  if (days < 0) {
    const overdue = Math.abs(days)
    reasons.push({
      label: `Overdue by ${overdue} day${overdue === 1 ? '' : 's'}`,
      points: 50 + Math.min(overdue, 30),
    })
  } else if (days <= 3) {
    reasons.push({ label: days === 0 ? 'Due today' : `Due in ${days} day${days === 1 ? '' : 's'}`, points: 40 })
  } else if (days <= 7) {
    reasons.push({ label: `Due in ${days} days, this week`, points: 30 })
  } else if (days <= 14) {
    reasons.push({ label: `Due in ${days} days`, points: 20 })
  } else if (days <= 30) {
    reasons.push({ label: `Due in ${days} days`, points: 10 })
  } else {
    reasons.push({ label: `Due in ${days} days — not urgent yet`, points: 0 })
  }

  const unresolved = ret.blockingIssues.filter((issue) => !issue.resolved)
  if (unresolved.length > 0) {
    const points = Math.min(
      unresolved.reduce((sum, issue) => sum + SEVERITY_POINTS[issue.severity], 0),
      40,
    )
    const bySeverity = (['high', 'medium', 'low'] as const)
      .map((sev) => {
        const count = unresolved.filter((i) => i.severity === sev).length
        return count > 0 ? `${count} ${sev}` : null
      })
      .filter((part): part is string => part !== null)
      .join(', ')
    reasons.push({
      label: `${unresolved.length} blocking issue${unresolved.length === 1 ? '' : 's'} (${bySeverity})`,
      points,
    })
  }

  const openQuestions = ret.openQuestions.filter((q) => q.status === 'open')
  if (openQuestions.length > 0) {
    const fromClient = openQuestions.filter((q) => q.askedBy === 'client').length
    const fromFirm = openQuestions.length - fromClient
    const points = Math.min(fromClient * 10 + fromFirm * 3, 30)
    const parts: string[] = []
    if (fromClient > 0) parts.push(`${fromClient} from the client awaiting your reply`)
    if (fromFirm > 0) parts.push(`${fromFirm} awaiting the client's reply`)
    reasons.push({ label: parts.join('; '), points })
  }

  const modifier = STATUS_MODIFIERS[ret.status]
  if (modifier) reasons.push(modifier)

  const total = reasons.reduce((sum, r) => sum + r.points, 0)
  return { total, reasons }
}
