import type { DemoFinancialState } from '../data/demoFinancialState'
import { formatINR } from '../data/demoFinancialState'
import {
  calculateFinancialIntelligence,
  type FinancialIntelligence,
  type BudgetMetric,
  type GoalMetric,
} from './FinancialIntelligence'
import {
  deriveAllDecisions,
  type FinancialDecision,
} from './FinancialDecisionEngine'

// ==========================================
// 1. SCENARIO TYPES & INTERFACES
// ==========================================

export type SimulationScenarioType =
  | 'PURCHASE'
  | 'INCOME_CHANGE'
  | 'EXPENSE_CHANGE'
  | 'COMMITMENT_CHANGE'
  | 'GOAL_CONTRIBUTION'
  | 'GOAL_WITHDRAWAL'
  | 'BUDGET_CHANGE'
  | 'CUSTOM_EXPENSE'

export interface BaseScenario {
  type: SimulationScenarioType
  label?: string
  description?: string
}

export interface PurchaseScenario extends BaseScenario {
  type: 'PURCHASE'
  amount: number
  category?: string
  name?: string
  installment?: number
  priority?: 'High' | 'Medium' | 'Low'
  date?: string
}

export interface IncomeChangeScenario extends BaseScenario {
  type: 'INCOME_CHANGE'
  amount: number // Positive or negative delta, or new total if changeType is 'SET'
  source?: string
  changeType?: 'DELTA' | 'SET' | 'PERCENT'
  isRecurring?: boolean
}

export interface ExpenseChangeScenario extends BaseScenario {
  type: 'EXPENSE_CHANGE'
  amount: number
  category?: string
  changeType?: 'DELTA' | 'SET' | 'PERCENT'
}

export interface CommitmentChangeScenario extends BaseScenario {
  type: 'COMMITMENT_CHANGE'
  action: 'ADD' | 'REMOVE' | 'UPDATE'
  id?: string
  name?: string
  amount: number
  commitmentType?: string
  date?: string
}

export interface GoalContributionScenario extends BaseScenario {
  type: 'GOAL_CONTRIBUTION'
  goalId?: string
  amount: number
}

export interface GoalWithdrawalScenario extends BaseScenario {
  type: 'GOAL_WITHDRAWAL'
  goalId?: string
  amount: number
}

export interface BudgetChangeScenario extends BaseScenario {
  type: 'BUDGET_CHANGE'
  category: string
  newLimit: number
}

export interface CustomExpenseScenario extends BaseScenario {
  type: 'CUSTOM_EXPENSE'
  name?: string
  amount: number
  category?: string
  isRecurring?: boolean
}

export type FinancialScenario =
  | PurchaseScenario
  | IncomeChangeScenario
  | ExpenseChangeScenario
  | CommitmentChangeScenario
  | GoalContributionScenario
  | GoalWithdrawalScenario
  | BudgetChangeScenario
  | CustomExpenseScenario

// ==========================================
// 2. COMPARISON & IMPACT TYPES
// ==========================================

export type ImpactLevel = 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE'

export interface MetricComparison {
  current: number
  projected: number
  delta: number
  percentChange: number
  formattedCurrent: string
  formattedProjected: string
  formattedDelta: string
  direction: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
}

export interface GoalSimulationImpact {
  id: string
  name: string
  currentSaved: number
  projectedSaved: number
  currentTarget: number
  currentProgress: number
  projectedProgress: number
  currentTimelineMonths: number
  projectedTimelineMonths: number
  delayDays: number
  delayMonths: number
  status: 'Completed' | 'Ahead' | 'On Track' | 'Delayed' | 'At Risk'
  explanation: string
}

export interface BudgetSimulationImpact {
  category: string
  budget: number
  currentActual: number
  projectedActual: number
  currentRemaining: number
  projectedRemaining: number
  currentUtilization: number
  projectedUtilization: number
  isOverBudget: boolean
  isNearLimit: boolean
  overageAmount: number
}

export interface CommitmentSimulationImpact {
  currentBurden: number
  projectedBurden: number
  currentRatio: number
  projectedRatio: number
  safeImpact: number
  cashPressure: 'LOW' | 'BALANCED' | 'ELEVATED' | 'HIGH' | 'CRITICAL'
}

export interface SimulationResult {
  scenario: FinancialScenario
  impactLevel: ImpactLevel
  impactScore: number // 0 to 100
  statusTag: 'SAFE' | 'CONSIDER' | 'AVOID'
  headline: string
  summary: string
  explanation: string
  recommendations: string[]
  isAffordable: boolean

  comparisons: {
    balance: MetricComparison
    safeToSpend: MetricComparison
    monthlyIncome: MetricComparison
    monthlySpending: MetricComparison
    monthlySurplus: MetricComparison
    savingsRate: MetricComparison
    financialHealth: MetricComparison
    emergencyCoverageMonths: MetricComparison
  }

  goals: GoalSimulationImpact[]
  budgets: BudgetSimulationImpact[]
  commitments: CommitmentSimulationImpact

  simulatedState: DemoFinancialState
  simulatedIntelligence: FinancialIntelligence
  simulatedDecisions: FinancialDecision[]
}

// ==========================================
// 3. HELPER FUNCTIONS FOR COMPARISONS
// ==========================================

function createMetricComparison(
  current: number,
  projected: number,
  isHigherBetter: boolean = true,
  isCurrency: boolean = true
): MetricComparison {
  const c = Math.max(0, current)
  const p = Math.max(0, projected)
  const delta = p - c
  const percentChange = c > 0 ? Math.round((delta / c) * 100) : delta !== 0 ? 100 : 0

  let direction: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL'
  if (delta > 0.01) {
    direction = isHigherBetter ? 'POSITIVE' : 'NEGATIVE'
  } else if (delta < -0.01) {
    direction = isHigherBetter ? 'NEGATIVE' : 'POSITIVE'
  }

  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  const absDelta = Math.abs(delta)

  return {
    current: c,
    projected: p,
    delta,
    percentChange,
    formattedCurrent: isCurrency ? formatINR(c) : `${c}`,
    formattedProjected: isCurrency ? formatINR(p) : `${p}`,
    formattedDelta: isCurrency
      ? `${sign} ${formatINR(absDelta)}`
      : `${sign} ${absDelta}`,
    direction,
  }
}

function cloneFinancialState(state: DemoFinancialState): DemoFinancialState {
  return {
    balance: Number(state.balance) || 0,
    income: Number(state.income) || 0,
    monthlySpending: Number(state.monthlySpending) || 0,
    safeToSpend: Number(state.safeToSpend) || 0,
    financialHealth: Number(state.financialHealth) || 0,
    goals: Array.isArray(state.goals) ? state.goals.map(g => ({ ...g })) : [],
    upcoming: Array.isArray(state.upcoming) ? state.upcoming.map(u => ({ ...u })) : [],
    transactions: Array.isArray(state.transactions) ? state.transactions.map(t => ({ ...t })) : [],
    cashFlow: state.cashFlow
      ? Object.fromEntries(
          Object.entries(state.cashFlow).map(([k, v]) => [k, Array.isArray(v) ? v.map(e => ({ ...e })) : []])
        )
      : {},
    incomeRecords: Array.isArray(state.incomeRecords) ? state.incomeRecords.map(r => ({ ...r })) : [],
    commitments: Array.isArray(state.commitments) ? state.commitments.map(c => ({ ...c })) : [],
    budgets: state.budgets ? { ...state.budgets } : {},
  }
}

// ==========================================
// 4. IMMUTABLE STATE APPLICATION
// ==========================================

/**
 * Pure function to apply a financial scenario to a cloned financial state.
 * Never mutates original state or causes side effects.
 */
export function applyScenarioToState(
  state: DemoFinancialState,
  scenario: FinancialScenario
): DemoFinancialState {
  const projected = cloneFinancialState(state)

  switch (scenario.type) {
    case 'PURCHASE': {
      const price = Math.max(0, Number(scenario.amount) || 0)
      const installment = Math.max(0, Number(scenario.installment) || 0)
      const category = scenario.category || 'Shopping'
      const name = scenario.name || 'Simulated Purchase'

      if (installment > 0) {
        // EMI / Installment purchase: balance pays first installment, commitments/spending increase
        projected.balance = Math.max(0, projected.balance - installment)
        projected.monthlySpending = projected.monthlySpending + installment
        projected.commitments.push({
          id: `sim-commit-${Date.now()}`,
          name: `${name} (EMI)`,
          amount: installment,
          date: scenario.date || '2026-09-15',
          type: 'Installment / EMI',
        })
      } else {
        // Direct one-time purchase: balance reduces, monthly spending increases for the current month
        projected.balance = Math.max(0, projected.balance - price)
        projected.monthlySpending = projected.monthlySpending + price
        // Record temporary simulated transaction for budget calculations
        projected.transactions.unshift({
          id: `sim-tx-${Date.now()}`,
          name,
          category,
          amount: price,
          date: scenario.date || '2026-08-28',
        })
      }
      break
    }

    case 'INCOME_CHANGE': {
      const val = Number(scenario.amount) || 0
      const changeType = scenario.changeType || 'DELTA'

      if (changeType === 'PERCENT') {
        const factor = 1 + val / 100
        projected.income = Math.max(0, Math.round(projected.income * factor))
      } else if (changeType === 'SET') {
        projected.income = Math.max(0, val)
      } else {
        // Delta
        projected.income = Math.max(0, projected.income + val)
        if (val > 0) {
          projected.balance = projected.balance + val
        }
      }

      if (scenario.isRecurring && scenario.source) {
        projected.incomeRecords.push({
          id: `sim-income-${Date.now()}`,
          source: scenario.source,
          amount: Math.abs(val),
          expectedDate: '2026-09-01',
          frequency: 'Monthly',
          status: 'EXPECTED',
        })
      }
      break
    }

    case 'EXPENSE_CHANGE': {
      const val = Number(scenario.amount) || 0
      const changeType = scenario.changeType || 'DELTA'

      if (changeType === 'PERCENT') {
        const factor = 1 + val / 100
        projected.monthlySpending = Math.max(0, Math.round(projected.monthlySpending * factor))
      } else if (changeType === 'SET') {
        projected.monthlySpending = Math.max(0, val)
      } else {
        projected.monthlySpending = Math.max(0, projected.monthlySpending + val)
      }
      break
    }

    case 'COMMITMENT_CHANGE': {
      const amount = Math.max(0, Number(scenario.amount) || 0)
      if (scenario.action === 'ADD') {
        projected.commitments.push({
          id: scenario.id || `sim-commit-${Date.now()}`,
          name: scenario.name || 'New Commitment',
          amount,
          date: scenario.date || '2026-09-01',
          type: scenario.commitmentType || 'Recurring payment',
        })
        projected.monthlySpending = projected.monthlySpending + amount
      } else if (scenario.action === 'REMOVE') {
        if (scenario.id) {
          projected.commitments = projected.commitments.filter(c => c.id !== scenario.id)
        } else if (scenario.name) {
          projected.commitments = projected.commitments.filter(c => c.name !== scenario.name)
        }
        projected.monthlySpending = Math.max(0, projected.monthlySpending - amount)
      } else if (scenario.action === 'UPDATE' && scenario.id) {
        projected.commitments = projected.commitments.map(c =>
          c.id === scenario.id ? { ...c, amount } : c
        )
      }
      break
    }

    case 'GOAL_CONTRIBUTION': {
      const amount = Math.max(0, Number(scenario.amount) || 0)
      projected.balance = Math.max(0, projected.balance - amount)

      if (projected.goals.length > 0) {
        let targetGoal = projected.goals.find(g => g.id === scenario.goalId)
        if (!targetGoal) {
          // Default to first active goal
          targetGoal = projected.goals[0]
        }
        if (targetGoal) {
          targetGoal.saved = targetGoal.saved + amount
        }
      }
      break
    }

    case 'GOAL_WITHDRAWAL': {
      const amount = Math.max(0, Number(scenario.amount) || 0)
      if (projected.goals.length > 0) {
        let targetGoal = projected.goals.find(g => g.id === scenario.goalId)
        if (!targetGoal) {
          targetGoal = projected.goals[0]
        }
        if (targetGoal) {
          const actualWithdraw = Math.min(targetGoal.saved, amount)
          targetGoal.saved = Math.max(0, targetGoal.saved - actualWithdraw)
          projected.balance = projected.balance + actualWithdraw
        }
      }
      break
    }

    case 'BUDGET_CHANGE': {
      const limit = Math.max(0, Number(scenario.newLimit) || 0)
      if (scenario.category) {
        projected.budgets[scenario.category] = limit
      }
      break
    }

    case 'CUSTOM_EXPENSE': {
      const amount = Math.max(0, Number(scenario.amount) || 0)
      projected.balance = Math.max(0, projected.balance - amount)
      projected.monthlySpending = projected.monthlySpending + amount
      if (scenario.isRecurring) {
        projected.commitments.push({
          id: `sim-commit-${Date.now()}`,
          name: scenario.name || 'Recurring Expense',
          amount,
          date: '2026-09-01',
          type: 'Recurring payment',
        })
      }
      break
    }
  }

  return projected
}

// ==========================================
// 5. IMPACT CLASSIFICATION & DETAILS
// ==========================================

export function classifyImpact(
  currentIntel: FinancialIntelligence,
  projectedIntel: FinancialIntelligence,
  scenario: FinancialScenario
): {
  level: ImpactLevel
  score: number
  statusTag: 'SAFE' | 'CONSIDER' | 'AVOID'
  headline: string
  summary: string
  explanation: string
  recommendations: string[]
  isAffordable: boolean
} {
  const currentSafe = currentIntel.liquidity.safeToSpend
  const projectedSafe = projectedIntel.liquidity.safeToSpend
  const safeDelta = currentSafe - projectedSafe

  const currentSurplus = currentIntel.cashFlow.monthlySurplus
  const projectedSurplus = projectedIntel.cashFlow.monthlySurplus

  const currentHealth = currentIntel.health.score
  const projectedHealth = projectedIntel.health.score
  const healthDelta = currentHealth - projectedHealth

  const currentReserve = currentIntel.savings.emergencyCoverageMonths
  const projectedReserve = projectedIntel.savings.emergencyCoverageMonths

  let impactScore = 0 // 0 (none) to 100 (extreme)
  const recommendations: string[] = []

  // Check 1: Safe to spend impact
  if (currentSafe > 0) {
    const safeReductionPercent = (safeDelta / currentSafe) * 100
    if (safeReductionPercent > 80) impactScore += 35
    else if (safeReductionPercent > 50) impactScore += 25
    else if (safeReductionPercent > 20) impactScore += 15
    else if (safeReductionPercent > 5) impactScore += 5
  } else if (projectedSafe <= 0) {
    impactScore += 30
  }

  // Check 2: Cash flow deficit introduction
  if (projectedIntel.liquidity.isDeficit) {
    impactScore += 40
    recommendations.push('Scenario introduces a monthly cash deficit. Prioritize reducing discretionary commitments.')
  } else if (projectedSurplus < currentSurplus * 0.5 && currentSurplus > 0) {
    impactScore += 20
    recommendations.push('Monthly surplus is reduced by more than 50%.')
  }

  // Check 3: Health score drop
  if (healthDelta >= 15) {
    impactScore += 25
  } else if (healthDelta >= 8) {
    impactScore += 15
  } else if (healthDelta >= 3) {
    impactScore += 8
  }

  // Check 4: Emergency Reserve erosion
  if (projectedReserve < 1.0 && currentReserve >= 1.0) {
    impactScore += 25
    recommendations.push('Emergency buffer drops below 1 month of coverage.')
  } else if (projectedReserve < 2.0 && currentReserve >= 3.0) {
    impactScore += 15
  }

  // Check 5: Budget overages
  if (projectedIntel.budgets.overBudgetCount > currentIntel.budgets.overBudgetCount) {
    impactScore += 15
    recommendations.push('Simulated spending pushes at least one category over its assigned budget.')
  }

  // Bound impact score
  impactScore = Math.min(100, Math.max(0, Math.round(impactScore)))

  let level: ImpactLevel = 'MINIMAL'
  let statusTag: 'SAFE' | 'CONSIDER' | 'AVOID' = 'SAFE'
  let isAffordable = true

  if (impactScore >= 70 || projectedIntel.liquidity.isDeficit || projectedSafe < 0) {
    level = 'SEVERE'
    statusTag = 'AVOID'
    isAffordable = false
  } else if (impactScore >= 45) {
    level = 'HIGH'
    statusTag = 'AVOID'
    isAffordable = false
  } else if (impactScore >= 25) {
    level = 'MODERATE'
    statusTag = 'CONSIDER'
    isAffordable = true
  } else if (impactScore >= 10) {
    level = 'LOW'
    statusTag = 'SAFE'
    isAffordable = true
  } else {
    level = 'MINIMAL'
    statusTag = 'SAFE'
    isAffordable = true
  }

  // Default recommendations if none triggered
  if (recommendations.length === 0) {
    if (statusTag === 'SAFE') {
      recommendations.push('Action is comfortably within safe-to-spend limits and preserves current goal timelines.')
    } else if (statusTag === 'CONSIDER') {
      recommendations.push('Monitor variable spending over the next 2 weeks to maintain liquidity cushion.')
    }
  }

  let headline = ''
  let summary = ''
  let explanation = ''

  switch (scenario.type) {
    case 'PURCHASE': {
      const amt = (scenario as PurchaseScenario).amount || 0
      headline = statusTag === 'SAFE' ? 'Purchase is within safe capacity' : statusTag === 'CONSIDER' ? 'Purchase tightens available margin' : 'Purchase creates significant financial pressure'
      summary = `Simulating a purchase of ${formatINR(amt)} leaves ${formatINR(projectedSafe)} safe-to-spend.`
      explanation = `Projected balance becomes ${formatINR(projectedIntel.liquidity.balance)}. Monthly surplus is ${formatINR(projectedSurplus)}.`
      break
    }
    case 'INCOME_CHANGE': {
      const amt = (scenario as IncomeChangeScenario).amount || 0
      headline = amt >= 0 ? 'Projected income expansion' : 'Projected income reduction'
      summary = `Monthly income moves to ${formatINR(projectedIntel.cashFlow.monthlyIncome)}.`
      explanation = `Adjusted monthly surplus is ${formatINR(projectedSurplus)} with a savings rate of ${projectedIntel.cashFlow.savingsRate}%.`
      break
    }
    case 'GOAL_CONTRIBUTION': {
      const amt = (scenario as GoalContributionScenario).amount || 0
      headline = 'Accelerating goal completion'
      summary = `Contributing ${formatINR(amt)} to goal reserves.`
      explanation = `Remaining safe-to-spend is ${formatINR(projectedSafe)}. Goal progress accelerates accordingly.`
      break
    }
    default: {
      headline = `Simulated ${scenario.type.replace('_', ' ').toLowerCase()}`
      summary = `Projected safe-to-spend becomes ${formatINR(projectedSafe)}.`
      explanation = `Financial health score adjusts by ${healthDelta >= 0 ? `+${healthDelta}` : healthDelta} points.`
      break
    }
  }

  return {
    level,
    score: impactScore,
    statusTag,
    headline,
    summary,
    explanation,
    recommendations,
    isAffordable,
  }
}

// ==========================================
// 6. DETAILED GOAL & BUDGET IMPACTS
// ==========================================

function calculateGoalSimulationImpacts(
  currentGoals: GoalMetric[],
  projectedGoals: GoalMetric[],
  scenario: FinancialScenario
): GoalSimulationImpact[] {
  return currentGoals.map(cg => {
    const pg = projectedGoals.find(g => g.id === cg.id) || cg
    const currentSaved = cg.saved
    const projectedSaved = pg.saved
    const currentTarget = cg.target

    const currentProgress = cg.progress
    const projectedProgress = pg.progress

    const currentTimeline = cg.estimatedMonths
    const projectedTimeline = pg.estimatedMonths

    let delayMonths = Math.max(0, projectedTimeline - currentTimeline)
    let delayDays = Math.round(delayMonths * 30)

    // For direct purchase scenarios where safeToSpend drops significantly, calculate estimated delay
    if (scenario.type === 'PURCHASE' && scenario.amount > 0) {
      const price = scenario.amount
      if (cg.monthlyContribution > 0) {
        const potentialDelayDays = Math.min(60, Math.round((price / Math.max(1, cg.monthlyContribution * 3)) * 14))
        if (potentialDelayDays > delayDays) {
          delayDays = potentialDelayDays
          delayMonths = Math.round((delayDays / 30) * 10) / 10
        }
      }
    }

    let status: GoalSimulationImpact['status'] = 'On Track'
    if (pg.isCompleted) status = 'Completed'
    else if (projectedProgress > currentProgress) status = 'Ahead'
    else if (delayDays > 14) status = 'Delayed'
    else if (delayDays > 30) status = 'At Risk'

    let explanation = `Currently ${currentProgress}% complete.`
    if (projectedProgress > currentProgress) {
      explanation = `Progress increases from ${currentProgress}% to ${projectedProgress}%.`
    } else if (delayDays > 0) {
      explanation = `Estimated delay of ~${delayDays} days on projected path.`
    } else {
      explanation = 'Goal timeline remains intact on current trajectory.'
    }

    return {
      id: cg.id,
      name: cg.name,
      currentSaved,
      projectedSaved,
      currentTarget,
      currentProgress,
      projectedProgress,
      currentTimelineMonths: currentTimeline,
      projectedTimelineMonths: projectedTimeline,
      delayDays,
      delayMonths,
      status,
      explanation,
    }
  })
}

function calculateBudgetSimulationImpacts(
  currentBudgets: BudgetMetric[],
  projectedBudgets: BudgetMetric[]
): BudgetSimulationImpact[] {
  return projectedBudgets.map(pb => {
    const cb = currentBudgets.find(b => b.category === pb.category)
    const currentActual = cb ? cb.actual : 0
    const currentRemaining = cb ? cb.remaining : pb.budget
    const currentUtilization = cb ? cb.utilization : 0

    const overageAmount = pb.isOverBudget ? Math.max(0, pb.actual - pb.budget) : 0

    return {
      category: pb.category,
      budget: pb.budget,
      currentActual,
      projectedActual: pb.actual,
      currentRemaining,
      projectedRemaining: pb.remaining,
      currentUtilization,
      projectedUtilization: pb.utilization,
      isOverBudget: pb.isOverBudget,
      isNearLimit: pb.isNearLimit,
      overageAmount,
    }
  })
}

function calculateCommitmentSimulationImpact(
  currentIntel: FinancialIntelligence,
  projectedIntel: FinancialIntelligence
): CommitmentSimulationImpact {
  const currentBurden = currentIntel.liquidity.committedAmount
  const projectedBurden = projectedIntel.liquidity.committedAmount
  const currentIncome = Math.max(1, currentIntel.cashFlow.monthlyIncome)
  const projectedIncome = Math.max(1, projectedIntel.cashFlow.monthlyIncome)

  const currentRatio = Math.round((currentBurden / currentIncome) * 100)
  const projectedRatio = Math.round((projectedBurden / projectedIncome) * 100)

  const safeImpact = currentIntel.liquidity.safeToSpend - projectedIntel.liquidity.safeToSpend

  return {
    currentBurden,
    projectedBurden,
    currentRatio,
    projectedRatio,
    safeImpact,
    cashPressure: projectedIntel.cashFlow.cashFlowPressure,
  }
}

// ==========================================
// 7. MAIN SIMULATION ENGINE ENTRYPOINT
// ==========================================

/**
 * Pure, deterministic financial simulation engine.
 * Accepts real state + scenario and returns full simulated result and comparisons.
 * Does NOT mutate input state or write to storage.
 */
export function simulateFinancialScenario(
  state: DemoFinancialState,
  scenario: FinancialScenario
): SimulationResult {
  // 1. Current intelligence from unaltered state
  const currentIntel = calculateFinancialIntelligence(state)

  // 2. Derive temporary projected state immutably
  const simulatedState = applyScenarioToState(state, scenario)

  // 3. Compute simulated intelligence
  const simulatedIntel = calculateFinancialIntelligence(simulatedState)

  // 4. Compute simulated decisions using existing decision rules
  const simulatedDecisions = deriveAllDecisions(simulatedIntel, simulatedState)

  // 5. Classify impact
  const classification = classifyImpact(currentIntel, simulatedIntel, scenario)

  // 6. Build comparisons
  const comparisons = {
    balance: createMetricComparison(currentIntel.liquidity.balance, simulatedIntel.liquidity.balance, true, true),
    safeToSpend: createMetricComparison(currentIntel.liquidity.safeToSpend, simulatedIntel.liquidity.safeToSpend, true, true),
    monthlyIncome: createMetricComparison(currentIntel.cashFlow.monthlyIncome, simulatedIntel.cashFlow.monthlyIncome, true, true),
    monthlySpending: createMetricComparison(currentIntel.cashFlow.monthlySpending, simulatedIntel.cashFlow.monthlySpending, false, true),
    monthlySurplus: createMetricComparison(currentIntel.cashFlow.monthlySurplus, simulatedIntel.cashFlow.monthlySurplus, true, true),
    savingsRate: createMetricComparison(currentIntel.cashFlow.savingsRate, simulatedIntel.cashFlow.savingsRate, true, false),
    financialHealth: createMetricComparison(currentIntel.health.score, simulatedIntel.health.score, true, false),
    emergencyCoverageMonths: createMetricComparison(currentIntel.savings.emergencyCoverageMonths, simulatedIntel.savings.emergencyCoverageMonths, true, false),
  }

  // 7. Goal, budget & commitment impacts
  const goals = calculateGoalSimulationImpacts(currentIntel.goals.items, simulatedIntel.goals.items, scenario)
  const budgets = calculateBudgetSimulationImpacts(currentIntel.budgets.categories, simulatedIntel.budgets.categories)
  const commitments = calculateCommitmentSimulationImpact(currentIntel, simulatedIntel)

  return {
    scenario,
    impactLevel: classification.level,
    impactScore: classification.score,
    statusTag: classification.statusTag,
    headline: classification.headline,
    summary: classification.summary,
    explanation: classification.explanation,
    recommendations: classification.recommendations,
    isAffordable: classification.isAffordable,
    comparisons,
    goals,
    budgets,
    commitments,
    simulatedState,
    simulatedIntelligence: simulatedIntel,
    simulatedDecisions,
  }
}

// Quick simulation helpers
export function simulatePurchase(
  state: DemoFinancialState,
  amount: number,
  category: string = 'Shopping',
  name: string = 'Simulated Purchase'
): SimulationResult {
  return simulateFinancialScenario(state, {
    type: 'PURCHASE',
    amount,
    category,
    name,
  })
}

export function simulateIncomeDelta(
  state: DemoFinancialState,
  delta: number,
  source: string = 'Income Adjustment'
): SimulationResult {
  return simulateFinancialScenario(state, {
    type: 'INCOME_CHANGE',
    amount: delta,
    source,
    changeType: 'DELTA',
  })
}

export function simulateExpenseDelta(
  state: DemoFinancialState,
  delta: number,
  category: string = 'Expenses'
): SimulationResult {
  return simulateFinancialScenario(state, {
    type: 'EXPENSE_CHANGE',
    amount: delta,
    category,
    changeType: 'DELTA',
  })
}

export function simulateGoalContribution(
  state: DemoFinancialState,
  amount: number,
  goalId?: string
): SimulationResult {
  return simulateFinancialScenario(state, {
    type: 'GOAL_CONTRIBUTION',
    amount,
    goalId,
  })
}
