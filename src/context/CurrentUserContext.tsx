import { createContext, useContext, useState, type ReactNode } from 'react'
import { teamMembers } from '../data'
import type { TeamMember } from '../types'

interface CurrentUserContextValue {
  currentUser: TeamMember
  setCurrentUserId: (id: string) => void
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)

const DEFAULT_USER_ID = 'tm-tom'

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState(DEFAULT_USER_ID)
  const currentUser = teamMembers.find((tm) => tm.id === currentUserId) ?? teamMembers[0]

  return (
    <CurrentUserContext.Provider value={{ currentUser, setCurrentUserId }}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext)
  if (!ctx) throw new Error('useCurrentUser must be used within a CurrentUserProvider')
  return ctx
}
