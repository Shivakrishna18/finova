import type { DemoFinancialState } from '../data/demoFinancialState'
import type { FinancialIntelligence } from '../finance/FinancialIntelligence'
import type { ReconciliationSummary } from '../controller/financeControllerTypes'

export type SignalType =
  | 'SAFE_TO_SPEND_WARNING'
  | 'BILL_DUE'
  | 'GOAL_MILESTONE'
  | 'ANOMALY_DETECTED'
  | 'BUDGET_THRESHOLD'
  | 'HEALTH_CHANGE'
  | 'RECONCILIATION_EXCEPTION'
  | 'BILL_SCANNED'
  | 'MONTHLY_WRAPUP'

export type SignalSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS'

export interface FinancialSignal {
  id: string
  type: SignalType
  title: string
  message: string
  severity: SignalSeverity
  timestamp: string
  read: boolean
  dismissed: boolean
  targetView: string // Deep link view name in AppExperience
  actionLabel?: string
}

export function generateLiveSignals(
  finance: DemoFinancialState,
  intelligence: FinancialIntelligence,
  reconSummary?: ReconciliationSummary
): FinancialSignal[] {
  const signals: FinancialSignal[] = []

  // 1. Safe to spend warning
  if (finance.safeToSpend < 10000) {
    signals.push({
      id: 'sig-sts-low',
      type: 'SAFE_TO_SPEND_WARNING',
      title: 'Safe to Spend Cushion Alert',
      message: `Safe-to-spend is at ₹${finance.safeToSpend.toLocaleString('en-IN')}, lower than optimal cushion. Discretionary limits recommended.`,
      severity: finance.safeToSpend < 5000 ? 'CRITICAL' : 'WARNING',
      timestamp: new Date().toISOString(),
      read: false,
      dismissed: false,
      targetView: 'Money',
      actionLabel: 'Inspect Money Flow'
    })
  }

  // 2. Bill due soon
  if (finance.commitments && finance.commitments.length > 0) {
    const nextBill = finance.commitments[0]
    signals.push({
      id: `sig-bill-${nextBill.id}`,
      type: 'BILL_DUE',
      title: `Upcoming Commitment: ${nextBill.name}`,
      message: `Payment of ₹${nextBill.amount.toLocaleString('en-IN')} is scheduled due on ${nextBill.dueDate || '1st of next month'}. Ringfenced funds verified.`,
      severity: 'WARNING',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      read: false,
      dismissed: false,
      targetView: 'Money',
      actionLabel: 'Review Commitments'
    })
  }

  // 3. Goal milestone
  const topGoal = intelligence.goals.items.find(g => g.progress >= 50)
  if (topGoal) {
    signals.push({
      id: `sig-goal-${topGoal.id}`,
      type: 'GOAL_MILESTONE',
      title: `Goal Milestone: ${topGoal.name}`,
      message: `You have crossed ${topGoal.progress}% toward your ₹${topGoal.target.toLocaleString('en-IN')} target (Saved: ₹${topGoal.saved.toLocaleString('en-IN')}).`,
      severity: 'SUCCESS',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      read: true,
      dismissed: false,
      targetView: 'Goals',
      actionLabel: 'View Goal Progress'
    })
  }

  // 4. Budget threshold exceeded or approaching
  const overBudget = intelligence.budgets.categories.find(b => b.utilization >= 80)
  if (overBudget) {
    signals.push({
      id: `sig-budget-${overBudget.category}`,
      type: 'BUDGET_THRESHOLD',
      title: `Budget Notice: ${overBudget.category}`,
      message: `${overBudget.category} is at ${overBudget.utilization}% of allocated budget (₹${overBudget.actual.toLocaleString('en-IN')} of ₹${overBudget.budget.toLocaleString('en-IN')}).`,
      severity: overBudget.utilization > 100 ? 'CRITICAL' : 'WARNING',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      read: false,
      dismissed: false,
      targetView: 'Action Center',
      actionLabel: 'Manage Budgets'
    })
  }

  // 5. Reconciliation Exception (Track 4)
  if (reconSummary && reconSummary.exceptionRecords > 0) {
    signals.push({
      id: 'sig-recon-exc',
      type: 'RECONCILIATION_EXCEPTION',
      title: `Reconciliation: ${reconSummary.exceptionRecords} Exceptions Detected`,
      message: `${reconSummary.exceptionRecords} discrepancies flagged across Gateway & Settlement batches with ₹${reconSummary.totalExceptionVolume.toLocaleString('en-IN')} variance.`,
      severity: 'CRITICAL',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      read: false,
      dismissed: false,
      targetView: 'Finance Controller',
      actionLabel: 'Open Exception Workspace'
    })
  }

  // 6. Financial Health status
  signals.push({
    id: 'sig-health-eval',
    type: 'HEALTH_CHANGE',
    title: `Health Score: ${finance.financialHealth}/100`,
    message: `Solvency runway is currently ${intelligence.cashFlow.runwayDays} days. Savings rate is running at ${intelligence.cashFlow.savingsRate}%.`,
    severity: 'INFO',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    read: true,
    dismissed: false,
    targetView: 'Financial Health',
    actionLabel: 'View Diagnostics'
  })

  // 7. Monthly wrap-up ready
  signals.push({
    id: 'sig-wrapup-ready',
    type: 'MONTHLY_WRAPUP',
    title: 'Monthly Financial Statement Ready',
    message: 'August 2026 executive summary, cash flow trends, and budget variances are available for export.',
    severity: 'INFO',
    timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
    read: true,
    dismissed: false,
    targetView: 'Reports',
    actionLabel: 'Open Reports Center'
  })

  return signals
}
