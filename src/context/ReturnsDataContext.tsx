import { createContext, useContext, useState, type ReactNode } from 'react'
import { returns as initialReturns } from '../data'
import { nowISO } from '../lib/scoring'
import type { EditActorType, EditHistoryEntry, Return } from '../types'

interface EditActor {
  type: EditActorType
  name: string
}

interface ReturnsDataContextValue {
  returns: Return[]
  getReturn: (id: string) => Return | undefined
  saveFieldValue: (returnId: string, fieldId: string, newValue: string, actor: EditActor) => void
}

const ReturnsDataContext = createContext<ReturnsDataContextValue | null>(null)

export function ReturnsDataProvider({ children }: { children: ReactNode }) {
  const [returns, setReturns] = useState<Return[]>(initialReturns)

  function getReturn(id: string) {
    return returns.find((ret) => ret.id === id)
  }

  function saveFieldValue(returnId: string, fieldId: string, newValue: string, actor: EditActor) {
    setReturns((prev) =>
      prev.map((ret) => {
        if (ret.id !== returnId) return ret
        return {
          ...ret,
          updatedAt: nowISO(),
          fields: ret.fields.map((field) => {
            if (field.id !== fieldId) return field
            const historyEntry: EditHistoryEntry = {
              id: crypto.randomUUID(),
              timestamp: nowISO(),
              actorType: actor.type,
              actorName: actor.name,
              previousValue: field.value,
              newValue,
              note: 'Corrected during return review.',
            }
            return {
              ...field,
              value: newValue,
              state: 'verified',
              editHistory: [...field.editHistory, historyEntry],
            }
          }),
        }
      }),
    )
  }

  return (
    <ReturnsDataContext.Provider value={{ returns, getReturn, saveFieldValue }}>
      {children}
    </ReturnsDataContext.Provider>
  )
}

export function useReturnsData() {
  const ctx = useContext(ReturnsDataContext)
  if (!ctx) throw new Error('useReturnsData must be used within a ReturnsDataProvider')
  return ctx
}
