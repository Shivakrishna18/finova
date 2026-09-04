import type { DemoFinancialState } from '../data/demoFinancialState'
import { formatINR } from '../data/demoFinancialState'
import type { FinancialIntelligence, GoalMetric, BudgetMetric } from './FinancialIntelligence'

// =========================================================================
// 1. Strongly-Typed Decision Structures
// =========================================================================

export type DecisionCategory =
  | 'LIQUIDITY'
  | 'CASH_FLOW'
  | 'BUDGETS'
  | 'GOALS'
  | 'COMMITMENTS'
  | 'EMERGENCY_RESERVE'

export type DecisionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type DecisionSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface FinancialDecision {
  id: string
  category: DecisionCategory
  priority: DecisionPriority
  severity: DecisionSeverity
  title: string
  summary: string
  explanation: string
  action: string
  route?: string
  relatedGoalId?: string
  relatedBudgetCategory?: string
  relatedCommitmentId?: string
  metrics?: Record<string, number | string>
  confidence: string
}

export type PurchaseEvaluationStatus =
  | 'RECOMMENDED'
  | 'ACCEPTABLE'
  | 'CAUTION'
  | 'DELAY'
  | 'NOT_RECOMMENDED'

export interface PurchaseEvaluationInput {
  price: number
  category?: string
  installment?: number
  priority?: 'High' | 'Medium' | 'Low' | string
  purchaseDate?: string
  purpose?: string
}

export interface PurchaseDecisionResult {
  status: PurchaseEvaluationStatus
  statusTag: 'SAFE' | 'CONSIDER' | 'AVOID'
  price: number
  safeImpact: number
  remainingSafe: number
  cashImpact: number
  pressurePercent: number
  goalDelayDays: number
  goalImpactText: string
  healthImpactText: string
  explanation: string
  suggestedAction: string
  isAffordable: boolean
  exceedsSafeToSpend: boolean
  exceedsLiquidBalance: boolean
  confidence: string
}

export interface AdvisorResponse {
  answer: string
  topic: string
  suggestedAction?: string
  relatedDecisions: FinancialDecision[]
}

// =========================================================================
// 2. Deterministic Decision Evaluators
// =========================================================================

/**
 * Evaluates liquidity and safe-to-spend condition.
 */
export function evaluateLiquidityDecisions(
  intel: FinancialIntelligence,
  _state?: DemoFinancialState
): FinancialDecision[] {
  const decisions: FinancialDecision[] = []
  const { liquidity, commitments } = intel

  if (liquidity.isDeficit) {
    decisions.push({
      id: 'dec-liq-deficit',
      category: 'LIQUIDITY',
      priority: 'CRITICAL',
      severity: 'critical',
      title: 'Cash Flow Deficit Constraining Liquidity',
      summary: `Monthly spending exceeds regular income by ${formatINR(liquidity.monthlyDeficit)}.`,
      explanation: `Current monthly expenditures of ${formatINR(
        liquidity.monthlySpending
      )} surpass monthly revenue of ${formatINR(
        liquidity.monthlyIncome
      )}, progressively depleting available liquid reserves.`,
      action: 'Review non-essential monthly outflows and delay uncommitted purchases.',
      route: 'Cash Flow',
      metrics: {
        income: liquidity.monthlyIncome,
        spending: liquidity.monthlySpending,
        deficit: liquidity.monthlyDeficit,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  }

  if (liquidity.safeToSpend <= 2500) {
    decisions.push({
      id: 'dec-liq-low-safe',
      category: 'LIQUIDITY',
      priority: 'CRITICAL',
      severity: 'critical',
      title: 'Safe-to-Spend Balance Depleted',
      summary: `Only ${formatINR(liquidity.safeToSpend)} remains uncommitted.`,
      explanation: `Although total account balance is ${formatINR(
        liquidity.balance
      )}, ${formatINR(
        commitments.totalActiveCommitments
      )} is locked for upcoming obligations, leaving minimal discretionary cushion.`,
      action: 'Avoid new discretionary spending until next income deposit.',
      route: 'Money',
      metrics: {
        safeToSpend: liquidity.safeToSpend,
        committed: commitments.totalActiveCommitments,
        balance: liquidity.balance,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  } else if (liquidity.safeToSpend <= 6000) {
    decisions.push({
      id: 'dec-liq-moderate-safe',
      category: 'LIQUIDITY',
      priority: 'HIGH',
      severity: 'high',
      title: 'Discretionary Cushion Narrowing',
      summary: `${formatINR(liquidity.safeToSpend)} safe-to-spend buffer remaining.`,
      explanation: `Active commitments of ${formatINR(
        commitments.totalActiveCommitments
      )} absorb ${commitments.commitmentToIncomeRatio}% of monthly inflow, limiting comfortable uncommitted spending.`,
      action: 'Prioritize upcoming commitments and defer elective single purchases.',
      route: 'Cash Flow',
      metrics: {
        safeToSpend: liquidity.safeToSpend,
        committedRatio: commitments.commitmentToIncomeRatio,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  } else {
    decisions.push({
      id: 'dec-liq-healthy-safe',
      category: 'LIQUIDITY',
      priority: 'LOW',
      severity: 'low',
      title: 'Comfortable Safe-to-Spend Liquidity',
      summary: `${formatINR(liquidity.safeToSpend)} uncommitted buffer available.`,
      explanation: `After isolating ${formatINR(
        commitments.totalActiveCommitments
      )} for scheduled obligations, you retain ${formatINR(
        liquidity.safeToSpend
      )} in liquid discretionary capacity.`,
      action: 'Maintain current spending discipline or allocate surplus to goal acceleration.',
      route: 'Cash Flow',
      metrics: {
        safeToSpend: liquidity.safeToSpend,
        balance: liquidity.balance,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  }

  return decisions
}

/**
 * Evaluates monthly cash flow and spending velocity.
 */
export function evaluateCashFlowDecisions(
  intel: FinancialIntelligence,
  _state?: DemoFinancialState
): FinancialDecision[] {
  const decisions: FinancialDecision[] = []
  const { cashFlow } = intel

  if (cashFlow.cashFlowPressure === 'CRITICAL' || cashFlow.spendingVelocity > 95) {
    decisions.push({
      id: 'dec-cf-critical-velocity',
      category: 'CASH_FLOW',
      priority: 'CRITICAL',
      severity: 'critical',
      title: 'Critical Spending Velocity',
      summary: `Spending velocity is ${cashFlow.spendingVelocity}% of income.`,
      explanation: `You are consuming ${cashFlow.spendingVelocity}% of incoming revenue on recurring and monthly costs, leaving insufficient buffer for unexpected fluctuations.`,
      action: 'Audit recent variable transactions and freeze discretionary subscriptions.',
      route: 'Money',
      metrics: {
        velocity: `${cashFlow.spendingVelocity}%`,
        spending: cashFlow.monthlySpending,
        income: cashFlow.monthlyIncome,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  } else if (cashFlow.spendingVelocity > 70) {
    decisions.push({
      id: 'dec-cf-elevated-velocity',
      category: 'CASH_FLOW',
      priority: 'HIGH',
      severity: 'high',
      title: 'Elevated Monthly Spending Pace',
      summary: `Current monthly spend consumes ${cashFlow.spendingVelocity}% of revenue.`,
      explanation: `Monthly expenditures of ${formatINR(
        cashFlow.monthlySpending
      )} represent ${cashFlow.spendingVelocity}% of your ${formatINR(
        cashFlow.monthlyIncome
      )} monthly income, lowering net savings to ${cashFlow.savingsRate}%.`,
      action: 'Review top expenditure categories to restore comfortable margin.',
      route: 'Money',
      metrics: {
        velocity: `${cashFlow.spendingVelocity}%`,
        savingsRate: `${cashFlow.savingsRate}%`,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  } else if (cashFlow.savingsRate >= 40) {
    decisions.push({
      id: 'dec-cf-strong-surplus',
      category: 'CASH_FLOW',
      priority: 'LOW',
      severity: 'low',
      title: 'Healthy Monthly Cash Surplus',
      summary: `Retaining ${cashFlow.savingsRate}% (${formatINR(
        cashFlow.monthlySurplus
      )}) of monthly revenue.`,
      explanation: `Controlled spending velocity of ${cashFlow.spendingVelocity}% enables consistent monthly capital retention.`,
      action: 'Continue current cash-flow management or direct excess surplus into reserve.',
      route: 'Cash Flow',
      metrics: {
        surplus: cashFlow.monthlySurplus,
        savingsRate: `${cashFlow.savingsRate}%`,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  }

  return decisions
}

/**
 * Evaluates budget category statuses and limit breaches.
 */
export function evaluateBudgetDecisions(
  intel: FinancialIntelligence,
  _state?: DemoFinancialState
): FinancialDecision[] {
  const decisions: FinancialDecision[] = []
  const { budgets } = intel

  budgets.categories.forEach((cat: BudgetMetric) => {
    if (cat.isOverBudget) {
      const overage = cat.actual - cat.budget
      decisions.push({
        id: `dec-budget-over-${cat.category.toLowerCase().replace(/\s+/g, '-')}`,
        category: 'BUDGETS',
        priority: 'HIGH',
        severity: 'high',
        title: `${cat.category} Over Budget by ${formatINR(overage)}`,
        summary: `Spent ${formatINR(cat.actual)} against ${formatINR(cat.budget)} budget (${cat.utilization}%).`,
        explanation: `${cat.category} spending has exceeded its planned threshold by ${formatINR(
          overage
        )}, placing pressure on the aggregate monthly spending ceiling.`,
        action: `Pause discretionary ${cat.category} expenses or adjust budget limits from surplus categories.`,
        route: 'Money',
        relatedBudgetCategory: cat.category,
        metrics: {
          budget: cat.budget,
          actual: cat.actual,
          overage,
          utilization: `${cat.utilization}%`,
        },
        confidence: 'Deterministic (FINOVA Engine)',
      })
    } else if (cat.isNearLimit) {
      decisions.push({
        id: `dec-budget-near-${cat.category.toLowerCase().replace(/\s+/g, '-')}`,
        category: 'BUDGETS',
        priority: 'MEDIUM',
        severity: 'medium',
        title: `${cat.category} Approaching Budget Limit`,
        summary: `${cat.utilization}% of ${cat.category} budget utilized (${formatINR(
          cat.remaining
        )} remaining).`,
        explanation: `${cat.category} has consumed ${cat.utilization}% of its allocation, leaving ${formatINR(
          cat.remaining
        )} for the remainder of the active period.`,
        action: `Monitor subsequent ${cat.category} transactions to avoid exceeding limit.`,
        route: 'Money',
        relatedBudgetCategory: cat.category,
        metrics: {
          budget: cat.budget,
          actual: cat.actual,
          remaining: cat.remaining,
          utilization: `${cat.utilization}%`,
        },
        confidence: 'Deterministic (FINOVA Engine)',
      })
    }
  })

  if (budgets.overBudgetCount === 0 && budgets.categories.length > 0) {
    decisions.push({
      id: 'dec-budget-all-disciplined',
      category: 'BUDGETS',
      priority: 'INFO',
      severity: 'info',
      title: 'Budget Disciplined Across All Categories',
      summary: `All ${budgets.categories.length} tracked budget categories are within plan.`,
      explanation: `Aggregate budget utilization sits at ${budgets.overallUtilization}% (${formatINR(
        budgets.totalActual
      )} of ${formatINR(budgets.totalBudget)} allocated).`,
      action: 'Maintain existing category allocations.',
      route: 'Money',
      metrics: {
        totalBudget: budgets.totalBudget,
        totalActual: budgets.totalActual,
        utilization: `${budgets.overallUtilization}%`,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  }

  return decisions
}

/**
 * Evaluates goal progression, completion status, and contribution pacing.
 */
export function evaluateGoalDecisions(
  intel: FinancialIntelligence,
  _state?: DemoFinancialState
): FinancialDecision[] {
  const decisions: FinancialDecision[] = []
  const { goals } = intel

  goals.items.forEach((goal: GoalMetric) => {
    if (goal.isCompleted) {
      decisions.push({
        id: `dec-goal-completed-${goal.id}`,
        category: 'GOALS',
        priority: 'INFO',
        severity: 'info',
        title: `Goal "${goal.name}" Completed`,
        summary: `Target of ${formatINR(goal.target)} successfully achieved and secured.`,
        explanation: `Goal "${goal.name}" has reached 100% funding (${formatINR(
          goal.saved
        )} / ${formatINR(
          goal.target
        )}). Further monthly contributions are not required.`,
        action: 'Reallocate ongoing monthly contribution to other active goals or emergency reserve.',
        route: 'Goals',
        relatedGoalId: goal.id,
        metrics: {
          target: goal.target,
          saved: goal.saved,
          progress: '100%',
        },
        confidence: 'Deterministic (FINOVA Engine)',
      })
    } else if (goal.status === 'At Risk') {
      const gap = goal.requiredMonthly - goal.monthlyContribution
      decisions.push({
        id: `dec-goal-risk-${goal.id}`,
        category: 'GOALS',
        priority: 'HIGH',
        severity: 'high',
        title: `Goal "${goal.name}" At Risk of Delay`,
        summary: `Monthly savings gap of ${formatINR(gap)} relative to target schedule.`,
        explanation: `At current monthly contribution of ${formatINR(
          goal.monthlyContribution
        )}, reaching the ${formatINR(goal.target)} target requires ${goal.estimatedMonths} months, falling behind target date. Required contribution is ${formatINR(
          goal.requiredMonthly
        )}/month.`,
        action: `Increase monthly contribution by ${formatINR(
          gap
        )} or extend target deadline.`,
        route: 'Goals',
        relatedGoalId: goal.id,
        metrics: {
          target: goal.target,
          saved: goal.saved,
          progress: `${goal.progress}%`,
          currentMonthly: goal.monthlyContribution,
          requiredMonthly: goal.requiredMonthly,
          monthlyGap: gap,
        },
        confidence: 'Deterministic (FINOVA Engine)',
      })
    } else if (goal.status === 'Needs Attention') {
      decisions.push({
        id: `dec-goal-attention-${goal.id}`,
        category: 'GOALS',
        priority: 'MEDIUM',
        severity: 'medium',
        title: `Goal "${goal.name}" Needs Schedule Tuning`,
        summary: `Contributing ${formatINR(
          goal.monthlyContribution
        )}/month vs ${formatINR(goal.requiredMonthly)} required.`,
        explanation: `Progress is currently at ${goal.progress}%. A modest monthly increase of ${formatINR(
          goal.requiredMonthly - goal.monthlyContribution
        )} aligns the completion date with the original plan.`,
        action: 'Review discretionary spending to increase monthly allocation.',
        route: 'Goals',
        relatedGoalId: goal.id,
        metrics: {
          saved: goal.saved,
          target: goal.target,
          progress: `${goal.progress}%`,
        },
        confidence: 'Deterministic (FINOVA Engine)',
      })
    } else if (goal.status === 'Ahead' || goal.status === 'On Track') {
      decisions.push({
        id: `dec-goal-track-${goal.id}`,
        category: 'GOALS',
        priority: 'LOW',
        severity: 'low',
        title: `Goal "${goal.name}" On Track`,
        summary: `${goal.progress}% funded (${formatINR(goal.saved)} of ${formatINR(
          goal.target
        )}).`,
        explanation: `Monthly contribution of ${formatINR(
          goal.monthlyContribution
        )} comfortably covers the required ${formatINR(
          goal.requiredMonthly
        )}/month to meet target.`,
        action: 'Maintain planned monthly contributions.',
        route: 'Goals',
        relatedGoalId: goal.id,
        metrics: {
          saved: goal.saved,
          target: goal.target,
          progress: `${goal.progress}%`,
          estimatedMonths: goal.estimatedMonths,
        },
        confidence: 'Deterministic (FINOVA Engine)',
      })
    }
  })

  return decisions
}

/**
 * Evaluates recurring obligations and commitment pressure.
 */
export function evaluateCommitmentDecisions(
  intel: FinancialIntelligence,
  _state?: DemoFinancialState
): FinancialDecision[] {
  const decisions: FinancialDecision[] = []
  const { commitments, liquidity } = intel

  if (commitments.commitmentPressure === 'HIGH') {
    decisions.push({
      id: 'dec-com-high-load',
      category: 'COMMITMENTS',
      priority: 'HIGH',
      severity: 'high',
      title: 'Elevated Recurring Commitment Load',
      summary: `${commitments.commitmentToIncomeRatio}% of regular revenue tied to fixed commitments.`,
      explanation: `Active commitments sum to ${formatINR(
        commitments.totalActiveCommitments
      )} across ${commitments.items.length} obligations, reducing true available funds to ${formatINR(
        liquidity.availableAfterCommitments
      )}.`,
      action: 'Review recurring subscriptions and refrain from taking on new installment obligations.',
      route: 'Cash Flow',
      metrics: {
        totalCommitted: commitments.totalActiveCommitments,
        commitmentRatio: `${commitments.commitmentToIncomeRatio}%`,
        availableAfter: liquidity.availableAfterCommitments,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  } else if (commitments.items.length > 0) {
    decisions.push({
      id: 'dec-com-active-notice',
      category: 'COMMITMENTS',
      priority: 'INFO',
      severity: 'info',
      title: `${commitments.items.length} Active Commitments Reserved`,
      summary: `${formatINR(commitments.totalActiveCommitments)} reserved ahead of due dates.`,
      explanation: `Committed obligations are partitioned from your total balance of ${formatINR(
        liquidity.balance
      )}, protecting them from accidental expenditure.`,
      action: 'Keep commitments reserved in the cash-flow schedule.',
      route: 'Cash Flow',
      metrics: {
        totalCommitted: commitments.totalActiveCommitments,
        count: commitments.items.length,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  }

  return decisions
}

/**
 * Evaluates emergency fund adequacy and resilience.
 */
export function evaluateEmergencyReserveDecisions(
  intel: FinancialIntelligence,
  _state?: DemoFinancialState
): FinancialDecision[] {
  const decisions: FinancialDecision[] = []
  const { savings } = intel

  if (savings.reserveStatus === 'Critical' || savings.reserveStatus === 'Low') {
    decisions.push({
      id: 'dec-res-low-buffer',
      category: 'EMERGENCY_RESERVE',
      priority: 'HIGH',
      severity: 'high',
      title: 'Emergency Reserve Below Minimum Buffer',
      summary: `Reserve currently covers ${savings.emergencyCoverageDays} of normal expenses.`,
      explanation: `Emergency savings stand at ${formatINR(
        savings.emergencyReserve
      )} against a recommended target of ${formatINR(
        savings.emergencyTarget
      )} (${savings.emergencyProgress}% funded, ${savings.emergencyCoverageMonths} months coverage).`,
      action: 'Prioritize building emergency reserve before funding non-essential purchases.',
      route: 'Goals',
      metrics: {
        reserve: savings.emergencyReserve,
        target: savings.emergencyTarget,
        coverageMonths: savings.emergencyCoverageMonths,
        progress: `${savings.emergencyProgress}%`,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  } else if (savings.reserveStatus === 'Strong' || savings.reserveStatus === 'Healthy') {
    decisions.push({
      id: 'dec-res-healthy-buffer',
      category: 'EMERGENCY_RESERVE',
      priority: 'LOW',
      severity: 'low',
      title: 'Emergency Reserve Well-Funded',
      summary: `Reserve covers ${savings.emergencyCoverageMonths} months (${savings.emergencyCoverageDays}) of living expenses.`,
      explanation: `Current reserve of ${formatINR(
        savings.emergencyReserve
      )} provides resilient insulation against sudden income disruption or emergency costs.`,
      action: 'Maintain reserve balance and allocate surplus to secondary goals.',
      route: 'Goals',
      metrics: {
        reserve: savings.emergencyReserve,
        coverageMonths: savings.emergencyCoverageMonths,
        progress: `${savings.emergencyProgress}%`,
      },
      confidence: 'Deterministic (FINOVA Engine)',
    })
  }

  return decisions
}

// =========================================================================
// 3. Central Decision Engine: Master Decision Derivation & Ranking
// =========================================================================

const PRIORITY_WEIGHTS: Record<DecisionPriority, number> = {
  CRITICAL: 500,
  HIGH: 400,
  MEDIUM: 300,
  LOW: 200,
  INFO: 100,
}

/**
 * Pure generator that derives all explainable financial decisions across all categories.
 */
export function deriveAllDecisions(
  intel: FinancialIntelligence,
  state: DemoFinancialState
): FinancialDecision[] {
  const liquidity = evaluateLiquidityDecisions(intel, state)
  const cashFlow = evaluateCashFlowDecisions(intel, state)
  const budgets = evaluateBudgetDecisions(intel, state)
  const goals = evaluateGoalDecisions(intel, state)
  const commitments = evaluateCommitmentDecisions(intel, state)
  const reserve = evaluateEmergencyReserveDecisions(intel, state)

  return [...liquidity, ...cashFlow, ...budgets, ...goals, ...commitments, ...reserve]
}

/**
 * Returns decisions sorted deterministically by priority (CRITICAL -> HIGH -> MEDIUM -> LOW -> INFO)
 * with optional limit for clean UI presentation.
 */
export function getRankedDecisions(
  intel: FinancialIntelligence,
  state: DemoFinancialState,
  limit?: number
): FinancialDecision[] {
  const all = deriveAllDecisions(intel, state)

  const sorted = all.sort((a, b) => {
    const weightA = PRIORITY_WEIGHTS[a.priority] || 0
    const weightB = PRIORITY_WEIGHTS[b.priority] || 0
    return weightB - weightA
  })

  return limit !== undefined && limit > 0 ? sorted.slice(0, limit) : sorted
}

/**
 * Filters decisions by specific category.
 */
export function getDecisionsByCategory(
  category: DecisionCategory,
  intel: FinancialIntelligence,
  state: DemoFinancialState
): FinancialDecision[] {
  return deriveAllDecisions(intel, state).filter(d => d.category === category)
}

// =========================================================================
// 4. Smart Purchases Decision Engine: Comprehensive Evaluation
// =========================================================================

/**
 * Evaluates a proposed purchase holistically against liquid availability, safe-to-spend,
 * commitments, cash flow, emergency reserve, and goal protections.
 *
 * PURE & NON-MUTATING: Never creates transactions or modifies state.
 */
export function evaluatePurchaseDecision(
  input: PurchaseEvaluationInput,
  intel: FinancialIntelligence,
  _state?: DemoFinancialState
): PurchaseDecisionResult {
  const price = Math.max(0, Number(input.price) || 0)
  const installment = Math.max(0, Number(input.installment) || 0)
  const priority = input.priority || 'Medium'
  const purchaseDate = input.purchaseDate || ''

  const { liquidity, cashFlow, commitments, savings, goals } = intel

  // Safe impact: how much uncommitted safe-to-spend this purchase will consume
  const safeImpact = Math.min(liquidity.safeToSpend, Math.round(price * 0.72))
  const remainingSafe = Math.max(0, liquidity.safeToSpend - price)
  const cashImpact = installment > 0 ? installment : Math.round(price / 3)

  const pressurePercent = Math.min(
    100,
    Math.round((price / Math.max(1, liquidity.balance)) * 100)
  )

  const exceedsSafeToSpend = price > liquidity.safeToSpend
  const exceedsLiquidBalance = price > liquidity.balance

  // Estimate goal timeline delay
  const primaryGoal = goals.items[0]
  let goalDelayDays = 0
  if (price > 30000) {
    goalDelayDays = 21
  } else if (price > 15000) {
    goalDelayDays = 9
  } else if (price > 7500 && exceedsSafeToSpend) {
    goalDelayDays = 4
  }
  if (purchaseDate && purchaseDate > '2026-10-01' && goalDelayDays > 0) {
    goalDelayDays = Math.max(0, goalDelayDays - 3)
  }
  // High-priority purchase slightly buffers user tolerance
  if (priority === 'High' && goalDelayDays > 2) {
    goalDelayDays = Math.max(1, goalDelayDays - 2)
  }

  const goalImpactText = goalDelayDays > 0 ? `+ ${goalDelayDays} days` : 'Minimal'

  // Comprehensive multi-factor evaluation
  let status: PurchaseEvaluationStatus = 'RECOMMENDED'
  let statusTag: 'SAFE' | 'CONSIDER' | 'AVOID' = 'SAFE'
  let explanation = ''
  let suggestedAction = ''
  let healthImpactText = 'No change'
  let isAffordable = true

  if (exceedsLiquidBalance) {
    status = 'NOT_RECOMMENDED'
    statusTag = 'AVOID'
    healthImpactText = '− 8 pts'
    isAffordable = false
    explanation = `Purchase price of ${formatINR(
      price
    )} exceeds your total liquid balance of ${formatINR(
      liquidity.balance
    )}. This cannot be funded without debt.`
    suggestedAction = 'Do not proceed. Re-evaluate purchase requirements or save over time.'
  } else if (
    exceedsSafeToSpend &&
    (liquidity.safeToSpend < 5000 || price > liquidity.availableAfterCommitments * 0.6)
  ) {
    status = 'NOT_RECOMMENDED'
    statusTag = 'AVOID'
    healthImpactText = '− 5 pts'
    isAffordable = false
    explanation = `Amount of ${formatINR(
      price
    )} significantly exceeds your uncommitted safe-to-spend buffer (${formatINR(
      liquidity.safeToSpend
    )}) and would encroach into committed funds (${formatINR(
      commitments.totalActiveCommitments
    )}).`
    suggestedAction = 'Delay purchase until uncommitted savings accumulate or split into manageable installments.'
  } else if (exceedsSafeToSpend || cashFlow.cashFlowPressure === 'HIGH' || pressurePercent > 35) {
    status = 'CAUTION'
    statusTag = 'CONSIDER'
    healthImpactText = '− 2 pts'
    isAffordable = true
    explanation = `This purchase is technically payable from balance (${formatINR(
      liquidity.balance
    )}), but exceeds your comfortable safe-to-spend range (${formatINR(
      liquidity.safeToSpend
    )}) and may shift your ${primaryGoal?.name || 'primary goal'} by ${goalImpactText}.`
    suggestedAction = 'Consider waiting 2–4 weeks or reducing non-essential category spending to preserve buffer.'
  } else if (savings.reserveStatus === 'Critical' || savings.reserveStatus === 'Low') {
    status = 'ACCEPTABLE'
    statusTag = 'CONSIDER'
    healthImpactText = '− 1 pt'
    isAffordable = true
    explanation = `Fits within safe-to-spend range, but your emergency reserve is currently below target (${savings.emergencyCoverageDays} coverage).`
    suggestedAction = 'Proceed with purchase only if necessary, ensuring reserve contributions continue.'
  } else {
    status = 'RECOMMENDED'
    statusTag = 'SAFE'
    healthImpactText = 'No change'
    isAffordable = true
    explanation = `Within comfortable safe-to-spend range (${formatINR(
      liquidity.safeToSpend
    )}). Leaves ${formatINR(
      remainingSafe
    )} in liquid buffer with minimal impact on active commitments or goals.`
    suggestedAction = 'Safe to proceed within your current financial plan.'
  }

  return {
    status,
    statusTag,
    price,
    safeImpact,
    remainingSafe,
    cashImpact,
    pressurePercent,
    goalDelayDays,
    goalImpactText,
    healthImpactText,
    explanation,
    suggestedAction,
    isAffordable,
    exceedsSafeToSpend,
    exceedsLiquidBalance,
    confidence: 'Deterministic (FINOVA Engine)',
  }
}

// =========================================================================
// 5. Deterministic AI Advisor Reasoning Layer
// =========================================================================

/**
 * Evaluates a natural language user query against the actual financial state and intelligence,
 * producing grounded, explainable responses without false facts or hallucinations.
 */
export function generateAdvisorResponse(
  prompt: string,
  intel: FinancialIntelligence,
  state: DemoFinancialState
): AdvisorResponse {
  const query = (prompt || '').trim().toLowerCase()
  const { liquidity, cashFlow, budgets, goals, commitments, savings, health } = intel
  const decisions = deriveAllDecisions(intel, state)

  // 1. Safe-to-spend / Affordability questions
  if (
    query.includes('safe') ||
    query.includes('afford') ||
    query.includes('spend') ||
    query.includes('buy')
  ) {
    const primaryGoal = goals.items[0]
    const answer = `Your current safe-to-spend amount is ${formatINR(
      liquidity.safeToSpend
    )}. While your total account balance is ${formatINR(
      liquidity.balance
    )}, ${formatINR(
      commitments.totalActiveCommitments
    )} is already reserved for scheduled commitments${
      commitments.goalAllocationAmount > 0
        ? ` and ${formatINR(commitments.goalAllocationAmount)} for goal allocations`
        : ''
    }. Any single purchase above ${formatINR(
      liquidity.safeToSpend
    )} will compress your comfortable discretionary cushion${
      primaryGoal ? ` and potentially delay your "${primaryGoal.name}" goal` : ''
    }.`

    return {
      answer,
      topic: 'Safe-to-Spend & Affordability',
      suggestedAction:
        liquidity.safeToSpend > 8000
          ? 'Maintain spending discipline within safe-to-spend.'
          : 'Defer non-essential purchases until the next income cycle.',
      relatedDecisions: decisions.filter(d => d.category === 'LIQUIDITY'),
    }
  }

  // 2. Goal questions
  if (
    query.includes('goal') ||
    query.includes('faster') ||
    query.includes('save more') ||
    query.includes('target')
  ) {
    const primaryGoal = goals.items[0]
    const completedGoals = goals.items.filter(g => g.isCompleted)

    let answer = ''
    if (primaryGoal) {
      if (primaryGoal.isCompleted) {
        answer = `Your primary goal "${primaryGoal.name}" is 100% completed (${formatINR(
          primaryGoal.saved
        )} secured). You can safely reallocate its monthly contribution of ${formatINR(
          primaryGoal.monthlyContribution
        )} to other goals or your emergency reserve.`
      } else {
        const gap = primaryGoal.requiredMonthly - primaryGoal.monthlyContribution
        answer = `Your "${primaryGoal.name}" goal is ${primaryGoal.progress}% funded (${formatINR(
          primaryGoal.saved
        )} / ${formatINR(
          primaryGoal.target
        )}). You are contributing ${formatINR(
          primaryGoal.monthlyContribution
        )}/month. To reach it by ${primaryGoal.targetDate || 'target date'}, ${
          gap > 0
            ? `you need to increase contributions by ${formatINR(gap)}/month.`
            : `your current pace is on track!`
        }`
      }
    } else {
      answer = `You have ${goals.items.length} active goals with an aggregate progress of ${goals.aggregateProgress}%.`
    }

    if (completedGoals.length > 0 && !primaryGoal?.isCompleted) {
      answer += ` You have already achieved ${completedGoals.length} goal (${completedGoals
        .map(g => g.name)
        .join(', ')}).`
    }

    return {
      answer,
      topic: 'Goal Strategy',
      suggestedAction: 'Review goal contribution settings in the Goals simulator.',
      relatedDecisions: decisions.filter(d => d.category === 'GOALS'),
    }
  }

  // 3. Overspending / Budget cutting questions
  if (
    query.includes('overspend') ||
    query.includes('cut') ||
    query.includes('reduce') ||
    query.includes('save')
  ) {
    let answer = `Your total monthly spending is ${formatINR(
      liquidity.monthlySpending
    )} against incoming monthly revenue of ${formatINR(liquidity.monthlyIncome)}.`

    if (budgets.overBudgetCount > 0) {
      answer += ` You are currently over budget in: ${budgets.overBudgetCategories.join(
        ', '
      )}. Reviewing these categories offers the quickest opportunity to restore surplus.`
    } else if (budgets.nearLimitCount > 0) {
      answer += ` Categories approaching their threshold include: ${budgets.nearLimitCategories.join(
        ', '
      )}. Keeping variable spending in these areas contained will prevent budget overruns.`
    } else {
      answer += ` All tracked budget categories are currently within limits, with an overall utilization of ${budgets.overallUtilization}%.`
    }

    return {
      answer,
      topic: 'Spending & Budget Control',
      suggestedAction:
        budgets.overBudgetCount > 0
          ? `Reduce spending in ${budgets.overBudgetCategories[0]}.`
          : 'Keep variable category spending steady.',
      relatedDecisions: decisions.filter(d => d.category === 'BUDGETS'),
    }
  }

  // 4. Monthly status & Health overview
  if (
    query.includes('month') ||
    query.includes('doing') ||
    query.includes('health') ||
    query.includes('overview') ||
    query.includes('summary')
  ) {
    const answer = `Your Financial Health score is ${health.score}/100 (${health.level}). You have a monthly ${
      liquidity.isDeficit
        ? `deficit of ${formatINR(liquidity.monthlyDeficit)}`
        : `surplus of ${formatINR(liquidity.monthlySurplus)} (savings rate: ${cashFlow.savingsRate}%)`
    }. Your emergency reserve covers ${savings.emergencyCoverageDays} of normal expenses, and safe-to-spend capacity is ${formatINR(
      liquidity.safeToSpend
    )}.`

    return {
      answer,
      topic: 'Monthly Financial State',
      suggestedAction: health.nextAction,
      relatedDecisions: getRankedDecisions(intel, state, 3),
    }
  }

  // 5. Emergency / Unexpected expense questions
  if (
    query.includes('emergency') ||
    query.includes('unexpected') ||
    query.includes('reserve') ||
    query.includes('buffer')
  ) {
    const answer = `Your emergency reserve holds ${formatINR(
      savings.emergencyReserve
    )} (${savings.emergencyProgress}% of your ${formatINR(
      savings.emergencyTarget
    )} target), providing an estimated ${savings.emergencyCoverageDays} of baseline coverage. In an emergency, this buffer protects your long-term goals and ongoing cash-flow obligations.`

    return {
      answer,
      topic: 'Emergency Reserve',
      suggestedAction:
        savings.emergencyProgress < 70
          ? 'Strengthen emergency reserve contributions.'
          : 'Maintain reserve cushion.',
      relatedDecisions: decisions.filter(d => d.category === 'EMERGENCY_RESERVE'),
    }
  }

  // Default fallback response grounded strictly in real context
  return {
    answer: `Based on your active financial context: Financial Health is ${
      health.score
    }/100, Safe-to-Spend is ${formatINR(
      liquidity.safeToSpend
    )}, and you have ${goals.items.length} active goals (${goals.aggregateProgress}% funded). Ask me about safe-to-spend, budget adjustments, goal timelines, or simulated purchases.`,
    topic: 'General Financial Intelligence',
    suggestedAction: 'Explore suggested questions or simulate a purchase.',
    relatedDecisions: getRankedDecisions(intel, state, 2),
  }
}
