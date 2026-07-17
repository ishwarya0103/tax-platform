import { createContext, useContext, useState, type ReactNode } from 'react'

interface PortalSessionContextValue {
  portalClientId: string
  setPortalClientId: (id: string) => void
}

const PortalSessionContext = createContext<PortalSessionContextValue | null>(null)

const DEFAULT_PORTAL_CLIENT_ID = 'client-sarah-chen'

export function PortalSessionProvider({ children }: { children: ReactNode }) {
  const [portalClientId, setPortalClientId] = useState(DEFAULT_PORTAL_CLIENT_ID)

  return (
    <PortalSessionContext.Provider value={{ portalClientId, setPortalClientId }}>
      {children}
    </PortalSessionContext.Provider>
  )
}

export function usePortalSession() {
  const ctx = useContext(PortalSessionContext)
  if (!ctx) throw new Error('usePortalSession must be used within a PortalSessionProvider')
  return ctx
}
