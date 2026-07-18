import type { MessageThread } from '../types'

export type ThreadOwner = 'firm' | 'client'

// Who needs to act next on this thread. Answered threads have nothing
// outstanding, so there's no owner. Internal threads only ever involve firm
// staff — there's no "client's turn" concept for a conversation the client
// can't see — so an open internal thread is always the firm's to resolve.
// For a client-visible thread, the turn is whoever DIDN'T send the most
// recent message: if the client spoke last, the firm owes a reply; if the
// firm spoke last, the client owes one.
export function nextActionOwner(thread: MessageThread): ThreadOwner | null {
  if (thread.status === 'answered') return null
  if (thread.visibility === 'internal') return 'firm'

  const lastMessage = thread.messages[thread.messages.length - 1]
  if (!lastMessage) return 'firm'
  return lastMessage.authorType === 'client' ? 'firm' : 'client'
}

// The exact set that belongs in "what we need from you": visible to the
// client, still open, and it's genuinely their turn — never an internal
// thread, and never one that's just waiting on the firm.
export function threadsNeedingClientAction(threads: MessageThread[]): MessageThread[] {
  return threads.filter((thread) => thread.visibility === 'client-visible' && nextActionOwner(thread) === 'client')
}
