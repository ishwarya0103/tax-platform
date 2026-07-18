import { describe, it, expect } from 'vitest'
import { scoreReturn, TODAY } from './scoring'
import { returns, messageThreads } from '../data'
import type { BlockingIssue, Message, MessageThread, Return, ReturnStatus } from '../types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function dateOffsetFromToday(offsetDays: number): string {
  return new Date(TODAY.getTime() + offsetDays * MS_PER_DAY).toISOString().slice(0, 10)
}

function makeReturn(overrides: Partial<Return> = {}): Return {
  return {
    id: 'ret-test',
    clientId: 'client-test',
    entityType: 'individual',
    taxYear: 2025,
    status: 'in-preparation',
    dueDate: dateOffsetFromToday(0),
    preparerId: 'tm-test',
    blockingIssues: [],
    fields: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeIssue(overrides: Partial<BlockingIssue> = {}): BlockingIssue {
  return {
    id: 'issue-test',
    description: 'test issue',
    severity: 'medium',
    createdAt: '2026-01-01T00:00:00Z',
    resolved: false,
    ...overrides,
  }
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-test',
    authorType: 'preparer',
    authorName: 'Test Preparer',
    body: 'test message',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeThread(overrides: Partial<MessageThread> = {}): MessageThread {
  return {
    id: 'thread-test',
    returnId: 'ret-test',
    subject: 'test thread',
    visibility: 'client-visible',
    status: 'open',
    messages: [makeMessage()],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('scoreReturn — due-date pressure tiers', () => {
  it('scores an overdue return with a base 50 plus 1 point per day overdue', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(-10) }))
    expect(score.total).toBe(60)
    expect(score.reasons[0].label).toBe('Overdue by 10 days')
  })

  it('caps the overdue bonus at 30 extra points for severely overdue returns', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(-45) }))
    expect(score.total).toBe(80)
    expect(score.reasons[0].label).toBe('Overdue by 45 days')
  })

  it('scores a return due today at 40 points', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(0) }))
    expect(score.total).toBe(40)
    expect(score.reasons[0].label).toBe('Due today')
  })

  it('scores due-in-3-days at 40 (top of the imminent tier)', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(3) }))
    expect(score.total).toBe(40)
  })

  it('scores due-in-4-days at 30 (first day of the "this week" tier)', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(4) }))
    expect(score.total).toBe(30)
    expect(score.reasons[0].label).toBe('Due in 4 days, this week')
  })

  it('scores due-in-7-days at 30 (last day of the "this week" tier)', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(7) }))
    expect(score.total).toBe(30)
  })

  it('scores due-in-8-days at 20 (first day of the 2-week tier)', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(8) }))
    expect(score.total).toBe(20)
  })

  it('scores due-in-14-days at 20 (last day of the 2-week tier)', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(14) }))
    expect(score.total).toBe(20)
  })

  it('scores due-in-15-days at 10 (first day of the month-out tier)', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(15) }))
    expect(score.total).toBe(10)
  })

  it('scores due-in-30-days at 10 (last day of the month-out tier)', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(30) }))
    expect(score.total).toBe(10)
  })

  it('scores due-in-31-days at 0 and labels it not urgent yet', () => {
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(31) }))
    expect(score.total).toBe(0)
    expect(score.reasons[0].label).toContain('not urgent yet')
  })
})

describe('scoreReturn — blocking issue weighting', () => {
  it('adds nothing when there are no blocking issues', () => {
    const score = scoreReturn(makeReturn({ blockingIssues: [] }))
    expect(score.reasons.some((r) => r.label.includes('blocking issue'))).toBe(false)
  })

  it('weighs a single high-severity issue at 15 points', () => {
    const score = scoreReturn(
      makeReturn({ dueDate: dateOffsetFromToday(90), blockingIssues: [makeIssue({ severity: 'high' })] }),
    )
    expect(score.total).toBe(15)
  })

  it('weighs a single medium-severity issue at 8 points', () => {
    const score = scoreReturn(
      makeReturn({ dueDate: dateOffsetFromToday(90), blockingIssues: [makeIssue({ severity: 'medium' })] }),
    )
    expect(score.total).toBe(8)
  })

  it('weighs a single low-severity issue at 3 points', () => {
    const score = scoreReturn(
      makeReturn({ dueDate: dateOffsetFromToday(90), blockingIssues: [makeIssue({ severity: 'low' })] }),
    )
    expect(score.total).toBe(3)
  })

  it('sums mixed severities and lists them high-to-low in the label', () => {
    const score = scoreReturn(
      makeReturn({
        dueDate: dateOffsetFromToday(90),
        blockingIssues: [makeIssue({ severity: 'high' }), makeIssue({ severity: 'medium' }), makeIssue({ severity: 'low' })],
      }),
    )
    expect(score.total).toBe(26) // 15 + 8 + 3
    const reason = score.reasons.find((r) => r.label.includes('blocking issue'))
    expect(reason?.label).toBe('3 blocking issues (1 high, 1 medium, 1 low)')
  })

  it('ignores resolved issues entirely', () => {
    const score = scoreReturn(
      makeReturn({
        dueDate: dateOffsetFromToday(90),
        blockingIssues: [makeIssue({ severity: 'high', resolved: true }), makeIssue({ severity: 'low', resolved: false })],
      }),
    )
    expect(score.total).toBe(3) // only the unresolved low-severity issue counts
    expect(score.reasons.find((r) => r.label.includes('blocking issue'))?.label).toBe('1 blocking issue (1 low)')
  })

  it('caps the blocking-issue contribution at 40 points', () => {
    const score = scoreReturn(
      makeReturn({
        dueDate: dateOffsetFromToday(90),
        blockingIssues: [makeIssue({ severity: 'high' }), makeIssue({ severity: 'high' }), makeIssue({ severity: 'high' })],
      }),
    )
    expect(score.total).toBe(40) // 45 raw, capped at 40
  })
})

describe('scoreReturn — open client-visible thread weighting', () => {
  it('adds nothing when there are no threads', () => {
    const score = scoreReturn(makeReturn(), [])
    expect(score.reasons.some((r) => r.label.includes('reply'))).toBe(false)
  })

  it('weighs a thread where the firm sent the last message at 3 points (client owes a reply)', () => {
    const thread = makeThread({ messages: [makeMessage({ authorType: 'preparer' })] })
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(90) }), [thread])
    expect(score.total).toBe(3)
    expect(score.reasons.find((r) => r.label.includes('reply'))?.label).toBe("1 awaiting the client's reply")
  })

  it('weighs a thread where the client sent the last message at 10 points (firm owes a reply)', () => {
    const thread = makeThread({ messages: [makeMessage({ authorType: 'client' })] })
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(90) }), [thread])
    expect(score.total).toBe(10)
    expect(score.reasons.find((r) => r.label.includes('reply'))?.label).toBe('1 from the client awaiting your reply')
  })

  it('combines both directions in one label', () => {
    const threads = [
      makeThread({ id: 't1', messages: [makeMessage({ authorType: 'client' })] }),
      makeThread({ id: 't2', messages: [makeMessage({ authorType: 'preparer' })] }),
      makeThread({ id: 't3', messages: [makeMessage({ authorType: 'reviewer' })] }),
    ]
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(90) }), threads)
    expect(score.total).toBe(16) // 10 + 3 + 3
    expect(score.reasons.find((r) => r.label.includes('reply'))?.label).toBe(
      "1 from the client awaiting your reply; 2 awaiting the client's reply",
    )
  })

  it('ignores answered threads', () => {
    const threads = [
      makeThread({ id: 't1', status: 'answered', messages: [makeMessage({ authorType: 'client' })] }),
      makeThread({ id: 't2', messages: [makeMessage({ authorType: 'preparer' })] }),
    ]
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(90) }), threads)
    expect(score.total).toBe(3) // only the still-open thread counts
    expect(score.reasons.find((r) => r.label.includes('reply'))?.label).toBe("1 awaiting the client's reply")
  })

  it('ignores internal threads entirely, regardless of who owes a reply', () => {
    const threads = [
      makeThread({ id: 't1', visibility: 'internal', messages: [makeMessage({ authorType: 'preparer' })] }),
      makeThread({ id: 't2', visibility: 'internal', messages: [makeMessage({ authorType: 'reviewer' })] }),
    ]
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(90) }), threads)
    expect(score.reasons.some((r) => r.label.includes('reply'))).toBe(false)
    expect(score.total).toBe(0)
  })

  it('caps the open-thread contribution at 30 points', () => {
    const threads = [1, 2, 3, 4].map((n) => makeThread({ id: `t${n}`, messages: [makeMessage({ authorType: 'client' })] }))
    const score = scoreReturn(makeReturn({ dueDate: dateOffsetFromToday(90) }), threads)
    expect(score.total).toBe(30) // 40 raw, capped at 30
  })
})

describe('scoreReturn — status modifiers', () => {
  const farOutDueDate = dateOffsetFromToday(90) // keep due-date pressure at 0 so only the modifier shows

  it('demotes client-action-needed by 20 points below neutral', () => {
    const score = scoreReturn(makeReturn({ dueDate: farOutDueDate, status: 'client-action-needed' }))
    expect(score.total).toBe(-20)
  })

  it('demotes gathering-documents by 10 points', () => {
    const score = scoreReturn(makeReturn({ dueDate: farOutDueDate, status: 'gathering-documents' }))
    expect(score.total).toBe(-10)
  })

  it('boosts ready-to-file by 15 points as a quick win', () => {
    const score = scoreReturn(makeReturn({ dueDate: farOutDueDate, status: 'ready-to-file' }))
    expect(score.total).toBe(15)
  })

  it('boosts in-review by 5 points', () => {
    const score = scoreReturn(makeReturn({ dueDate: farOutDueDate, status: 'in-review' }))
    expect(score.total).toBe(5)
  })

  it('applies no modifier for in-preparation, not-started, or on-extension', () => {
    const neutralStatuses: ReturnStatus[] = ['in-preparation', 'not-started', 'on-extension']
    for (const status of neutralStatuses) {
      const score = scoreReturn(makeReturn({ dueDate: farOutDueDate, status }))
      expect(score.total).toBe(0)
      expect(score.reasons).toHaveLength(1) // only the due-date reason, no modifier
    }
  })

  it('does not treat on-extension as a client-blocking status, unlike gathering-documents', () => {
    // Both are "the client hasn't gotten back to us yet" in spirit, but on-extension is purely
    // an administrative deadline change — it doesn't mean the client owes the firm anything —
    // so it deliberately gets no modifier, while gathering-documents gets -10.
    const onExtension = scoreReturn(makeReturn({ dueDate: farOutDueDate, status: 'on-extension' }))
    const gatheringDocs = scoreReturn(makeReturn({ dueDate: farOutDueDate, status: 'gathering-documents' }))
    expect(onExtension.total).toBe(0)
    expect(gatheringDocs.total).toBe(-10)
    expect(onExtension.total).not.toBe(gatheringDocs.total)
  })

  it('short-circuits filed returns to a fixed sentinel score, ignoring everything else', () => {
    const thread = makeThread({ messages: [makeMessage({ authorType: 'client' })] })
    const score = scoreReturn(
      makeReturn({
        status: 'filed',
        dueDate: dateOffsetFromToday(-100), // severely overdue
        blockingIssues: [makeIssue({ severity: 'high' })], // and blocked
      }),
      [thread], // and a client message pending
    )
    expect(score.total).toBe(-1)
    expect(score.reasons).toHaveLength(1)
    expect(score.reasons[0].label).toBe('Filed — no further action needed')
  })
})

describe('scoreReturn — end-to-end against real mock data', () => {
  function threadsFor(returnId: string) {
    return messageThreads.filter((t) => t.returnId === returnId)
  }

  it('scores Carlos Mendoza (severely overdue, blocked, no extension) as the highest-priority return', () => {
    const carlos = returns.find((r) => r.id === 'ret-carlos-mendoza-2025')
    expect(carlos).toBeDefined()
    expect(scoreReturn(carlos!, threadsFor(carlos!.id)).total).toBe(88)
  })

  it('scores Owen Ridgeline (client-action-needed) below the neutral baseline', () => {
    const owen = returns.find((r) => r.id === 'ret-owen-ridgeline-2025')
    expect(owen).toBeDefined()
    expect(scoreReturn(owen!, threadsFor(owen!.id)).total).toBe(-17)
  })

  it('scores a filed return (Ridgeline Landscaping LLC) at the fixed sentinel', () => {
    const ridgeline = returns.find((r) => r.id === 'ret-ridgeline-landscaping-2025')
    expect(ridgeline).toBeDefined()
    expect(scoreReturn(ridgeline!, threadsFor(ridgeline!.id)).total).toBe(-1)
  })

  it('scores a clean, on-track return (Sarah Chen) at neutral zero', () => {
    const sarah = returns.find((r) => r.id === 'ret-sarah-chen-2025')
    expect(sarah).toBeDefined()
    expect(scoreReturn(sarah!, threadsFor(sarah!.id)).total).toBe(0)
  })

  it("scores Marcus Webb counting only his client-visible thread, not the internal one", () => {
    // blocking issue (15) + in-review modifier (5) + the client-visible thread where the
    // firm sent the last message, so the client owes a reply (3) = 23. The internal thread
    // discussing how to resolve the conflict must NOT add to this — it's firm-only.
    const marcus = returns.find((r) => r.id === 'ret-marcus-webb-2025')
    expect(marcus).toBeDefined()
    const threads = threadsFor(marcus!.id)
    expect(threads.some((t) => t.visibility === 'internal')).toBe(true)
    expect(scoreReturn(marcus!, threads).total).toBe(23)
  })
})
