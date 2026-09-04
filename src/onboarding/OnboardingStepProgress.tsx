import React from 'react'

interface OnboardingStepProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  onStepClick?: (step: number) => void
}

export default function OnboardingStepProgress({
  currentStep,
  totalSteps,
  stepLabels,
  onStepClick,
}: OnboardingStepProgressProps) {
  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Top row: Brand & Step Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '0.12em',
              color: '#f8f9fa',
            }}
          >
            FINOVA<span style={{ color: '#d97706' }}>.</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            / Financial Twin Architecture
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded bg-slate-800/90 border border-slate-700/60 text-[#D72638]"
          >
            STEP 0{currentStep} / 0{totalSteps}
          </span>
        </div>
      </div>

      {/* Layer Step Progression Track */}
      <div className="grid grid-cols-6 gap-1.5 w-full">
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1
          const isCompleted = stepNum < currentStep
          const isActive = stepNum === currentStep
          const isUpcoming = stepNum > currentStep

          return (
            <button
              key={label}
              type="button"
              disabled={isUpcoming}
              onClick={() => onStepClick && isCompleted && onStepClick(stepNum)}
              title={`Step ${stepNum}: ${label}`}
              className={`group flex flex-col gap-1 text-left transition-all duration-200 outline-none ${
                isCompleted ? 'cursor-pointer hover:opacity-100' : 'cursor-default'
              }`}
            >
              {/* Progress segment bar */}
              <div
                className="h-[3px] rounded-full w-full transition-all duration-300"
                style={{
                  background: isCompleted
                    ? '#D72638'
                    : isActive
                    ? '#D72638'
                    : 'rgba(148, 163, 184, 0.18)',
                  boxShadow: isActive
                    ? '0 0 8px rgba(4, 120, 87, 0.4)'
                    : isCompleted
                    ? '0 0 4px rgba(4, 120, 87, 0.25)'
                    : 'none',
                }}
              />

              {/* Label below progress bar (hidden on very small screens, visible on md+) */}
              <div className="hidden sm:flex items-center justify-between text-[10px] font-mono">
                <span
                  className="truncate transition-colors duration-200"
                  style={{
                    color: isActive ? '#f8f9fa' : isCompleted ? '#D72638' : '#64748b',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {label}
                </span>
                {isCompleted && (
                  <span className="text-[9px] text-[#D72638] font-bold ml-0.5">✓</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
