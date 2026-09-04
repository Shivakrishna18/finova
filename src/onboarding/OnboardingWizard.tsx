import React, { useState, useMemo } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useFinance, formatINR } from '../finance/FinanceContext'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  TrendingUp,
  CreditCard,
  Target,
  Shield,
  Wallet,
  Zap,
  Layers,
  Sparkles,
  Activity,
} from 'lucide-react'
import Financial3DCanvas from './Financial3DCanvas'
import OnboardingStepProgress from './OnboardingStepProgress'
import DimensionalValue from './DimensionalValue'

interface OnboardingWizardProps {
  onComplete?: () => void
  onExit?: () => void
}

interface CommitmentItem {
  name: string
  amount: number
  frequency: 'Monthly' | 'Quarterly' | 'Annual'
  category?: string
}

interface GoalItem {
  name: string
  target: number
  current: number
  monthlyContribution: number
  targetDate: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

const STEP_LABELS = [
  'Income Velocity',
  'Spending Rate',
  'Commitments',
  'Goals Constellation',
  'Liquidity Buffer',
  'Twin Synthesis',
]

export default function OnboardingWizard({ onComplete, onExit }: OnboardingWizardProps) {
  const { user, completeOnboarding } = useAuth()
  const { initializeUserFinancialProfile } = useFinance()

  const [step, setStep] = useState<number>(1)
  const totalSteps = 6

  // Form State
  const [income, setIncome] = useState<string>('75000')
  const [spending, setSpending] = useState<string>('35000')
  const [commitments, setCommitments] = useState<CommitmentItem[]>([
    { name: 'House Rent', amount: 15000, frequency: 'Monthly', category: 'Housing' },
    { name: 'Wifi & Subscriptions', amount: 2000, frequency: 'Monthly', category: 'Subscription' },
  ])
  const [newCommitmentName, setNewCommitmentName] = useState('')
  const [newCommitmentAmount, setNewCommitmentAmount] = useState('')
  const [newCommitmentFreq, setNewCommitmentFreq] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Monthly')

  const [goals, setGoals] = useState<GoalItem[]>([
    {
      name: 'Emergency Buffer',
      target: 100000,
      current: 40000,
      monthlyContribution: 8000,
      targetDate: '2026-10-31',
      priority: 'HIGH',
    },
  ])
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalTarget, setNewGoalTarget] = useState('')
  const [newGoalCurrent, setNewGoalCurrent] = useState('')
  const [newGoalContribution, setNewGoalContribution] = useState('')
  const [newGoalPriority, setNewGoalPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH')

  const [emergencySavings, setEmergencySavings] = useState<string>('50000')
  const [preference, setPreference] = useState<string>('Save more')

  const [isFinishing, setIsFinishing] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)

  // Numeric parsing
  const numericIncome = Math.max(0, parseFloat(income.replace(/[^0-9.]/g, '') || '0'))
  const numericSpending = Math.max(0, parseFloat(spending.replace(/[^0-9.]/g, '') || '0'))
  const numericEmergency = Math.max(0, parseFloat(emergencySavings.replace(/[^0-9.]/g, '') || '0'))

  // Derived real-time metrics for Step 6 Financial Twin preview
  const liveMetrics = useMemo(() => {
    const monthlyCommitmentsTotal = commitments.reduce((sum, c) => {
      const amt = Math.max(0, c.amount || 0)
      if (c.frequency === 'Annual') return sum + amt / 12
      if (c.frequency === 'Quarterly') return sum + amt / 3
      return sum + amt
    }, 0)

    const monthlyGoalsTotal = goals.reduce(
      (sum, g) => sum + Math.max(0, g.monthlyContribution || 0),
      0
    )

    const safeToSpend = Math.max(
      0,
      Math.round(numericIncome - numericSpending - monthlyCommitmentsTotal - monthlyGoalsTotal)
    )
    const monthlySurplus = Math.round(numericIncome - numericSpending - monthlyCommitmentsTotal)
    const savingsRate =
      numericIncome > 0 ? Math.round(((numericIncome - numericSpending) / numericIncome) * 100) : 0
    const runwayMonths = numericSpending > 0 ? (numericEmergency / numericSpending).toFixed(1) : '3.0'

    let healthScore = 65
    if (numericSpending > 0) {
      const coverRatio = numericEmergency / numericSpending
      if (coverRatio >= 6) healthScore += 18
      else if (coverRatio >= 3) healthScore += 12
      else if (coverRatio >= 1) healthScore += 6
      else healthScore -= 10
    }
    if (numericIncome > numericSpending + monthlyCommitmentsTotal) {
      healthScore += 10
    } else if (numericIncome < numericSpending) {
      healthScore -= 15
    }
    if (goals.length > 0) {
      healthScore += 7
    }
    healthScore = Math.min(96, Math.max(35, Math.round(healthScore)))

    return {
      safeToSpend,
      monthlySurplus,
      savingsRate: Math.max(0, Math.min(100, savingsRate)),
      healthScore,
      runwayMonths,
      monthlyCommitmentsTotal: Math.round(monthlyCommitmentsTotal),
      monthlyGoalsTotal: Math.round(monthlyGoalsTotal),
    }
  }, [numericIncome, numericSpending, numericEmergency, commitments, goals])

  // Quick addition helpers
  const handleAddCommitment = () => {
    const amt = parseFloat(newCommitmentAmount.replace(/[^0-9.]/g, ''))
    if (!newCommitmentName.trim() || isNaN(amt) || amt <= 0) return

    setCommitments(prev => [
      ...prev,
      {
        name: newCommitmentName.trim(),
        amount: amt,
        frequency: newCommitmentFreq,
      },
    ])
    setNewCommitmentName('')
    setNewCommitmentAmount('')
  }

  const handleRemoveCommitment = (idx: number) => {
    setCommitments(prev => prev.filter((_, i) => i !== idx))
  }

  const handleAddGoal = () => {
    const target = parseFloat(newGoalTarget.replace(/[^0-9.]/g, ''))
    const current = parseFloat(newGoalCurrent.replace(/[^0-9.]/g, '') || '0')
    const contrib = parseFloat(newGoalContribution.replace(/[^0-9.]/g, '') || '5000')

    if (!newGoalName.trim() || isNaN(target) || target <= 0) return

    setGoals(prev => [
      ...prev,
      {
        name: newGoalName.trim(),
        target,
        current: isNaN(current) ? 0 : current,
        monthlyContribution: isNaN(contrib) ? 0 : contrib,
        targetDate: '2026-12-31',
        priority: newGoalPriority,
      },
    ])
    setNewGoalName('')
    setNewGoalTarget('')
    setNewGoalCurrent('')
    setNewGoalContribution('')
  }

  const handleRemoveGoal = (idx: number) => {
    setGoals(prev => prev.filter((_, i) => i !== idx))
  }

  const handleFinish = () => {
    setIsFinishing(true)
    setIsSynthesizing(true)

    const numIncome = parseFloat(income.replace(/[^0-9.]/g, '') || '60000')
    const numSpending = parseFloat(spending.replace(/[^0-9.]/g, '') || '30000')
    const numEmergency = parseFloat(emergencySavings.replace(/[^0-9.]/g, '') || '40000')

    // Initialize user profile in FinanceContext
    initializeUserFinancialProfile({
      income: isNaN(numIncome) ? 60000 : numIncome,
      spending: isNaN(numSpending) ? 30000 : numSpending,
      emergencyReserve: isNaN(numEmergency) ? 40000 : numEmergency,
      commitments,
      goals,
      financialPreference: preference,
    })

    // Mark user onboarding complete in AuthContext
    completeOnboarding(preference)

    setTimeout(() => {
      setIsFinishing(false)
      if (onComplete) onComplete()
    }, 750)
  }

  const preferencesList = [
    { id: 'Save more', label: 'Save more', desc: 'Identify surplus cash and maximize monthly wealth accumulation.' },
    { id: 'Control spending', label: 'Control spending', desc: 'Establish strict guardrails on discretionary & impulse purchases.' },
    { id: 'Build emergency savings', label: 'Build emergency savings', desc: 'Construct a resilient 3-6 month liquid safety reserve.' },
    { id: 'Reach my goals', label: 'Reach my goals', desc: 'Accelerate target dates and protect goals from purchase drift.' },
    { id: 'Manage bills', label: 'Manage bills', desc: 'Guarantee 100% on-time commitment funding without cash crunches.' },
    { id: 'Understand my finances', label: 'Understand my finances', desc: 'Gain deep predictive clarity into cash flow & financial twin behavior.' },
  ]

  return (
    <div className="relative min-h-screen w-full bg-[#0f172a] text-slate-100 flex flex-col items-center justify-between overflow-x-hidden select-none">
      {/* 3D WebGL Financial Spatial Engine Background */}
      <Financial3DCanvas
        step={step}
        income={numericIncome}
        spending={numericSpending}
        commitments={commitments}
        goals={goals}
        emergencySavings={numericEmergency}
        preference={preference}
        isSynchronized={isSynthesizing}
      />

      {/* Subtle Environmental Ambient Layers */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-75"
        style={{
          background:
            'radial-gradient(circle at 50% 15%, rgba(30, 41, 59, 0.55) 0%, rgba(15, 23, 42, 0.88) 70%, #0f172a 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px] opacity-25"
      />

      {/* Top Header Navigation Bar */}
      <header className="relative z-10 w-full max-w-5xl px-4 sm:px-6 pt-6 pb-2">
        <OnboardingStepProgress
          currentStep={step}
          totalSteps={totalSteps}
          stepLabels={STEP_LABELS}
          onStepClick={targetStep => setStep(targetStep)}
        />
      </header>

      {/* Main Content Area (Balanced 2-Column Responsive Layout) */}
      <main className="relative z-10 w-full max-w-5xl px-4 sm:px-6 py-4 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Functional Console Panel */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              className="w-full rounded-2xl p-6 sm:p-7 backdrop-blur-xl transition-all duration-300"
              style={{
                background: 'rgba(30, 41, 59, 0.88)',
                border: '1px solid rgba(148, 163, 184, 0.16)',
                boxShadow:
                  '0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* STEP 1: INCOME VELOCITY */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-[#D72638] mb-1.5">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-[11px] font-bold font-mono tracking-wider">
                        LAYER 01 / INCOME VELOCITY
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-[#f8f9fa] tracking-tight">
                      What is your typical monthly income?
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-300 mt-1 leading-relaxed">
                      FINOVA models your baseline earning stream to establish cash velocity, ringfence obligations, and compute safe spending thresholds.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-2 tracking-wider">
                      MONTHLY NET INFLOW (INR)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-lg font-bold text-[#D72638] select-none">
                        ₹
                      </span>
                      <input
                        type="text"
                        value={income}
                        onChange={e => setIncome(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="75,000"
                        className="w-full pl-10 pr-4 py-3.5 bg-[#0f172a] border border-slate-700/80 rounded-xl text-white text-lg font-mono font-semibold focus:border-[#D72638] focus:outline-none transition-colors"
                      />
                    </div>
                    {numericIncome > 0 && (
                      <div className="mt-2 text-xs font-mono text-slate-300 flex items-center justify-between">
                        <span>Formatted: {formatINR(numericIncome)} / month</span>
                        <span className="text-slate-400 text-[11px]">
                          ≈ {formatINR(numericIncome * 12)} / year
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 tracking-wider block mb-2">
                      QUICK PRESETS
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {['45000', '75000', '120000', '200000'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setIncome(val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer ${
                            income === val
                              ? 'bg-[#3F0D12]/80 text-[#FBE4E3] border border-[#D72638]/80'
                              : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700/80'
                          }`}
                        >
                          {formatINR(Number(val))}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: EXPENSE RATE */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                      <Wallet className="w-4 h-4" />
                      <span className="text-[11px] font-bold font-mono tracking-wider">
                        LAYER 02 / SPENDING RATE
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-[#f8f9fa] tracking-tight">
                      Approximately how much do you spend each month?
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-300 mt-1 leading-relaxed">
                      Include regular living costs, groceries, dining, commute, shopping, and everyday discretionary spending.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-2 tracking-wider">
                      ESTIMATED MONTHLY EXPENSES (INR)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-lg font-bold text-amber-400 select-none">
                        ₹
                      </span>
                      <input
                        type="text"
                        value={spending}
                        onChange={e => setSpending(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="35,000"
                        className="w-full pl-10 pr-4 py-3.5 bg-[#0f172a] border border-slate-700/80 rounded-xl text-white text-lg font-mono font-semibold focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>
                    {numericSpending > 0 && (
                      <div className="mt-2 text-xs font-mono text-slate-300 flex items-center justify-between">
                        <span>Formatted: {formatINR(numericSpending)} / month</span>
                        {numericIncome > 0 && (
                          <span className="text-slate-400 text-[11px]">
                            {Math.round((numericSpending / numericIncome) * 100)}% of monthly income
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 tracking-wider block mb-2">
                      QUICK PRESETS
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {['20000', '35000', '60000', '100000'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSpending(val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer ${
                            spending === val
                              ? 'bg-amber-900/40 text-amber-300 border border-amber-500/80'
                              : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700/80'
                          }`}
                        >
                          {formatINR(Number(val))}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: COMMITMENTS & BILLS */}
              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-[11px] font-bold font-mono tracking-wider">
                        LAYER 03 / FIXED COMMITMENTS
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-[#f8f9fa] tracking-tight">
                      What recurring payments do you have?
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-300 mt-1 leading-relaxed">
                      Add recurring rent, EMI/loans, insurance, utilities, or subscriptions so FINOVA ringfences funds automatically.
                    </p>
                  </div>

                  {/* Current commitments list */}
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {commitments.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs"
                      >
                        <div>
                          <strong className="text-slate-100 block text-xs">{item.name}</strong>
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.frequency}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-[#D72638]">
                            {formatINR(item.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCommitment(i)}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer transition-colors"
                            title="Remove commitment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {commitments.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400 bg-slate-800/50 rounded-lg border border-slate-700/40">
                        No commitments added yet. Add below or skip to proceed.
                      </div>
                    )}
                  </div>

                  {/* Add Commitment Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#0f172a] p-2.5 rounded-xl border border-slate-700/70">
                    <input
                      type="text"
                      placeholder="e.g. House Rent"
                      value={newCommitmentName}
                      onChange={e => setNewCommitmentName(e.target.value)}
                      className="sm:col-span-5 px-2.5 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#D72638]"
                    />
                    <input
                      type="text"
                      placeholder="Amount (₹)"
                      value={newCommitmentAmount}
                      onChange={e => setNewCommitmentAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      className="sm:col-span-3 px-2.5 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-[#D72638]"
                    />
                    <select
                      value={newCommitmentFreq}
                      onChange={e => setNewCommitmentFreq(e.target.value as any)}
                      className="sm:col-span-2 px-2 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-[11px] focus:outline-none focus:border-[#D72638]"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Annual">Annual</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddCommitment}
                      className="sm:col-span-2 px-3 py-2 bg-[#D72638] text-white rounded-lg text-xs font-semibold hover:bg-[#98111E] flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: GOALS */}
              {step === 4 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#D72638] mb-1.5">
                      <Target className="w-4 h-4" />
                      <span className="text-[11px] font-bold font-mono tracking-wider">
                        LAYER 04 / GOALS CONSTELLATION
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-[#f8f9fa] tracking-tight">
                      What are you currently saving for?
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-300 mt-1 leading-relaxed">
                      FINOVA evaluates future purchase decisions against your goal timelines to prevent delay drift.
                    </p>
                  </div>

                  {/* Goal Cards list */}
                  <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {goals.map((goal, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <strong className="text-white text-xs">{goal.name}</strong>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                                goal.priority === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-[#D72638]/20 text-[#FBE4E3] border border-[#D72638]/30'
                              }`}
                            >
                              {goal.priority}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGoal(i)}
                            className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-slate-300">
                          <span>Saved: {formatINR(goal.current)}</span>
                          <span>Target: {formatINR(goal.target)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700/70 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D72638] transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((goal.current / goal.target) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Goal Container */}
                  <div className="flex flex-col gap-2 bg-[#0f172a] p-3 rounded-xl border border-slate-700/70">
                    {/* Dynamic Context Suggestions */}
                    <div className="flex flex-col gap-1.5 pb-1 border-b border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400">
                        SUGGESTED GOALS (ADAPTED TO CASH FLOW):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          {
                            name: 'Emergency Buffer',
                            target: (numericSpending || 35000) * 3,
                            current: Math.round((numericSpending || 35000) * 0.5),
                            monthly: Math.round(Math.max(5000, (numericIncome || 80000) - (numericSpending || 35000)) * 0.35),
                            priority: 'HIGH' as const,
                          },
                          {
                            name: 'Tech & Setup',
                            target: Math.round((numericIncome || 80000) * 1.2),
                            current: Math.round((numericIncome || 80000) * 0.25),
                            monthly: Math.round(Math.max(5000, (numericIncome || 80000) - (numericSpending || 35000)) * 0.25),
                            priority: 'MEDIUM' as const,
                          },
                          {
                            name: 'Annual Travel',
                            target: Math.round((numericIncome || 80000) * 0.8),
                            current: Math.round((numericIncome || 80000) * 0.2),
                            monthly: Math.round(Math.max(5000, (numericIncome || 80000) - (numericSpending || 35000)) * 0.2),
                            priority: 'MEDIUM' as const,
                          },
                          {
                            name: 'Long-term Growth',
                            target: Math.round((numericIncome || 80000) * 5),
                            current: Math.round((numericIncome || 80000) * 1.5),
                            monthly: Math.round(Math.max(5000, (numericIncome || 80000) - (numericSpending || 35000)) * 0.4),
                            priority: 'HIGH' as const,
                          },
                        ].map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewGoalName(s.name);
                              setNewGoalTarget(String(s.target));
                              setNewGoalCurrent(String(s.current));
                              setNewGoalContribution(String(s.monthly));
                              setNewGoalPriority(s.priority);
                            }}
                            className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800/90 border border-slate-700/80 hover:border-[#D72638] hover:text-[#FBE4E3] text-slate-300 transition-colors cursor-pointer"
                          >
                            + {s.name} ({formatINR(s.target)})
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Goal name (e.g. Home Downpayment)"
                        value={newGoalName}
                        onChange={e => setNewGoalName(e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#D72638]"
                      />
                      <input
                        type="text"
                        placeholder="Target Amount (₹)"
                        value={newGoalTarget}
                        onChange={e => setNewGoalTarget(e.target.value.replace(/[^0-9]/g, ''))}
                        className="px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-[#D72638]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Saved (₹)"
                        value={newGoalCurrent}
                        onChange={e => setNewGoalCurrent(e.target.value.replace(/[^0-9]/g, ''))}
                        className="px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-[#D72638]"
                      />
                      <input
                        type="text"
                        placeholder="Monthly save (₹)"
                        value={newGoalContribution}
                        onChange={e =>
                          setNewGoalContribution(e.target.value.replace(/[^0-9]/g, ''))
                        }
                        className="px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-[11px] font-mono focus:outline-none focus:border-[#D72638]"
                      />
                      <select
                        value={newGoalPriority}
                        onChange={e => setNewGoalPriority(e.target.value as any)}
                        className="px-2 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-white text-[10px] focus:outline-none focus:border-[#D72638]"
                      >
                        <option value="HIGH">High Priority</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low Priority</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddGoal}
                      className="w-full py-2 bg-[#D72638] text-white rounded-lg text-xs font-semibold hover:bg-[#98111E] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Goal to Constellation
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: EMERGENCY RESERVE */}
              {step === 5 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <div className="flex items-center gap-2 text-[#D72638] mb-1.5">
                      <Shield className="w-4 h-4" />
                      <span className="text-[11px] font-bold font-mono tracking-wider">
                        LAYER 05 / LIQUIDITY BUFFER
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-[#f8f9fa] tracking-tight">
                      How much emergency savings do you have?
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-300 mt-1 leading-relaxed">
                      A liquid reserve protects your cash flow against unexpected shocks without liquidating investments.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-2 tracking-wider">
                      EMERGENCY / LIQUID SAVINGS (INR)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-lg font-bold text-[#D72638] select-none">
                        ₹
                      </span>
                      <input
                        type="text"
                        value={emergencySavings}
                        onChange={e => setEmergencySavings(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="50,000"
                        className="w-full pl-10 pr-4 py-3.5 bg-[#0f172a] border border-slate-700/80 rounded-xl text-white text-lg font-mono font-semibold focus:border-[#D72638] focus:outline-none transition-colors"
                      />
                    </div>
                    {numericEmergency > 0 && numericSpending > 0 && (
                      <div className="mt-2 text-xs font-mono text-slate-300 flex items-center justify-between">
                        <span>Formatted: {formatINR(numericEmergency)}</span>
                        <span className="text-slate-400 text-[11px]">
                          Buffer Cover: {(numericEmergency / numericSpending).toFixed(1)} months
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 tracking-wider block mb-2">
                      QUICK PRESETS
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {['25000', '50000', '100000', '250000'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setEmergencySavings(val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer ${
                            emergencySavings === val
                              ? 'bg-[#3F0D12]/80 text-[#FBE4E3] border border-[#D72638]/80'
                              : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700/80'
                          }`}
                        >
                          {formatINR(Number(val))}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: SYNCHRONIZATION & PREFERENCE */}
              {step === 6 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[11px] font-bold font-mono tracking-wider">
                        LAYER 06 / FINANCIAL SYNCHRONIZATION
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-[#f8f9fa] tracking-tight">
                      Financial Twin Synthesized
                    </h2>
                    <p className="text-xs sm:text-[13px] text-slate-300 mt-1 leading-relaxed">
                      Select your primary advisory focus to tailor FINOVA&apos;s real-time recommendations and Action Center directives.
                    </p>
                  </div>

                  {/* Options selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {preferencesList.map(item => {
                      const isSelected = preference === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPreference(item.id)}
                          className={`p-3 rounded-xl text-left cursor-pointer transition-all duration-150 flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-[#3F0D12]/80 border border-[#D72638]'
                              : 'bg-slate-800/70 border border-slate-700/60 hover:bg-slate-700/70'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-xs text-white">{item.label}</strong>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-[#D72638] bg-[#D72638] text-slate-950'
                                  : 'border-slate-600 bg-transparent'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 font-bold" />}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                            {item.desc}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Footer Controls */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/60">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2.5">
                  {step < totalSteps ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setStep(s => s + 1)}
                        className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-2 cursor-pointer transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(s => s + 1)}
                        className="px-5 py-2.5 bg-[#D72638] hover:bg-[#98111E] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={isFinishing}
                      className="px-6 py-3 bg-[#D72638] hover:bg-[#98111E] text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isFinishing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Synthesizing Financial Twin...</span>
                        </>
                      ) : (
                        <>
                          <span>Launch FINOVA Dashboard</span>
                          <Zap className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real-time 3D Financial Twin HUD Metrics */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div
              className="rounded-2xl p-5 sm:p-6 backdrop-blur-xl flex flex-col gap-4 transition-all duration-300"
              style={{
                background: 'rgba(30, 41, 59, 0.88)',
                border: '1px solid rgba(148, 163, 184, 0.16)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#D72638]" />
                  <span className="text-[11px] font-mono font-bold tracking-widest text-slate-300">
                    FINANCIAL TWIN TELEMETRY
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D72638]/15 text-[#D72638] border border-[#D72638]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>

              {/* Primary Dimensional Metric */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                  PREDICTIVE SAFE TO SPEND
                </span>
                <DimensionalValue
                  value={formatINR(liveMetrics.safeToSpend)}
                  accentColor="#D72638"
                  size="lg"
                  sublabel={`Remaining unallocated buffer per cycle`}
                />
              </div>

              {/* Multi-metric 2x2 grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400">FINANCIAL HEALTH</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold font-mono text-[#D72638]">
                      {liveMetrics.healthScore}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    {liveMetrics.healthScore >= 75
                      ? 'Resilient Model'
                      : liveMetrics.healthScore >= 55
                      ? 'Balanced Flow'
                      : 'Optimization Needed'}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400">MONTHLY SURPLUS</span>
                  <span className="text-base font-bold font-mono text-slate-100 mt-1">
                    {formatINR(liveMetrics.monthlySurplus)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    {liveMetrics.savingsRate}% savings rate
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400">BUFFER RUNWAY</span>
                  <span className="text-base font-bold font-mono text-amber-400 mt-1">
                    {liveMetrics.runwayMonths} Months
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">Liquid emergency cover</span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400">RINGFENCED BILLS</span>
                  <span className="text-base font-bold font-mono text-slate-100 mt-1">
                    {formatINR(liveMetrics.monthlyCommitmentsTotal)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    {commitments.length} fixed obligations
                  </span>
                </div>
              </div>

              {/* Dynamic Step Intelligence Brief */}
              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-700/70 text-xs flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-[#D72638] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <strong className="text-slate-200 text-[11px] font-mono">
                    ACTIVE LAYER INSIGHT
                  </strong>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {step === 1 &&
                      'Income velocity sets the ceiling of your financial model and determines baseline liquidity velocity.'}
                    {step === 2 &&
                      'Spending dynamics quantify daily lifestyle cash draw, calculating discretionary spending room.'}
                    {step === 3 &&
                      'Commitment markers ringfence critical bills to ensure zero missed payment penalties or cash crunches.'}
                    {step === 4 &&
                      'Goals constellation forms gravitational targets evaluated against all future purchase requests.'}
                    {step === 5 &&
                      'Liquidity buffer creates an emergency defense shield protecting long-term wealth from unexpected friction.'}
                    {step === 6 &&
                      'All 5 layers are synthesized into your live Financial Twin, continuously predicting and advising in real time.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile attribution footer */}
            <div className="text-center text-[11px] text-slate-400 font-mono">
              Configuring Financial OS for{' '}
              <span className="text-slate-200">{user?.name || user?.email || 'User'}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom exit / safety bar */}
      <footer className="relative z-10 w-full max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>FINOVA v2.4 · 3D Spatial Financial Engine</span>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Return to Landing Page
          </button>
        )}
      </footer>
    </div>
  )
}
