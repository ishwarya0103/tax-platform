import { CircleAlert, MessageCircleQuestion } from 'lucide-react'
import { ReturnStatusBadge, Tooltip } from '../../design-system'
import { dueDateLabel, dueDateRelativeLabel, daysUntilDue } from '../../lib/scoring'
import type { ReturnScore } from '../../lib/scoring'
import type { Client, EntityType, Return, TeamMember } from '../../types'

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  individual: 'Individual',
  's-corp': 'S-Corp',
  'c-corp': 'C-Corp',
  partnership: 'Partnership',
  trust: 'Trust',
}

function ScoreChip({ score }: { score: ReturnScore }) {
  const tier =
    score.total >= 40
      ? 'border-rose-300 bg-rose-50 text-rose-700'
      : score.total >= 15
        ? 'border-amber-300 bg-amber-50 text-amber-700'
        : score.total >= 0
          ? 'border-slate-300 bg-slate-50 text-slate-700'
          : 'border-violet-300 bg-violet-50 text-violet-700'

  return (
    <Tooltip
      className="max-w-80 w-72"
      content={
        <div>
          <p className="mb-1 font-semibold">Priority score: {score.total}</p>
          <ul className="space-y-0.5">
            {score.reasons.map((reason) => (
              <li key={reason.label} className="flex justify-between gap-3">
                <span>{reason.label}</span>
                <span className="shrink-0">{reason.points > 0 ? `+${reason.points}` : reason.points}</span>
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <span
        tabIndex={0}
        className={`flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${tier}`}
      >
        {score.total}
      </span>
    </Tooltip>
  )
}

function Avatar({ member, role }: { member: TeamMember; role: string }) {
  return (
    <Tooltip content={`${member.name} · ${role}`}>
      <span
        tabIndex={0}
        className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-600"
      >
        {member.initials}
      </span>
    </Tooltip>
  )
}

interface ReturnRowProps {
  ret: Return
  client: Client
  preparer?: TeamMember
  reviewer?: TeamMember
  score: ReturnScore
}

export function ReturnRow({ ret, client, preparer, reviewer, score }: ReturnRowProps) {
  const days = daysUntilDue(ret)
  const unresolvedIssues = ret.blockingIssues.filter((issue) => !issue.resolved).length
  const openQuestions = ret.openQuestions.filter((q) => q.status === 'open').length
  const dueTone =
    ret.status === 'filed' ? 'text-slate-400' : days < 0 ? 'text-rose-600' : days <= 7 ? 'text-amber-600' : 'text-slate-500'

  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50">
      {ret.status === 'filed' ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-400">
          Done
        </span>
      ) : (
        <ScoreChip score={score} />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{client.name}</p>
        <p className="truncate text-xs text-slate-400">
          {ENTITY_TYPE_LABELS[ret.entityType]} · TY{ret.taxYear} · {ret.id}
        </p>
      </div>

      <div className="w-44 shrink-0">
        <ReturnStatusBadge status={ret.status} />
      </div>

      <div className="w-40 shrink-0">
        <p className="text-sm text-slate-700">{dueDateLabel(ret)}</p>
        <p className={`text-xs font-medium ${dueTone}`}>{dueDateRelativeLabel(ret)}</p>
      </div>

      <div className="flex w-20 shrink-0 items-center gap-3 text-xs">
        {unresolvedIssues > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <CircleAlert className="size-3.5" aria-hidden="true" />
            {unresolvedIssues}
          </span>
        )}
        {openQuestions > 0 && (
          <span className="flex items-center gap-1 text-violet-600">
            <MessageCircleQuestion className="size-3.5" aria-hidden="true" />
            {openQuestions}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {preparer && <Avatar member={preparer} role="Preparer" />}
        {reviewer && <Avatar member={reviewer} role="Reviewer" />}
      </div>
    </div>
  )
}
