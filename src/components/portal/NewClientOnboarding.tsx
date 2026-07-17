import { useRef, useState, type ChangeEvent } from 'react'
import { Check, Upload } from 'lucide-react'
import type { Client, TeamMember } from '../../types'

interface StepDef {
  key: 'identity' | 'document' | 'intake'
  title: string
  description: string
}

const STEPS: StepDef[] = [
  {
    key: 'identity',
    title: 'Verify your identity',
    description: 'We need to confirm a few details before we can start your return.',
  },
  {
    key: 'document',
    title: 'Upload your first document',
    description: 'Send us something simple to start with — a prior return, a W-9, whatever you have handy.',
  },
  {
    key: 'intake',
    title: 'Answer a couple of quick questions',
    description: 'Just two quick questions to help us get started.',
  },
]

const CONTACT_OPTIONS = ['Email', 'Phone', 'Text'] as const
const PRIOR_RETURN_OPTIONS = ['Yes', 'No', 'Not sure'] as const

interface NewClientOnboardingProps {
  client: Client
  preparer?: TeamMember
  taxYear: number
}

export function NewClientOnboarding({ client, preparer, taxYear }: NewClientOnboardingProps) {
  const [completed, setCompleted] = useState<Set<StepDef['key']>>(new Set())
  const [verifying, setVerifying] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [contactAnswer, setContactAnswer] = useState<string | null>(null)
  const [priorReturnAnswer, setPriorReturnAnswer] = useState<string | null>(null)
  const timeoutRef = useRef<number | undefined>(undefined)

  function markComplete(key: StepDef['key']) {
    setCompleted((prev) => new Set(prev).add(key))
  }

  function handleVerify() {
    setVerifying(true)
    timeoutRef.current = window.setTimeout(() => {
      setVerifying(false)
      markComplete('identity')
    }, 700)
  }

  function handleFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFileName(file.name)
    markComplete('document')
  }

  function answerContact(option: string) {
    setContactAnswer(option)
    if (priorReturnAnswer) markComplete('intake')
  }

  function answerPriorReturn(option: string) {
    setPriorReturnAnswer(option)
    if (contactAnswer) markComplete('intake')
  }

  const currentStep = STEPS.find((step) => !completed.has(step.key))

  return (
    <div className="min-h-svh bg-slate-50">
      <div className="mx-auto max-w-xl px-6 py-12">
        <p className="text-sm text-slate-500">Welcome to GreenGrowth CPAs</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Let's get you set up, {client.name}</h1>
        <p className="mt-2 text-sm text-slate-600">A few quick steps before we can start on your {taxYear} return.</p>

        {currentStep ? (
          <section className="mt-8 rounded-xl border-2 border-indigo-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-indigo-600 uppercase">Next step</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{currentStep.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{currentStep.description}</p>

            <div className="mt-4">
              {currentStep.key === 'identity' && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {verifying ? 'Verifying…' : 'Verify my identity'}
                </button>
              )}

              {currentStep.key === 'document' && (
                <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:border-indigo-400 hover:bg-indigo-50">
                  <Upload className="size-4" aria-hidden="true" />
                  Choose a file
                  <input type="file" className="hidden" onChange={handleFileChosen} />
                </label>
              )}

              {currentStep.key === 'intake' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">What's the best way to reach you?</p>
                    <div className="mt-2 flex gap-2">
                      {CONTACT_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => answerContact(option)}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                            contactAnswer === option
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Do you have last year's business tax return handy?</p>
                    <div className="mt-2 flex gap-2">
                      {PRIOR_RETURN_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => answerPriorReturn(option)}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                            priorReturnAnswer === option
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm font-semibold text-emerald-800">You're all set!</p>
            <p className="mt-1 text-sm text-emerald-700">
              {preparer ? `${preparer.name} will` : "We'll"} be in touch to start gathering the rest of your documents.
            </p>
          </section>
        )}

        <div className="mt-8">
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Your progress</p>
          <ol className="mt-3 space-y-3">
            {STEPS.map((step) => {
              const done = completed.has(step.key)
              const isCurrent = !done && step.key === currentStep?.key
              return (
                <li key={step.key} className="flex items-center gap-3">
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                      done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : isCurrent
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {done && <Check className="size-3.5" aria-hidden="true" />}
                  </span>
                  <span
                    className={`text-sm font-medium ${done ? 'text-emerald-700' : isCurrent ? 'text-indigo-700' : 'text-slate-400'}`}
                  >
                    {step.title}
                  </span>
                  {step.key === 'document' && uploadedFileName && (
                    <span className="text-xs text-slate-400">— {uploadedFileName}</span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
