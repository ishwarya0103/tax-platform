import { describe, it, expect } from 'vitest'
import { nextActionOwner, threadsNeedingClientAction } from './messages'
import type { Message, MessageThread } from '../types'

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

describe('nextActionOwner', () => {
  it('returns null for an answered thread, regardless of visibility', () => {
    expect(nextActionOwner(makeThread({ status: 'answered', visibility: 'client-visible' }))).toBeNull()
    expect(nextActionOwner(makeThread({ status: 'answered', visibility: 'internal' }))).toBeNull()
  })

  it('always returns "firm" for an open internal thread, regardless of who posted last', () => {
    expect(
      nextActionOwner(makeThread({ visibility: 'internal', messages: [makeMessage({ authorType: 'preparer' })] })),
    ).toBe('firm')
    expect(
      nextActionOwner(makeThread({ visibility: 'internal', messages: [makeMessage({ authorType: 'reviewer' })] })),
    ).toBe('firm')
  })

  it('returns "firm" for an open client-visible thread when the client sent the last message', () => {
    const thread = makeThread({ messages: [makeMessage({ authorType: 'preparer' }), makeMessage({ authorType: 'client' })] })
    expect(nextActionOwner(thread)).toBe('firm')
  })

  it('returns "client" for an open client-visible thread when the firm sent the last message', () => {
    const thread = makeThread({ messages: [makeMessage({ authorType: 'client' }), makeMessage({ authorType: 'preparer' })] })
    expect(nextActionOwner(thread)).toBe('client')
  })

  it('treats a reviewer-authored last message the same as a preparer-authored one (both are "firm")', () => {
    const thread = makeThread({ messages: [makeMessage({ authorType: 'reviewer' })] })
    expect(nextActionOwner(thread)).toBe('client')
  })

  it('defaults to "firm" for an open thread with no messages yet', () => {
    expect(nextActionOwner(makeThread({ messages: [] }))).toBe('firm')
  })
})

describe('threadsNeedingClientAction', () => {
  it('includes an open, client-visible thread where the client owes the reply', () => {
    const thread = makeThread({ messages: [makeMessage({ authorType: 'preparer' })] })
    expect(threadsNeedingClientAction([thread])).toEqual([thread])
  })

  it('excludes internal threads even when open', () => {
    const thread = makeThread({ visibility: 'internal', messages: [makeMessage({ authorType: 'preparer' })] })
    expect(threadsNeedingClientAction([thread])).toEqual([])
  })

  it('excludes answered threads', () => {
    const thread = makeThread({ status: 'answered', messages: [makeMessage({ authorType: 'preparer' })] })
    expect(threadsNeedingClientAction([thread])).toEqual([])
  })

  it("excludes client-visible threads where it's the firm's turn, not the client's", () => {
    const thread = makeThread({ messages: [makeMessage({ authorType: 'client' })] })
    expect(threadsNeedingClientAction([thread])).toEqual([])
  })

  it('filters a mixed list down to exactly the threads needing client action', () => {
    const needsClient = makeThread({ id: 'a', messages: [makeMessage({ authorType: 'preparer' })] })
    const needsFirm = makeThread({ id: 'b', messages: [makeMessage({ authorType: 'client' })] })
    const internal = makeThread({ id: 'c', visibility: 'internal', messages: [makeMessage({ authorType: 'preparer' })] })
    const answered = makeThread({ id: 'd', status: 'answered', messages: [makeMessage({ authorType: 'preparer' })] })
    const result = threadsNeedingClientAction([needsClient, needsFirm, internal, answered])
    expect(result).toEqual([needsClient])
  })
})
