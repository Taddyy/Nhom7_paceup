import Image from 'next/image'
import { Fragment } from 'react'

export type StepId = 'ticket' | 'participant' | 'payment'
export type StepStatus = 'current' | 'upcoming'

export interface StepConfig {
  id: StepId
  label: string
  icon: string
  status: StepStatus
}

export const STEP_ICON_PATHS: Record<StepId, string> = {
  ticket: '/Icon/Step 1.svg',
  participant: '/Icon/Step 2.svg',
  payment: '/Icon/Step 3.svg'
}

interface StepIndicatorProps {
  steps: StepConfig[]
}

export default function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-0">
      {steps.map((step, index) => (
        <Fragment key={step.id}>
          <StepCard step={step} />
          {index < steps.length - 1 && (
            <span className="hidden flex-1 border-t border-dashed border-neutral-200 md:block" />
          )}
        </Fragment>
      ))}
    </div>
  )
}

function StepCard({ step }: { step: StepConfig }) {
  const isCurrent = step.status === 'current'

  return (
    <div className="flex items-center gap-4">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
          isCurrent ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-200 bg-white'
        }`}
      >
        <Image
          src={step.icon}
          alt={step.label}
          width={24}
          height={24}
          className={`h-6 w-6 transition ${isCurrent ? 'filter invert brightness-0' : 'opacity-30'}`}
        />
      </span>
      <p className={`text-lg font-semibold ${isCurrent ? 'text-neutral-900' : 'text-neutral-400'}`}>{step.label}</p>
    </div>
  )
}

