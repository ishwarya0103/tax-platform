import { createContext, useContext, useState, type ReactNode } from 'react'
import { messageThreads as initialMessageThreads } from '../data'
import { nowISO } from '../lib/scoring'
import type { MessageThread } from '../types'

interface MessageThreadsContextValue {
  messageThreads: MessageThread[]
  toggleThreadStatus: (threadId: string) => void
}

const MessageThreadsContext = createContext<MessageThreadsContextValue | null>(null)

export function MessageThreadsProvider({ children }: { children: ReactNode }) {
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>(initialMessageThreads)

  function toggleThreadStatus(threadId: string) {
    setMessageThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId
          ? { ...thread, status: thread.status === 'open' ? 'answered' : 'open', updatedAt: nowISO() }
          : thread,
      ),
    )
  }

  return (
    <MessageThreadsContext.Provider value={{ messageThreads, toggleThreadStatus }}>
      {children}
    </MessageThreadsContext.Provider>
  )
}

export function useMessageThreads() {
  const ctx = useContext(MessageThreadsContext)
  if (!ctx) throw new Error('useMessageThreads must be used within a MessageThreadsProvider')
  return ctx
}
