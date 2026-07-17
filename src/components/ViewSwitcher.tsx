import { useLocation, useNavigate } from 'react-router-dom'
import { usePortalSession } from '../context/PortalSessionContext'
import { clients } from '../data'

// A couple of hardcoded sample logins standing in for real client auth, per
// the brief. Priya Nair is included deliberately — she's a firm employee with
// her own personal return, prepared by a colleague rather than herself.
const SAMPLE_CLIENT_LOGINS: { id: string; note?: string }[] = [
  { id: 'client-sarah-chen' },
  { id: 'client-dana-ruiz' },
  { id: 'client-priya-nair', note: 'firm employee' },
]

export function ViewSwitcher() {
  const location = useLocation()
  const navigate = useNavigate()
  const { portalClientId, setPortalClientId } = usePortalSession()
  const mode: 'preparer' | 'client' = location.pathname.startsWith('/portal') ? 'client' : 'preparer'

  return (
    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-2.5">
      <span className="text-sm font-semibold tracking-wide text-white">Tax Platform</span>
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              mode === 'preparer' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
            }`}
          >
            Preparer view
          </button>
          <button
            type="button"
            onClick={() => navigate('/portal')}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              mode === 'client' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
            }`}
          >
            Client view
          </button>
        </div>
        {mode === 'client' && (
          <select
            value={portalClientId}
            onChange={(e) => setPortalClientId(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
          >
            {SAMPLE_CLIENT_LOGINS.map((login) => {
              const client = clients.find((c) => c.id === login.id)!
              return (
                <option key={client.id} value={client.id}>
                  {client.name}
                  {login.note ? ` (${login.note})` : ''}
                </option>
              )
            })}
          </select>
        )}
      </div>
    </div>
  )
}
