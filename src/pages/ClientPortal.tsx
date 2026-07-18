import { usePortalSession } from '../context/PortalSessionContext'
import { useReturnsData } from '../context/ReturnsDataContext'
import { useMessageThreads } from '../context/MessageThreadsContext'
import { clients, teamMembers } from '../data'
import { StageTimeline } from '../design-system'
import { dueDateLabel, dueDateRelativeLabel } from '../lib/scoring'
import { ENTITY_TYPE_LABELS } from '../lib/labels'
import { threadsNeedingClientAction } from '../lib/messages'
import { ClientFieldRow } from '../components/portal/ClientFieldRow'
import { NewClientOnboarding } from '../components/portal/NewClientOnboarding'

export function ClientPortal() {
  const { portalClientId } = usePortalSession()
  const { returns } = useReturnsData()
  const { messageThreads } = useMessageThreads()
  const client = clients.find((c) => c.id === portalClientId)
  const ret = returns.find((r) => r.clientId === portalClientId)

  if (!client || !ret) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50">
        <p className="text-slate-500">No return found for this account yet.</p>
      </div>
    )
  }

  const preparer = teamMembers.find((tm) => tm.id === ret.preparerId)

  // A brand-new client with no return activity yet gets a fundamentally
  // different first-time experience — one next action and a short
  // checklist — rather than an emptier version of the standard status page.
  if (client.isNewClient) {
    return <NewClientOnboarding client={client} preparer={preparer} taxYear={ret.taxYear} />
  }

  // Blocking issues are internal firm process notes and never shown here.
  // Real message threads back this section now, not a static list — internal
  // threads are filtered out by construction (threadsNeedingClientAction only
  // ever returns client-visible ones), and only threads where it's genuinely
  // the client's turn show up, which is exactly the reason "client action
  // needed" appears on the return at all.
  const threadsForReturn = messageThreads.filter((t) => t.returnId === ret.id)
  const threadsForClient = threadsNeedingClientAction(threadsForReturn)

  return (
    <div className="min-h-svh bg-slate-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-slate-500">Welcome back, {client.name.split(' ')[0]}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Your {ret.taxYear} {ENTITY_TYPE_LABELS[ret.entityType].toLowerCase()} tax return
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Due {dueDateLabel(ret)} · {dueDateRelativeLabel(ret)}
        </p>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <StageTimeline status={ret.status} />
        </section>

        {preparer && (
          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <span className="font-medium text-slate-900">{preparer.name}</span> is preparing your return this year.
          </section>
        )}

        {threadsForClient.length > 0 && (
          <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-sm font-semibold text-amber-900">What we need from you</h2>
            <div className="mt-2 space-y-3">
              {threadsForClient.map((thread) => (
                <div key={thread.id}>
                  <p className="text-sm font-medium text-amber-900">{thread.subject}</p>
                  <ul className="mt-1 space-y-1 text-sm text-amber-800">
                    {thread.messages.map((message) => (
                      <li key={message.id}>{message.body}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {ret.fields.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Return details</h2>
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {ret.fields.map((field) => (
                <ClientFieldRow key={field.id} field={field} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
