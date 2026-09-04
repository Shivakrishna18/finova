import type { DemoFinancialState, Goal, Transaction } from '../data/demoFinancialState'
import { formatINR } from '../data/demoFinancialState'

export type IncomeRecord = DemoFinancialState['incomeRecords'][number]
export type Commitment = DemoFinancialState['commitments'][number]
export type UpcomingItem = DemoFinancialState['upcoming'][number]

export interface BudgetMetric {
  category: string
  budget: number
  actual: number
  remaining: number
  utilization: number
  isOverBudget: boolean
  isNearLimit: boolean
  status: 'OVER BUDGET' | 'WATCH' | 'ON TRACK'
}

export interface GoalMetric {
  id: string
  name: string
  saved: number
  target: number
  remaining: number
  progress: number
  isCompleted: boolean
  monthlyContribution: number
  requiredMonthly: number
  estimatedMonths: number
  targetDate?: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Completed' | 'Ahead' | 'On Track' | 'Needs Attention' | 'At Risk'
  statusNote: string
}

export interface HealthFactor {
  name: string
  score: number
  note: string
}

export type HealthLevel = 'EXCELLENT' | 'HEALTHY' | 'STABLE' | 'WATCH' | 'AT RISK'

export interface FinancialSignal {
  id: string
  type: 'POSITIVE' | 'WARNING' | 'CRITICAL' | 'INFO'
  title: string
  explanation: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  relatedGoalId?: string
  route?: string
}

export interface FinancialIntelligence {
  liquidity: {
    balance: number
    safeToSpend: number
    committedAmount: number
    availableAfterCommitments: number
    monthlyIncome: number
    monthlySpending: number
    monthlySurplus: number
    monthlyDeficit: number
    isDeficit: boolean
  }
  cashFlow: {
    monthlyIncome: number
    monthlySpending: number
    monthlySurplus: number
    savingsRate: number
    spendingVelocity: number
    runwayDays: number
    cashFlowPressure: 'LOW' | 'BALANCED' | 'ELEVATED' | 'HIGH' | 'CRITICAL'
    cashFlowStatus: 'SURPLUS' | 'BREAK-EVEN' | 'DEFICIT'
  }
  savings: {
    savingsAmount: number
    savingsRate: number
    emergencyReserve: number
    emergencyTarget: number
    emergencyProgress: number
    emergencyCoverageMonths: number
    emergencyCoverageDays: string
    reserveStatus: 'Strong' | 'Healthy' | 'Building' | 'Low' | 'Critical'
  }
  budgets: {
    categories: BudgetMetric[]
    totalBudget: number
    totalActual: number
    totalRemaining: number
    overallUtilization: number
    overBudgetCount: number
    nearLimitCount: number
    onTrackCount: number
    overBudgetCategories: string[]
    nearLimitCategories: string[]
  }
  goals: {
    items: GoalMetric[]
    totalTarget: number
    totalSaved: number
    totalRemaining: number
    aggregateProgress: number
    totalMonthlyContribution: number
    completedCount: number
    aheadCount: number
    onTrackCount: number
    needsAttentionCount: number
    atRiskCount: number
  }
  commitments: {
    items: Commitment[]
    totalActiveCommitments: number
    upcomingAmount: number
    commitmentToIncomeRatio: number
    commitmentPressure: 'LOW' | 'MODERATE' | 'HIGH'
    availableAfterCommitments: number
    goalAllocationAmount: number
  }
  health: {
    score: number
    level: HealthLevel
    summary: string
    factors: HealthFactor[]
    radar: { name: string; score: number }[]
    signals: { title: string; reason: string; impact: string; route: string }[]
    priorities: { title: string; reason: string; level: 'HIGH' | 'MEDIUM' | 'LOW' }[]
    dna: { name: string; score: number; trend: string }[]
    stability: { name: string; trend: string; note: string }[]
    positives: string[]
    reserve: number
    coverage: string
    briefing: { state: string; matters: string; next: string }
    nextAction: string
    nextReason: string
    nextRoute: string
    warnings: string[]
  }
  signals: {
    list: FinancialSignal[]
    positiveCount: number
    warningCount: number
    criticalCount: number
  }
}

// -------------------------------------------------------------------------
// Helper: Numerical Safety Utilities
// -------------------------------------------------------------------------

export function clamp(value: number, min = 0, max = 100): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

export function safeNumber(value: unknown, fallback = 0): number {
  const num = Number(value)
  return Number.isNaN(num) || !Number.isFinite(num) ? fallback : num
}

// -------------------------------------------------------------------------
// 1. Safe-To-Spend Engine
// -------------------------------------------------------------------------

export function calculateSafeToSpend(
  state: DemoFinancialState,
  discretionaryAdjustment = 0
): number {
  const balance = Math.max(0, safeNumber(state.balance))
  const commitments = Array.isArray(state.commitments) ? state.commitments : []
  const totalCommitments = commitments.reduce((sum, c) => sum + Math.max(0, safeNumber(c.amount)), 0)
  const goalAllocation =
    commitments.find(c => c.type === 'Goal allocation')?.amount ?? 0

  const trueAvailable = Math.max(0, balance - totalCommitments)
  const discretionary = Math.max(0, safeNumber(discretionaryAdjustment))

  return Math.max(0, trueAvailable - goalAllocation - discretionary)
}

// -------------------------------------------------------------------------
// 2. Budget Intelligence
// -------------------------------------------------------------------------

export function calculateBudgetMetric(
  category: string,
  budgetAmount: number,
  transactions: Transaction[]
): BudgetMetric {
  const normCategory = (category || '').trim().toLowerCase()
  const txList = Array.isArray(transactions) ? transactions : []

  const actual = txList
    .filter(tx => {
      if (tx.category === 'Income') return false
      const txCat = (tx.category === 'Food & Dining' ? 'Food' : tx.category || '').trim().toLowerCase()
      return txCat === normCategory || txCat.includes(normCategory) || normCategory.includes(txCat)
    })
    .reduce((sum, tx) => sum + Math.max(0, safeNumber(tx.amount)), 0)

  const budget = Math.max(0, safeNumber(budgetAmount))
  const remaining = Math.max(0, budget - actual)
  const utilization = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0
  const isOverBudget = actual > budget
  const isNearLimit = !isOverBudget && actual >= budget * 0.75
  const status: 'OVER BUDGET' | 'WATCH' | 'ON TRACK' = isOverBudget
    ? 'OVER BUDGET'
    : isNearLimit
    ? 'WATCH'
    : 'ON TRACK'

  return {
    category,
    budget,
    actual,
    remaining,
    utilization: Math.round(utilization),
    isOverBudget,
    isNearLimit,
    status,
  }
}

export function calculateBudgetIntelligence(
  budgetsRecord: Record<string, number> | undefined,
  transactions: Transaction[]
): FinancialIntelligence['budgets'] {
  const budgets = budgetsRecord && typeof budgetsRecord === 'object' ? budgetsRecord : {}
  const categories = Object.entries(budgets).map(([category, amount]) =>
    calculateBudgetMetric(category, amount, transactions)
  )

  const totalBudget = categories.reduce((sum, b) => sum + b.budget, 0)
  const totalActual = categories.reduce((sum, b) => sum + b.actual, 0)
  const totalRemaining = Math.max(0, totalBudget - totalActual)
  const overallUtilization = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0

  const overBudgetCategories = categories.filter(b => b.isOverBudget).map(b => b.category)
  const nearLimitCategories = categories.filter(b => b.isNearLimit).map(b => b.category)

  return {
    categories,
    totalBudget,
    totalActual,
    totalRemaining,
    overallUtilization,
    overBudgetCount: overBudgetCategories.length,
    nearLimitCount: nearLimitCategories.length,
    onTrackCount: categories.filter(b => !b.isOverBudget && !b.isNearLimit).length,
    overBudgetCategories,
    nearLimitCategories,
  }
}

// -------------------------------------------------------------------------
// 3. Goal Intelligence
// -------------------------------------------------------------------------

export function calculateGoalMetrics(
  goal: Goal,
  customMonthlyContribution?: number
): GoalMetric {
  const target = Math.max(1, safeNumber(goal.target, 1))
  const saved = Math.max(0, safeNumber(goal.saved, 0))
  const remaining = Math.max(0, target - saved)
  const progress = Math.min(100, Math.max(0, Math.round((saved / target) * 100)))
  const isCompleted = saved >= target

  const monthlyContribution =
    customMonthlyContribution !== undefined && !Number.isNaN(Number(customMonthlyContribution)) && Number(customMonthlyContribution) >= 0
      ? Number(customMonthlyContribution)
      : goal.monthlyContribution !== undefined && !Number.isNaN(Number(goal.monthlyContribution)) && Number(goal.monthlyContribution) >= 0
      ? Number(goal.monthlyContribution)
      : 10000

  let monthsToTarget = 12
  if (goal.targetDate) {
    const today = new Date()
    const deadline = new Date(`${goal.targetDate}T00:00:00`)
    if (!Number.isNaN(deadline.getTime())) {
      monthsToTarget = Math.max(
        1,
        (deadline.getFullYear() - today.getFullYear()) * 12 +
          deadline.getMonth() -
          today.getMonth()
      )
    }
  } else if (goal.completion && goal.completion.includes('month')) {
    const parsed = parseInt(goal.completion, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      monthsToTarget = parsed
    }
  }

  const requiredMonthly = Math.ceil(remaining / Math.max(1, monthsToTarget))
  const estimatedMonths = isCompleted ? 0 : Math.ceil(remaining / Math.max(1, monthlyContribution))

  let status: GoalMetric['status'] = 'On Track'
  let statusNote = 'On track to meet target.'

  if (isCompleted) {
    status = 'Completed'
    statusNote = 'Goal target achieved.'
  } else if (monthlyContribution >= requiredMonthly * 1.25 || progress >= 85) {
    status = 'Ahead'
    statusNote = 'Pacing ahead of projected target schedule.'
  } else if (monthlyContribution >= requiredMonthly) {
    status = 'On Track'
    statusNote = 'Current contributions are sufficient to reach target.'
  } else if (monthlyContribution >= requiredMonthly * 0.7) {
    status = 'Needs Attention'
    statusNote = 'Moderate gap between monthly savings and target deadline.'
  } else {
    status = 'At Risk'
    statusNote = 'Requires adjustment to contributions or target date.'
  }

  return {
    id: goal.id,
    name: goal.name,
    saved,
    target,
    remaining,
    progress,
    isCompleted,
    monthlyContribution,
    requiredMonthly,
    estimatedMonths,
    targetDate: goal.targetDate,
    priority: goal.priority || 'Medium',
    status,
    statusNote,
  }
}

export function calculateGoalIntelligence(goalsList: Goal[] | undefined): FinancialIntelligence['goals'] {
  const goals = Array.isArray(goalsList) ? goalsList : []
  const items = goals.map(g => calculateGoalMetrics(g))

  const totalTarget = items.reduce((sum, g) => sum + g.target, 0)
  const totalSaved = items.reduce((sum, g) => sum + g.saved, 0)
  const totalRemaining = Math.max(0, totalTarget - totalSaved)
  const aggregateProgress =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0
  const totalMonthlyContribution = items.reduce((sum, g) => sum + g.monthlyContribution, 0)

  return {
    items,
    totalTarget,
    totalSaved,
    totalRemaining,
    aggregateProgress,
    totalMonthlyContribution,
    completedCount: items.filter(g => g.status === 'Completed').length,
    aheadCount: items.filter(g => g.status === 'Ahead').length,
    onTrackCount: items.filter(g => g.status === 'On Track').length,
    needsAttentionCount: items.filter(g => g.status === 'Needs Attention').length,
    atRiskCount: items.filter(g => g.status === 'At Risk').length,
  }
}

// -------------------------------------------------------------------------
// 4. Commitment Intelligence
// -------------------------------------------------------------------------

export function calculateCommitmentIntelligence(
  state: DemoFinancialState
): FinancialIntelligence['commitments'] {
  const commitments = Array.isArray(state.commitments) ? state.commitments : []
  const totalActiveCommitments = commitments.reduce((sum, c) => sum + Math.max(0, safeNumber(c.amount)), 0)
  const upcomingAmount = Array.isArray(state.upcoming)
    ? state.upcoming.reduce((sum, u) => sum + Math.max(0, safeNumber(u.amount)), 0)
    : 0

  const income = Math.max(1, safeNumber(state.income, 1))
  const commitmentToIncomeRatio = Math.round((totalActiveCommitments / income) * 100)

  let commitmentPressure: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW'
  if (commitmentToIncomeRatio > 40 || totalActiveCommitments > 25000) {
    commitmentPressure = 'HIGH'
  } else if (commitmentToIncomeRatio > 20 || totalActiveCommitments > 12000) {
    commitmentPressure = 'MODERATE'
  }

  const balance = Math.max(0, safeNumber(state.balance))
  const availableAfterCommitments = Math.max(0, balance - totalActiveCommitments)
  const goalAllocationAmount =
    commitments.find(item => item.type === 'Goal allocation')?.amount ?? 0

  return {
    items: commitments,
    totalActiveCommitments,
    upcomingAmount,
    commitmentToIncomeRatio,
    commitmentPressure,
    availableAfterCommitments,
    goalAllocationAmount,
  }
}

// -------------------------------------------------------------------------
// 5. Emergency Reserve Intelligence
// -------------------------------------------------------------------------

export function calculateEmergencyReserveIntelligence(
  state: DemoFinancialState
): FinancialIntelligence['savings'] {
  const income = Math.max(0, safeNumber(state.income))
  const spending = Math.max(0, safeNumber(state.monthlySpending))
  const savingsAmount = income - spending
  const savingsRate = income > 0 ? clamp(((income - spending) / income) * 100) : 0

  const goals = Array.isArray(state.goals) ? state.goals : []
  const emergencyGoal = goals.find(
    g =>
      (g.name && g.name.toLowerCase().includes('emergency')) ||
      (g.id && g.id.toLowerCase().includes('emergency'))
  ) || goals[1] // fallback to second goal by FINOVA design

  const emergencyReserve = Math.max(0, safeNumber(emergencyGoal?.saved, 0))
  const emergencyTarget = Math.max(1, safeNumber(emergencyGoal?.target, 100000))
  const emergencyProgress = Math.min(100, Math.round((emergencyReserve / emergencyTarget) * 100))

  const monthlyEssential = spending > 0 ? spending : 30000
  const coverageMonthsRaw = emergencyReserve / Math.max(1, monthlyEssential)
  const emergencyCoverageMonths = Number(coverageMonthsRaw.toFixed(1))
  const coverageDaysCount = Math.max(1, Math.round((emergencyReserve / Math.max(1, spending)) * 30))
  const emergencyCoverageDays = `${coverageDaysCount} days`

  let reserveStatus: 'Strong' | 'Healthy' | 'Building' | 'Low' | 'Critical' = 'Building'
  if (emergencyProgress >= 90 || emergencyCoverageMonths >= 6) {
    reserveStatus = 'Strong'
  } else if (emergencyProgress >= 70 || emergencyCoverageMonths >= 3) {
    reserveStatus = 'Healthy'
  } else if (emergencyProgress >= 40 || emergencyCoverageMonths >= 1.5) {
    reserveStatus = 'Building'
  } else if (emergencyProgress >= 15) {
    reserveStatus = 'Low'
  } else {
    reserveStatus = 'Critical'
  }

  return {
    savingsAmount,
    savingsRate,
    emergencyReserve,
    emergencyTarget,
    emergencyProgress,
    emergencyCoverageMonths,
    emergencyCoverageDays,
    reserveStatus,
  }
}

// -------------------------------------------------------------------------
// 6. Monthly Cash Flow & Liquidity Intelligence
// -------------------------------------------------------------------------

export function calculateCashFlowIntelligence(
  state: DemoFinancialState,
  commitmentsIntel: FinancialIntelligence['commitments']
): {
  liquidity: FinancialIntelligence['liquidity']
  cashFlow: FinancialIntelligence['cashFlow']
} {
  const balance = Math.max(0, safeNumber(state.balance))
  const income = Math.max(0, safeNumber(state.income))
  const spending = Math.max(0, safeNumber(state.monthlySpending))
  const safeToSpendVal = calculateSafeToSpend(state)

  const committedAmount = commitmentsIntel.totalActiveCommitments
  const availableAfterCommitments = commitmentsIntel.availableAfterCommitments
  const monthlySurplus = income - spending
  const monthlyDeficit = Math.max(0, spending - income)
  const isDeficit = spending > income

  const savingsRate = income > 0 ? clamp(((income - spending) / income) * 100) : 0
  const spendingVelocity = income > 0 ? (spending / income) * 100 : 0
  const runwayDays = Math.max(1, Math.floor(availableAfterCommitments / Math.max(1, spending / 30)))

  let cashFlowPressure: 'LOW' | 'BALANCED' | 'ELEVATED' | 'HIGH' | 'CRITICAL' = 'BALANCED'
  if (isDeficit) {
    cashFlowPressure = 'CRITICAL'
  } else if (spendingVelocity > 85 || commitmentsIntel.commitmentPressure === 'HIGH') {
    cashFlowPressure = 'HIGH'
  } else if (spendingVelocity > 65 || commitmentsIntel.commitmentPressure === 'MODERATE') {
    cashFlowPressure = 'ELEVATED'
  } else if (spendingVelocity < 45 && savingsRate >= 40) {
    cashFlowPressure = 'LOW'
  }

  const cashFlowStatus: 'SURPLUS' | 'BREAK-EVEN' | 'DEFICIT' = isDeficit
    ? 'DEFICIT'
    : monthlySurplus === 0
    ? 'BREAK-EVEN'
    : 'SURPLUS'

  return {
    liquidity: {
      balance,
      safeToSpend: safeToSpendVal,
      committedAmount,
      availableAfterCommitments,
      monthlyIncome: income,
      monthlySpending: spending,
      monthlySurplus,
      monthlyDeficit,
      isDeficit,
    },
    cashFlow: {
      monthlyIncome: income,
      monthlySpending: spending,
      monthlySurplus,
      savingsRate,
      spendingVelocity: Math.round(spendingVelocity),
      runwayDays,
      cashFlowPressure,
      cashFlowStatus,
    },
  }
}

// -------------------------------------------------------------------------
// 7. Financial Health Engine
// -------------------------------------------------------------------------

export function calculateHealthIntelligence(
  state: DemoFinancialState,
  commitmentsIntel: FinancialIntelligence['commitments'],
  goalsIntel: FinancialIntelligence['goals'],
  savingsIntel: FinancialIntelligence['savings'],
  budgetsIntel: FinancialIntelligence['budgets']
): FinancialIntelligence['health'] {
  const income = Math.max(1, safeNumber(state.income, 1))
  const expenses = Math.max(0, safeNumber(state.monthlySpending, 0))

  const savingsRate = clamp(((income - expenses) / income) * 100)
  const spendingControl = clamp(100 - (expenses / income) * 100)

  const goalProgress = goalsIntel.aggregateProgress
  const commitmentCoverage = clamp(
    (income / (income + commitmentsIntel.totalActiveCommitments)) * 100
  )
  const reserve = savingsIntel.emergencyProgress

  const incomeRecords = Array.isArray(state.incomeRecords) ? state.incomeRecords : []
  const receivedCount = incomeRecords.filter(item => item.status === 'RECEIVED').length
  const incomeStability = Math.round(
    (receivedCount / Math.max(1, incomeRecords.length)) * 100
  )

  const factors: HealthFactor[] = [
    {
      name: 'Cash-flow stability',
      score: Math.round((savingsRate + commitmentCoverage) / 2),
      note: 'Savings capacity and commitment coverage are combined into a cash-flow stability signal.',
    },
    {
      name: 'Savings consistency',
      score: Math.round(savingsRate),
      note: `The model retains ${formatINR(Math.max(0, income - expenses))} after monthly spending.`,
    },
    {
      name: 'Spending control',
      score: Math.round(spendingControl),
      note: 'This reflects monthly spending as a share of regular income.',
    },
    {
      name: 'Goal progress',
      score: goalProgress,
      note: 'Average progress across active goals.',
    },
    {
      name: 'Commitment coverage',
      score: Math.round(commitmentCoverage),
      note: 'Expected income is compared with upcoming committed obligations.',
    },
    {
      name: 'Emergency reserve',
      score: reserve,
      note: 'Reserve progress derived from the emergency fund goal target.',
    },
    {
      name: 'Income stability',
      score: incomeStability,
      note: 'Received income records are compared with all scheduled income streams.',
    },
  ]

  const score = Math.round(
    factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length
  )

  const level: HealthLevel =
    score >= 90
      ? 'EXCELLENT'
      : score >= 75
      ? 'HEALTHY'
      : score >= 60
      ? 'STABLE'
      : score >= 45
      ? 'WATCH'
      : 'AT RISK'

  const radar = factors.slice(0, 6).map(factor => ({
    name: factor.name.replace(' stability', '').replace(' consistency', ''),
    score: factor.score,
  }))

  const primaryGoal = goalsIntel.items[0]
  const primaryGoalName = primaryGoal ? primaryGoal.name : 'Primary Goal'
  const primaryGoalProgress = primaryGoal ? primaryGoal.progress : 0

  const signals = [
    {
      title: `${commitmentsIntel.items.length} upcoming commitments`,
      reason: `${formatINR(commitmentsIntel.totalActiveCommitments)} is already reserved in the cash-flow view.`,
      impact: 'Cash flow',
      route: 'Cash Flow',
    },
    {
      title: savingsRate < 50 ? 'Spending pace needs a look' : 'Spending pace is contained',
      reason: `Monthly spending is ${formatINR(expenses)} against income of ${formatINR(income)}.`,
      impact: savingsRate < 50 ? 'Attention' : 'Positive',
      route: 'Money',
    },
    {
      title: `Your ${primaryGoalName} remains visible`,
      reason: `${primaryGoalProgress}% of the goal is funded.`,
      impact: 'Goal direction',
      route: 'Goals',
    },
  ]

  const priorities: { title: string; reason: string; level: 'HIGH' | 'MEDIUM' | 'LOW' }[] = [
    {
      title: 'Protect upcoming commitment',
      reason: 'Keep committed money separate from available liquidity.',
      level: commitmentsIntel.items.length > 3 ? 'HIGH' : 'MEDIUM',
    },
    {
      title: 'Strengthen emergency reserve',
      reason: `${reserve}% of the target reserve is funded.`,
      level: reserve < 70 ? 'HIGH' : 'MEDIUM',
    },
    {
      title: 'Maintain goal contribution',
      reason: `Preserve the current path for your ${primaryGoalName}.`,
      level: 'LOW',
    },
  ]

  const dna = [
    { name: 'Saving consistency', score: Math.round(savingsRate), trend: savingsRate > 50 ? 'STEADY' : 'WATCH' },
    { name: 'Spending discipline', score: Math.round(spendingControl), trend: spendingControl > 60 ? 'STRONG' : 'BUILDING' },
    { name: 'Recurring commitment load', score: Math.round(commitmentCoverage), trend: 'VISIBLE' },
    { name: 'Goal commitment', score: goalProgress, trend: 'ACTIVE' },
    { name: 'Income stability', score: incomeStability, trend: incomeStability > 50 ? 'STEADY' : 'VARIABLE' },
  ]

  const stability = [
    {
      name: 'Income stability',
      trend: incomeStability > 60 ? '↑ Improving' : '→ Stable',
      note: 'Based on received income records.',
    },
    {
      name: 'Expense stability',
      trend: budgetsIntel.overBudgetCount === 0 ? '→ Stable' : '↓ Pressure',
      note: 'Historical cash-flow series is active.',
    },
    {
      name: 'Cash-flow stability',
      trend: savingsRate > 50 ? '↑ Improving' : '→ Stable',
      note: 'Savings capacity remains visible.',
    },
    {
      name: 'Goal stability',
      trend: goalProgress > 55 ? '↑ Improving' : '→ Stable',
      note: 'Active goals remain funded.',
    },
  ]

  const positives: string[] = []
  if (savingsRate > 50) {
    positives.push('Savings capacity remains above half of regular monthly income.')
  } else {
    positives.push('A clear savings opportunity is visible in the current state.')
  }
  positives.push(`${primaryGoalName} is ${primaryGoalProgress}% funded.`)
  positives.push(`${Math.round(commitmentCoverage)}% commitment coverage is visible in the model.`)
  if (budgetsIntel.overBudgetCount === 0) {
    positives.push('All active budget categories are within prescribed limits.')
  }

  const warnings: string[] = []
  if (expenses > income) {
    warnings.push('Monthly spending currently exceeds incoming monthly revenue.')
  }
  if (budgetsIntel.overBudgetCount > 0) {
    warnings.push(`${budgetsIntel.overBudgetCount} budget categories have exceeded their limit.`)
  }
  if (reserve < 50) {
    warnings.push('Emergency reserve is below 50% of the recommended buffer.')
  }
  if (commitmentsIntel.commitmentPressure === 'HIGH') {
    warnings.push('High recurring commitments are constraining liquid flexibility.')
  }

  const nextAction =
    reserve < 70
      ? 'Strengthen your emergency reserve before adding new pressure.'
      : expenses / income > 0.5
      ? 'Review discretionary spending before the next commitment.'
      : 'Keep your current plan and review the next commitment.'

  const nextReason =
    reserve < 70
      ? `The reserve is at ${reserve}%, making it the highest-priority improvement.`
      : 'Your current signals are balanced enough to keep the plan visible.'

  const nextRoute = reserve < 70 ? 'Goals' : 'Cash Flow'

  const briefing = {
    state:
      savingsRate > 50
        ? 'Your cash flow is currently stable and well-balanced.'
        : 'Your cash flow needs closer attention due to spending pace.',
    matters: `${formatINR(
      commitmentsIntel.totalActiveCommitments
    )} is already committed, so true availability is lower than account balance.`,
    next:
      reserve < 70
        ? 'Strengthen the emergency reserve before adding new commitments.'
        : `Maintaining your current spending pace keeps ${primaryGoalName} visible.`,
  }

  return {
    score,
    level,
    summary: `FINANCIAL STATE · ${level}`,
    factors,
    radar,
    signals,
    priorities,
    dna,
    stability,
    positives,
    reserve,
    coverage: savingsIntel.emergencyCoverageDays,
    briefing,
    nextAction,
    nextReason,
    nextRoute,
    warnings,
  }
}

// -------------------------------------------------------------------------
// 8. Deterministic Financial Signals
// -------------------------------------------------------------------------

export function deriveFinancialSignals(
  liquidity: FinancialIntelligence['liquidity'],
  cashFlow: FinancialIntelligence['cashFlow'],
  savings: FinancialIntelligence['savings'],
  budgets: FinancialIntelligence['budgets'],
  goals: FinancialIntelligence['goals'],
  commitments: FinancialIntelligence['commitments']
): FinancialIntelligence['signals'] {
  const list: FinancialSignal[] = []

  // Critical Signals
  if (liquidity.isDeficit) {
    list.push({
      id: 'sig-deficit',
      type: 'CRITICAL',
      title: 'Monthly Cash Flow Deficit',
      explanation: `Expenses exceed income by ${formatINR(liquidity.monthlyDeficit)} per month.`,
      severity: 'critical',
      route: 'Cash Flow',
    })
  }

  if (liquidity.safeToSpend <= 2000) {
    list.push({
      id: 'sig-low-safe-to-spend',
      type: 'CRITICAL',
      title: 'Safe-to-Spend Depleted',
      explanation: `Only ${formatINR(liquidity.safeToSpend)} remains uncommitted and safe to spend.`,
      severity: 'critical',
      route: 'Cash Flow',
    })
  }

  if (budgets.overBudgetCount > 0) {
    list.push({
      id: 'sig-budget-over',
      type: 'WARNING',
      title: `${budgets.overBudgetCount} Category Over Budget`,
      explanation: `${budgets.overBudgetCategories.join(', ')} exceeded allocated limits.`,
      severity: 'high',
      category: budgets.overBudgetCategories[0],
      route: 'Money',
    })
  }

  // Warning Signals
  if (budgets.nearLimitCount > 0) {
    list.push({
      id: 'sig-budget-near',
      type: 'WARNING',
      title: `${budgets.nearLimitCount} Budget Approaching Limit`,
      explanation: `${budgets.nearLimitCategories.join(', ')} reached > 75% of budget.`,
      severity: 'medium',
      category: budgets.nearLimitCategories[0],
      route: 'Money',
    })
  }

  if (commitments.commitmentPressure === 'HIGH') {
    list.push({
      id: 'sig-commitments-high',
      type: 'WARNING',
      title: 'Elevated Commitment Load',
      explanation: `${commitments.commitmentToIncomeRatio}% of monthly income is tied to recurring obligations.`,
      severity: 'high',
      route: 'Cash Flow',
    })
  }

  if (savings.reserveStatus === 'Critical' || savings.reserveStatus === 'Low') {
    list.push({
      id: 'sig-reserve-low',
      type: 'WARNING',
      title: 'Emergency Reserve Below Target',
      explanation: `Reserve covers ${savings.emergencyCoverageDays} of normal living expenses.`,
      severity: 'medium',
      route: 'Goals',
    })
  }

  if (goals.atRiskCount > 0) {
    const atRisk = goals.items.find(g => g.status === 'At Risk')
    list.push({
      id: 'sig-goal-at-risk',
      type: 'WARNING',
      title: `Goal "${atRisk?.name}" At Risk`,
      explanation: atRisk?.statusNote || 'Requires monthly savings adjustment.',
      severity: 'medium',
      relatedGoalId: atRisk?.id,
      route: 'Goals',
    })
  }

  // Positive Signals
  if (cashFlow.savingsRate >= 45) {
    list.push({
      id: 'sig-savings-strong',
      type: 'POSITIVE',
      title: 'Strong Savings Rate',
      explanation: `You are saving ${cashFlow.savingsRate}% of incoming monthly income.`,
      severity: 'low',
      route: 'Cash Flow',
    })
  }

  if (goals.completedCount > 0) {
    list.push({
      id: 'sig-goal-completed',
      type: 'POSITIVE',
      title: 'Goal Achieved',
      explanation: `${goals.completedCount} goal target fully funded and secured.`,
      severity: 'low',
      route: 'Goals',
    })
  }

  if (budgets.overBudgetCount === 0 && budgets.categories.length > 0) {
    list.push({
      id: 'sig-budget-disciplined',
      type: 'POSITIVE',
      title: 'Spending Under Budget Control',
      explanation: 'All tracked budget categories are operating within plan.',
      severity: 'low',
      route: 'Money',
    })
  }

  return {
    list,
    positiveCount: list.filter(s => s.type === 'POSITIVE').length,
    warningCount: list.filter(s => s.type === 'WARNING').length,
    criticalCount: list.filter(s => s.type === 'CRITICAL').length,
  }
}

// -------------------------------------------------------------------------
// 9. Unified Financial Intelligence Engine: Master Calculation Function
// -------------------------------------------------------------------------

export function calculateFinancialIntelligence(state: DemoFinancialState): FinancialIntelligence {
  const commitments = calculateCommitmentIntelligence(state)
  const budgets = calculateBudgetIntelligence(state.budgets, state.transactions)
  const goals = calculateGoalIntelligence(state.goals)
  const savings = calculateEmergencyReserveIntelligence(state)
  const { liquidity, cashFlow } = calculateCashFlowIntelligence(state, commitments)
  const health = calculateHealthIntelligence(state, commitments, goals, savings, budgets)
  const signals = deriveFinancialSignals(liquidity, cashFlow, savings, budgets, goals, commitments)

  return {
    liquidity,
    cashFlow,
    savings,
    budgets,
    goals,
    commitments,
    health,
    signals,
  }
}
