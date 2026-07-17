import { useState } from 'react'
import { Ban, CalendarClock, CalendarX2, ClipboardCheck, Search, type LucideIcon } from 'lucide-react'
import { clients, teamMembers, returns } from '../data'
import { useCurrentUser } from '../context/CurrentUserContext'
import { daysUntilDue, scoreReturn } from '../lib/scoring'
import { StatCard } from '../components/dashboard/StatCard'
import { ReturnRow } from '../components/dashboard/ReturnRow'
import type { Return } from '../types'

type Scope = 'mine' | 'team'
type StatKey = 'overdue' | 'dueThisWeek' | 'blocked' | 'readyToFile'

const STAT_PREDICATES: Record<StatKey, (ret: Return) => boolean> = {
  overdue: (ret) => daysUntilDue(ret) < 0,
  dueThisWeek: (ret) => {
    const days = daysUntilDue(ret)
    return days >= 0 && days <= 7
  },
  blocked: (ret) => ret.blockingIssues.some((issue) => !issue.resolved),
  readyToFile: (ret) => ret.status === 'ready-to-file',
}

const STAT_CARDS: { key: StatKey; label: string; icon: LucideIcon; activeClassName: string; iconClassName: string }[] = [
  {
    key: 'overdue',
    label: 'Overdue',
    icon: CalendarX2,
    activeClassName: 'border-rose-300 bg-rose-50 ring-1 ring-rose-300',
    iconClassName: 'text-rose-600',
  },
  {
    key: 'dueThisWeek',
    label: 'Due this week',
    icon: CalendarClock,
    activeClassName: 'border-amber-300 bg-amber-50 ring-1 ring-amber-300',
    iconClassName: 'text-amber-600',
  },
  {
    key: 'blocked',
    label: 'Blocked',
    icon: Ban,
    activeClassName: 'border-orange-300 bg-orange-50 ring-1 ring-orange-300',
    iconClassName: 'text-orange-600',
  },
  {
    key: 'readyToFile',
    label: 'Ready to file',
    icon: ClipboardCheck,
    activeClassName: 'border-teal-300 bg-teal-50 ring-1 ring-teal-300',
    iconClassName: 'text-teal-600',
  },
]

function matchesSearch(ret: Return, clientName: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return clientName.toLowerCase().includes(q) || ret.id.toLowerCase().includes(q)
}

export function Dashboard() {
  const { currentUser, setCurrentUserId } = useCurrentUser()
  const [scope, setScope] = useState<Scope>('mine')
  const [statFilter, setStatFilter] = useState<StatKey | null>(null)
  const [query, setQuery] = useState('')

  const enriched = returns.map((ret) => ({
    ret,
    client: clients.find((c) => c.id === ret.clientId)!,
    preparer: teamMembers.find((tm) => tm.id === ret.preparerId),
    reviewer: ret.reviewerId ? teamMembers.find((tm) => tm.id === ret.reviewerId) : undefined,
  }))

  const isMine = (ret: Return) => ret.preparerId === currentUser.id || ret.reviewerId === currentUser.id
  const myCount = enriched.filter(({ ret }) => isMine(ret)).length

  const scoped = enriched.filter(({ ret }) => scope === 'team' || isMine(ret))
  const activeScoped = scoped.filter(({ ret }) => ret.status !== 'filed')

  const counts: Record<StatKey, number> = {
    overdue: activeScoped.filter(({ ret }) => STAT_PREDICATES.overdue(ret)).length,
    dueThisWeek: activeScoped.filter(({ ret }) => STAT_PREDICATES.dueThisWeek(ret)).length,
    blocked: activeScoped.filter(({ ret }) => STAT_PREDICATES.blocked(ret)).length,
    readyToFile: activeScoped.filter(({ ret }) => STAT_PREDICATES.readyToFile(ret)).length,
  }

  const isSearching = query.trim().length > 0

  let workingSet = isSearching ? scoped : activeScoped
  if (statFilter) workingSet = workingSet.filter(({ ret }) => STAT_PREDICATES[statFilter](ret))
  if (isSearching) workingSet = workingSet.filter(({ ret, client }) => matchesSearch(ret, client.name, query))

  const scored = workingSet
    .map((row) => ({ ...row, score: scoreReturn(row.ret) }))
    .sort((a, b) => b.score.total - a.score.total || daysUntilDue(a.ret) - daysUntilDue(b.ret))

  return (
    <div className="min-h-svh bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">What needs your attention right now.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Viewing as
            <select
              value={currentUser.id}
              onChange={(e) => setCurrentUserId(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
            >
              {teamMembers.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </label>
        </header>

        <div className="mt-6 inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setScope('mine')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              scope === 'mine' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            My returns ({myCount})
          </button>
          <button
            type="button"
            onClick={() => setScope('team')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              scope === 'team' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Whole team ({enriched.length})
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STAT_CARDS.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              count={counts[card.key]}
              icon={card.icon}
              active={statFilter === card.key}
              activeClassName={card.activeClassName}
              iconClassName={card.iconClassName}
              onClick={() => setStatFilter(statFilter === card.key ? null : card.key)}
            />
          ))}
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client name or return ID…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Sorted by priority — highest first.</span>
          {!isSearching && <span>Filed returns are hidden here. Search to find one.</span>}
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {scored.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">No returns match your filters.</div>
          ) : (
            scored.map(({ ret, client, preparer, reviewer, score }) => (
              <ReturnRow key={ret.id} ret={ret} client={client} preparer={preparer} reviewer={reviewer} score={score} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
