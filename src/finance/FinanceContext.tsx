import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
export { formatINR } from '../data/demoFinancialState'
export type { DemoFinancialState, Goal, Transaction } from '../data/demoFinancialState'
import {
  demoFinancialState,
  type DemoFinancialState,
  type Goal,
  type Transaction,
} from '../data/demoFinancialState'

import {
  calculateFinancialIntelligence,
  calculateSafeToSpend,
  calculateBudgetMetric,
  calculateGoalMetrics,
  type FinancialIntelligence,
  type BudgetMetric,
  type GoalMetric,
  type FinancialSignal,
  type HealthFactor,
  type HealthLevel,
  type IncomeRecord,
  type Commitment,
  type UpcomingItem,
} from './FinancialIntelligence'

import {
  deriveAllDecisions,
  getRankedDecisions,
  getDecisionsByCategory,
  evaluatePurchaseDecision,
  generateAdvisorResponse,
  type FinancialDecision,
  type DecisionCategory,
  type DecisionPriority,
  type DecisionSeverity,
  type PurchaseEvaluationStatus,
  type PurchaseEvaluationInput,
  type PurchaseDecisionResult,
  type AdvisorResponse,
} from './FinancialDecisionEngine'

import {
  simulateFinancialScenario,
  type FinancialScenario,
  type SimulationResult,
  type PurchaseScenario,
  type IncomeChangeScenario,
  type ExpenseChangeScenario,
  type CommitmentChangeScenario,
  type GoalContributionScenario,
  type GoalWithdrawalScenario,
  type BudgetChangeScenario,
  type CustomExpenseScenario,
} from './FinancialSimulationEngine'
import { logAuditEvent } from '../audit/auditLogger'

export {
  calculateFinancialIntelligence,
  calculateSafeToSpend,
  calculateBudgetMetric,
  calculateGoalMetrics,
  type FinancialIntelligence,
  type BudgetMetric,
  type GoalMetric,
  type FinancialSignal,
  type HealthFactor,
  type HealthLevel,
  type IncomeRecord,
  type Commitment,
  type UpcomingItem,
  deriveAllDecisions,
  getRankedDecisions,
  getDecisionsByCategory,
  evaluatePurchaseDecision,
  generateAdvisorResponse,
  simulateFinancialScenario,
  type FinancialDecision,
  type DecisionCategory,
  type DecisionPriority,
  type DecisionSeverity,
  type PurchaseEvaluationStatus,
  type PurchaseEvaluationInput,
  type PurchaseDecisionResult,
  type AdvisorResponse,
  type FinancialScenario,
  type SimulationResult,
  type PurchaseScenario,
  type IncomeChangeScenario,
  type ExpenseChangeScenario,
  type CommitmentChangeScenario,
  type GoalContributionScenario,
  type GoalWithdrawalScenario,
  type BudgetChangeScenario,
  type CustomExpenseScenario,
}

export const FINANCIAL_STATE_STORAGE_KEY = 'finova-financial-state-v1'

export interface OnboardingFinancialInput {
  income: number
  spending: number
  commitments: Array<{
    name: string
    amount: number
    frequency: 'Monthly' | 'Quarterly' | 'Annual' | string
    date?: string
    type?: string
  }>
  goals: Array<{
    name: string
    target: number
    current: number
    monthlyContribution: number
    targetDate: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
  }>
  emergencyReserve: number
  financialPreference?: string
}

export interface FinanceContextType {
  state: DemoFinancialState
  intelligence: FinancialIntelligence
  decisions: FinancialDecision[]
  topDecisions: FinancialDecision[]
  evaluatePurchase: (input: PurchaseEvaluationInput) => PurchaseDecisionResult
  askAdvisor: (prompt: string) => AdvisorResponse
  askAdvisorAsync: (
    prompt: string,
    history?: Array<{ from: string; text: string }>
  ) => Promise<{ answer: string; isAI: boolean; grounded: boolean }>
  simulateScenario: (scenario: FinancialScenario) => SimulationResult
  setState: React.Dispatch<React.SetStateAction<DemoFinancialState>>
  updateState: (
    updater: Partial<DemoFinancialState> | ((prev: DemoFinancialState) => Partial<DemoFinancialState>)
  ) => void
  resetFinancialState: () => void
  initializeUserFinancialProfile: (input: OnboardingFinancialInput) => void
  loadUserOrDemoState: (isDemo: boolean, userId?: string) => void
  addTransaction: (transaction: Transaction) => void
  updateTransaction: (indexOrId: number | string, updated: Partial<Transaction>) => void
  deleteTransaction: (indexOrId: number | string) => void
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, updated: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  contributeToGoal: (id: string, amount: number) => void
  withdrawFromGoal: (id: string, amount: number) => void
  addIncomeRecord: (record: IncomeRecord) => void
  updateIncomeRecord: (id: string, updated: Partial<IncomeRecord>) => void
  deleteIncomeRecord: (id: string) => void
  addCommitment: (commitment: Commitment) => void
  updateCommitment: (id: string, updated: Partial<Commitment>) => void
  deleteCommitment: (id: string) => void
  addBudget: (category: string, amount: number) => void
  updateBudget: (category: string, amount: number, newCategoryName?: string) => void
  deleteBudget: (category: string) => void
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

function applyTransactionImpact(
  totals: {
    balance: number
    income: number
    monthlySpending: number
    safeToSpend: number
    financialHealth: number
  },
  tx: Transaction
): void {
  const isIncome = tx.category === 'Income'
  const amount = Math.max(0, tx.amount)

  if (isIncome) {
    totals.balance += amount
    totals.income += amount
    totals.safeToSpend += amount
  } else {
    totals.balance -= amount
    totals.monthlySpending += amount
    totals.safeToSpend = Math.max(0, totals.safeToSpend - amount)
    totals.financialHealth = Math.max(0, totals.financialHealth - (amount > 5000 ? 2 : 1))
  }
}

function reverseTransactionImpact(
  totals: {
    balance: number
    income: number
    monthlySpending: number
    safeToSpend: number
    financialHealth: number
  },
  tx: Transaction
): void {
  const isIncome = tx.category === 'Income'
  const amount = Math.max(0, tx.amount)

  if (isIncome) {
    totals.balance -= amount
    totals.income = Math.max(0, totals.income - amount)
    totals.safeToSpend = Math.max(0, totals.safeToSpend - amount)
  } else {
    totals.balance += amount
    totals.monthlySpending = Math.max(0, totals.monthlySpending - amount)
    totals.safeToSpend += amount
    totals.financialHealth = Math.min(100, totals.financialHealth + (amount > 5000 ? 2 : 1))
  }
}

function applyIncomeRecordImpact(
  totals: {
    balance: number
    income: number
    monthlySpending: number
    safeToSpend: number
    financialHealth: number
  },
  record: IncomeRecord
): void {
  const amount = Math.max(0, record.amount)
  totals.income += amount
  // If the income is received, it is immediately in the balance and safe-to-spend
  if (record.status === 'RECEIVED') {
    totals.balance += amount
    totals.safeToSpend += amount
  }
}

function reverseIncomeRecordImpact(
  totals: {
    balance: number
    income: number
    monthlySpending: number
    safeToSpend: number
    financialHealth: number
  },
  record: IncomeRecord
): void {
  const amount = Math.max(0, record.amount)
  totals.income = Math.max(0, totals.income - amount)
  if (record.status === 'RECEIVED') {
    totals.balance = Math.max(0, totals.balance - amount)
    totals.safeToSpend = Math.max(0, totals.safeToSpend - amount)
  }
}

function findTransactionIndex(transactions: Transaction[], indexOrId: number | string): number {
  if (typeof indexOrId === 'number') {
    return indexOrId >= 0 && indexOrId < transactions.length ? indexOrId : -1
  }
  const byId = transactions.findIndex(tx => tx.id === indexOrId)
  if (byId >= 0) return byId

  const numericIndex = Number(indexOrId)
  if (!Number.isNaN(numericIndex) && numericIndex >= 0 && numericIndex < transactions.length) {
    return numericIndex
  }
  return -1
}

function getInitialDemoState(): DemoFinancialState {
  return {
    balance: demoFinancialState.balance,
    income: demoFinancialState.income,
    monthlySpending: demoFinancialState.monthlySpending,
    safeToSpend: demoFinancialState.safeToSpend,
    financialHealth: demoFinancialState.financialHealth,
    goals: demoFinancialState.goals.map(goal => ({ ...goal })),
    upcoming: demoFinancialState.upcoming.map(item => ({ ...item })),
    transactions: demoFinancialState.transactions.map((tx, idx) => ({
      id: tx.id || `demo-tx-${idx}`,
      name: tx.name,
      category: tx.category,
      amount: tx.amount,
      date: tx.date,
    })),
    cashFlow: Object.fromEntries(
      Object.entries(demoFinancialState.cashFlow).map(([key, list]) => [
        key,
        list.map(entry => ({ ...entry })),
      ])
    ),
    incomeRecords: demoFinancialState.incomeRecords.map(rec => ({ ...rec })),
    commitments: demoFinancialState.commitments.map(com => ({ ...com })),
    budgets: { ...demoFinancialState.budgets },
  }
}

function isValidFinancialState(data: unknown): data is DemoFinancialState {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false
  }

  const obj = data as Record<string, unknown>

  return (
    typeof obj.balance === 'number' &&
    !Number.isNaN(obj.balance) &&
    typeof obj.income === 'number' &&
    !Number.isNaN(obj.income) &&
    typeof obj.monthlySpending === 'number' &&
    !Number.isNaN(obj.monthlySpending) &&
    typeof obj.safeToSpend === 'number' &&
    !Number.isNaN(obj.safeToSpend) &&
    typeof obj.financialHealth === 'number' &&
    !Number.isNaN(obj.financialHealth) &&
    Array.isArray(obj.goals) &&
    Array.isArray(obj.upcoming) &&
    Array.isArray(obj.transactions) &&
    obj.transactions.every(
      tx =>
        tx &&
        typeof tx === 'object' &&
        typeof (tx as Record<string, unknown>).name === 'string' &&
        typeof (tx as Record<string, unknown>).category === 'string' &&
        typeof (tx as Record<string, unknown>).amount === 'number' &&
        !Number.isNaN((tx as Record<string, unknown>).amount) &&
        typeof (tx as Record<string, unknown>).date === 'string'
    ) &&
    typeof obj.cashFlow === 'object' &&
    obj.cashFlow !== null &&
    Array.isArray(obj.incomeRecords) &&
    obj.incomeRecords.every(
      rec =>
        rec &&
        typeof rec === 'object' &&
        typeof (rec as Record<string, unknown>).id === 'string' &&
        typeof (rec as Record<string, unknown>).source === 'string' &&
        typeof (rec as Record<string, unknown>).amount === 'number' &&
        !Number.isNaN((rec as Record<string, unknown>).amount) &&
        typeof (rec as Record<string, unknown>).expectedDate === 'string' &&
        typeof (rec as Record<string, unknown>).frequency === 'string' &&
        typeof (rec as Record<string, unknown>).status === 'string'
    ) &&
    Array.isArray(obj.commitments) &&
    obj.commitments.every(
      com =>
        com &&
        typeof com === 'object' &&
        typeof (com as Record<string, unknown>).id === 'string' &&
        typeof (com as Record<string, unknown>).name === 'string' &&
        typeof (com as Record<string, unknown>).amount === 'number' &&
        !Number.isNaN((com as Record<string, unknown>).amount) &&
        typeof (com as Record<string, unknown>).date === 'string' &&
        typeof (com as Record<string, unknown>).type === 'string'
    ) &&
    typeof obj.budgets === 'object' &&
    obj.budgets !== null &&
    !Array.isArray(obj.budgets) &&
    Object.entries(obj.budgets as Record<string, unknown>).every(
      ([cat, limit]) =>
        typeof cat === 'string' &&
        cat.trim().length > 0 &&
        typeof limit === 'number' &&
        !Number.isNaN(limit) &&
        Number.isFinite(limit) &&
        limit >= 0
    )
  )
}

function loadPersistedFinancialState(): DemoFinancialState {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return getInitialDemoState()
    }
    const raw = window.localStorage.getItem(FINANCIAL_STATE_STORAGE_KEY)
    if (!raw) {
      return getInitialDemoState()
    }
    const parsed: unknown = JSON.parse(raw)
    if (isValidFinancialState(parsed)) {
      return parsed
    }
  } catch (error) {
    console.warn('Failed to load persisted financial state from localStorage:', error)
  }
  return getInitialDemoState()
}

function savePersistedFinancialState(state: DemoFinancialState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(FINANCIAL_STATE_STORAGE_KEY, JSON.stringify(state))
    }
  } catch (error) {
    console.warn('Failed to save financial state to localStorage:', error)
  }
}

import { useAuth } from '../auth/AuthContext'

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<DemoFinancialState>(() => {
    if (typeof window !== 'undefined' && window.localStorage && user && !user.isDemo) {
      const raw = window.localStorage.getItem(`finova-user-state-${user.id}`)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (isValidFinancialState(parsed)) return parsed
        } catch {}
      }
    }
    return loadPersistedFinancialState()
  })

  // Sync state when active user changes
  useEffect(() => {
    if (!user) {
      return
    }
    if (user.isDemo) {
      const demoState = loadPersistedFinancialState()
      setState(demoState)
    } else {
      const userKey = `finova-user-state-${user.id}`
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(userKey)
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            if (isValidFinancialState(parsed)) {
              setState(parsed)
              return
            }
          } catch {}
        }
      }
    }
  }, [user])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return
    if (user && !user.isDemo) {
      window.localStorage.setItem(`finova-user-state-${user.id}`, JSON.stringify(state))
    } else {
      savePersistedFinancialState(state)
    }
  }, [state, user])

  const resetFinancialState = useCallback(() => {
    const fresh = getInitialDemoState()
    setState(fresh)
    if (user && !user.isDemo && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`finova-user-state-${user.id}`, JSON.stringify(fresh))
    } else {
      savePersistedFinancialState(fresh)
    }
  }, [user])

  const loadUserOrDemoState = useCallback((isDemo: boolean, userId?: string) => {
    if (isDemo) {
      const demoState = loadPersistedFinancialState()
      setState(demoState)
    } else if (userId && typeof window !== 'undefined' && window.localStorage) {
      const userKey = `finova-user-state-${userId}`
      const raw = window.localStorage.getItem(userKey)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (isValidFinancialState(parsed)) {
            setState(parsed)
            return
          }
        } catch {
          // fallback
        }
      }
    }
  }, [])

  const initializeUserFinancialProfile = useCallback(
    (input: OnboardingFinancialInput) => {
    const income = Math.max(0, input.income || 0)
    const spending = Math.max(0, input.spending || 0)
    const emergency = Math.max(0, input.emergencyReserve || 0)

    // Calculate total commitments monthly burden
    const monthlyCommitmentsTotal = (input.commitments || []).reduce((sum, c) => {
      const amt = Math.max(0, c.amount || 0)
      if (c.frequency === 'Annual') return sum + amt / 12
      if (c.frequency === 'Quarterly') return sum + amt / 3
      return sum + amt
    }, 0)

    // Calculate goals monthly contribution
    const monthlyGoalsTotal = (input.goals || []).reduce(
      (sum, g) => sum + Math.max(0, g.monthlyContribution || 0),
      0
    )

    // Calculate safe to spend
    const initialSafeToSpend = Math.max(0, Math.round(income - spending - monthlyCommitmentsTotal - monthlyGoalsTotal))
    const initialBalance = Math.max(0, emergency + Math.max(0, income - spending))

    // Calculate initial health score
    let healthScore = 65
    if (spending > 0) {
      const coverRatio = emergency / spending
      if (coverRatio >= 6) healthScore += 18
      else if (coverRatio >= 3) healthScore += 12
      else if (coverRatio >= 1) healthScore += 6
      else healthScore -= 10
    }
    if (income > spending + monthlyCommitmentsTotal) {
      healthScore += 10
    } else if (income < spending) {
      healthScore -= 15
    }
    if ((input.goals || []).length > 0) {
      healthScore += 7
    }
    healthScore = Math.min(95, Math.max(35, Math.round(healthScore)))

    // Construct mapped commitments
    const mappedCommitments: Commitment[] = (input.commitments || []).map((c, idx) => ({
      id: `com-${Date.now()}-${idx}`,
      name: c.name.trim() || `Commitment ${idx + 1}`,
      amount: Math.max(0, c.amount),
      date: c.date || `Day ${Math.min(28, (idx + 1) * 6)}`,
      type:
        c.type ||
        (c.name.toLowerCase().includes('loan') || c.name.toLowerCase().includes('emi')
          ? 'Debt'
          : c.name.toLowerCase().includes('rent') || c.name.toLowerCase().includes('housing')
          ? 'Housing'
          : c.name.toLowerCase().includes('insurance')
          ? 'Insurance'
          : 'Subscription'),
    }))

    // Construct mapped goals
    const mappedGoals: Goal[] = (input.goals || []).map((g, idx) => ({
      id: `goal-${Date.now()}-${idx}`,
      name: g.name.trim() || `Goal ${idx + 1}`,
      target: Math.max(1000, g.target),
      saved: Math.max(0, g.current),
      monthlyContribution: Math.max(0, g.monthlyContribution),
      targetDate: g.targetDate || '2026-12-31',
      priority: g.priority || 'MEDIUM',
    }))

    // Construct mapped income records
    const mappedIncomeRecords: IncomeRecord[] = [
      {
        id: `inc-${Date.now()}-primary`,
        source: 'Primary Monthly Income',
        amount: income,
        expectedDate: '01',
        frequency: 'Monthly',
        status: 'RECEIVED',
      },
    ]

    // Construct sensible default budgets matching spending
    const foodBudget = Math.max(2000, Math.round(spending * 0.3))
    const housingBudget = Math.max(2000, Math.round(spending * 0.35))
    const transportBudget = Math.max(1000, Math.round(spending * 0.15))
    const discretionaryBudget = Math.max(1000, Math.round(spending * 0.2))

    const mappedBudgets: Record<string, number> = {
      Housing: housingBudget,
      'Food & Dining': foodBudget,
      Transport: transportBudget,
      Discretionary: discretionaryBudget,
    }

    // Construct initial realistic transactions
    const mappedTransactions: Transaction[] = [
      {
        id: `tx-${Date.now()}-1`,
        name: 'Salary Credit / Primary Income',
        category: 'Income',
        amount: income,
        date: 'Today',
      },
    ]

    if (mappedCommitments.length > 0) {
      mappedTransactions.push({
        id: `tx-${Date.now()}-2`,
        name: `${mappedCommitments[0].name} (Payment)`,
        category: 'Bills',
        amount: mappedCommitments[0].amount,
        date: 'Yesterday',
      })
    }

    if (spending > 0) {
      mappedTransactions.push({
        id: `tx-${Date.now()}-3`,
        name: 'Grocery & Essentials',
        category: 'Food & Dining',
        amount: Math.min(Math.round(spending * 0.15), 4500),
        date: '3 days ago',
      })
    }

    // Construct cash flow
    const cashFlow = {
      'Week 1': [
        { label: 'Income Inflow', amount: income, type: 'inflow' as const },
        {
          label: mappedCommitments[0]?.name || 'Fixed Essentials',
          amount: mappedCommitments[0]?.amount || Math.round(spending * 0.25),
          type: 'outflow' as const,
        },
      ],
      'Week 2': [
        { label: 'Groceries & Living', amount: Math.round(spending * 0.25), type: 'outflow' as const },
      ],
      'Week 3': [
        {
          label: mappedCommitments[1]?.name || 'Utilities & Subscriptions',
          amount: mappedCommitments[1]?.amount || Math.round(spending * 0.2),
          type: 'outflow' as const,
        },
      ],
      'Week 4': [
        { label: 'Discretionary & Savings', amount: Math.round(spending * 0.3), type: 'outflow' as const },
      ],
    }

    const upcoming = mappedCommitments.map(c => ({
      name: c.name,
      amount: c.amount,
      due: c.date,
      category: c.type,
    }))

    const newUserState: DemoFinancialState = {
      balance: initialBalance,
      income,
      monthlySpending: spending,
      safeToSpend: initialSafeToSpend,
      financialHealth: healthScore,
      goals: mappedGoals,
      upcoming,
      transactions: mappedTransactions,
      cashFlow,
      incomeRecords: mappedIncomeRecords,
      commitments: mappedCommitments,
      budgets: mappedBudgets,
    }

    setState(newUserState)
    if (user && !user.isDemo && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`finova-user-state-${user.id}`, JSON.stringify(newUserState))
    } else {
      savePersistedFinancialState(newUserState)
    }
  }, [user])

  const updateState = useCallback(
    (updater: Partial<DemoFinancialState> | ((prev: DemoFinancialState) => Partial<DemoFinancialState>)) => {
      setState(prev => {
        const patch = typeof updater === 'function' ? updater(prev) : updater
        return {
          ...prev,
          ...patch,
        }
      })
    },
    []
  )

  const addTransaction = useCallback((transaction: Transaction) => {
    const rawAmount = Number(transaction.amount)
    if (
      !transaction.name ||
      typeof transaction.name !== 'string' ||
      !transaction.name.trim() ||
      Number.isNaN(rawAmount) ||
      !Number.isFinite(rawAmount) ||
      rawAmount <= 0
    ) {
      console.warn('Invalid transaction rejected in addTransaction:', transaction)
      return
    }

    const sanitized: Transaction = {
      id: transaction.id || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: transaction.name.trim(),
      category: transaction.category || 'Other',
      amount: rawAmount,
      date: transaction.date || 'Today',
    }

    setState(prev => {
      const totals = {
        balance: prev.balance,
        income: prev.income,
        monthlySpending: prev.monthlySpending,
        safeToSpend: prev.safeToSpend,
        financialHealth: prev.financialHealth,
      }

      applyTransactionImpact(totals, sanitized)

      logAuditEvent({
        eventType: sanitized.category === 'Income' ? 'Income Added' : 'Transaction Added',
        category: sanitized.category === 'Income' ? 'INCOME' : 'TRANSACTION',
        description: `Recorded transaction '${sanitized.name}' (${sanitized.category}): ${formatINR(sanitized.amount)}.`,
        amount: sanitized.amount,
        source: 'USER',
        relatedEntity: sanitized.name,
        severity: 'INFO',
        isDemo: true,
      })

      return {
        ...prev,
        ...totals,
        transactions: [sanitized, ...prev.transactions],
      }
    })
  }, [])

  const updateTransaction = useCallback((indexOrId: number | string, updated: Partial<Transaction>) => {
    setState(prev => {
      const index = findTransactionIndex(prev.transactions, indexOrId)
      if (index < 0) return prev

      const oldTx = prev.transactions[index]
      let newAmount = oldTx.amount

      if (updated.amount !== undefined) {
        const parsedAmount = Number(updated.amount)
        if (Number.isNaN(parsedAmount) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          console.warn('Invalid amount passed to updateTransaction:', updated.amount)
          return prev
        }
        newAmount = parsedAmount
      }

      const newTx: Transaction = {
        ...oldTx,
        ...updated,
        name: updated.name !== undefined ? updated.name.trim() || oldTx.name : oldTx.name,
        category: updated.category !== undefined ? updated.category || oldTx.category : oldTx.category,
        amount: newAmount,
        date: updated.date !== undefined ? updated.date || oldTx.date : oldTx.date,
      }

      const totals = {
        balance: prev.balance,
        income: prev.income,
        monthlySpending: prev.monthlySpending,
        safeToSpend: prev.safeToSpend,
        financialHealth: prev.financialHealth,
      }

      // Step 1: reverse old impact
      reverseTransactionImpact(totals, oldTx)
      // Step 2: apply updated impact
      applyTransactionImpact(totals, newTx)

      const nextTransactions = prev.transactions.map((tx, i) => (i === index ? newTx : tx))

      return {
        ...prev,
        ...totals,
        transactions: nextTransactions,
      }
    })
  }, [])

  const deleteTransaction = useCallback((indexOrId: number | string) => {
    setState(prev => {
      const index = findTransactionIndex(prev.transactions, indexOrId)
      if (index < 0) return prev

      const oldTx = prev.transactions[index]
      const totals = {
        balance: prev.balance,
        income: prev.income,
        monthlySpending: prev.monthlySpending,
        safeToSpend: prev.safeToSpend,
        financialHealth: prev.financialHealth,
      }

      // Reverse previous financial impact
      reverseTransactionImpact(totals, oldTx)

      logAuditEvent({
        eventType: 'Transaction Deleted',
        category: 'TRANSACTION',
        description: `Removed transaction '${oldTx.name}' (${oldTx.category}): ${formatINR(oldTx.amount)}.`,
        amount: oldTx.amount,
        source: 'USER',
        relatedEntity: oldTx.name,
        severity: 'WARNING',
        isDemo: true,
      })

      return {
        ...prev,
        ...totals,
        transactions: prev.transactions.filter((_, i) => i !== index),
      }
    })
  }, [])

  const addGoal = useCallback((goal: Goal) => {
    const rawTarget = Number(goal.target)
    const rawSaved = Number(goal.saved ?? 0)
    const rawMonthly = goal.monthlyContribution !== undefined ? Number(goal.monthlyContribution) : undefined

    if (
      !goal.name ||
      typeof goal.name !== 'string' ||
      !goal.name.trim() ||
      Number.isNaN(rawTarget) ||
      !Number.isFinite(rawTarget) ||
      rawTarget <= 0 ||
      Number.isNaN(rawSaved) ||
      !Number.isFinite(rawSaved) ||
      rawSaved < 0
    ) {
      console.warn('Invalid goal rejected in addGoal:', goal)
      return
    }

    const sanitized: Goal = {
      id: goal.id?.trim() || `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: goal.name.trim(),
      saved: Math.max(0, rawSaved),
      target: Math.max(1, rawTarget),
      completion: goal.completion?.trim() || '6 months',
      monthlyContribution:
        rawMonthly !== undefined && !Number.isNaN(rawMonthly) && rawMonthly >= 0 ? rawMonthly : undefined,
      priority:
        goal.priority === 'High' || goal.priority === 'Medium' || goal.priority === 'Low'
          ? goal.priority
          : 'Medium',
      targetDate: goal.targetDate?.trim() || undefined,
    }

    logAuditEvent({
      eventType: 'Goal Created',
      category: 'GOAL',
      description: `Created goal '${sanitized.name}' with target of ${formatINR(sanitized.target)}.`,
      amount: sanitized.target,
      source: 'USER',
      relatedEntity: sanitized.name,
      severity: 'SUCCESS',
      isDemo: true,
    })

    setState(prev => ({
      ...prev,
      goals: [...prev.goals, sanitized],
    }))
  }, [])

  const updateGoal = useCallback((id: string, updated: Partial<Goal>) => {
    if (!id || typeof id !== 'string') return

    setState(prev => {
      const index = prev.goals.findIndex(g => g.id === id)
      if (index < 0) return prev

      const oldGoal = prev.goals[index]
      let newTarget = oldGoal.target
      let newSaved = oldGoal.saved
      let newName = oldGoal.name

      if (updated.name !== undefined) {
        if (typeof updated.name === 'string' && updated.name.trim().length > 0) {
          newName = updated.name.trim()
        }
      }

      if (updated.target !== undefined) {
        const parsedTarget = Number(updated.target)
        if (!Number.isNaN(parsedTarget) && Number.isFinite(parsedTarget) && parsedTarget > 0) {
          newTarget = parsedTarget
        }
      }

      if (updated.saved !== undefined) {
        const parsedSaved = Number(updated.saved)
        if (!Number.isNaN(parsedSaved) && Number.isFinite(parsedSaved) && parsedSaved >= 0) {
          newSaved = parsedSaved
        }
      }

      const sanitized: Goal = {
        ...oldGoal,
        ...updated,
        id: oldGoal.id, // preserve stable identity
        name: newName,
        target: newTarget,
        saved: newSaved,
        completion: updated.completion !== undefined ? updated.completion : oldGoal.completion,
        monthlyContribution:
          updated.monthlyContribution !== undefined
            ? Number(updated.monthlyContribution) >= 0
              ? Number(updated.monthlyContribution)
              : oldGoal.monthlyContribution
            : oldGoal.monthlyContribution,
        priority:
          updated.priority === 'High' || updated.priority === 'Medium' || updated.priority === 'Low'
            ? updated.priority
            : oldGoal.priority,
        targetDate: updated.targetDate !== undefined ? updated.targetDate : oldGoal.targetDate,
      }

      return {
        ...prev,
        goals: prev.goals.map((g, i) => (i === index ? sanitized : g)),
      }
    })
  }, [])

  const deleteGoal = useCallback((id: string) => {
    if (!id || typeof id !== 'string') return
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id),
    }))
  }, [])

  const contributeToGoal = useCallback((id: string, amount: number) => {
    const parsedAmount = Number(amount)
    if (
      !id ||
      typeof id !== 'string' ||
      Number.isNaN(parsedAmount) ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      console.warn('Invalid contributeToGoal call:', { id, amount })
      return
    }

    setState(prev => {
      const targetGoal = prev.goals.find(g => g.id === id)
      if (!targetGoal) return prev

      const actualTransfer = parsedAmount
      const nextGoals = prev.goals.map(g =>
        g.id === id ? { ...g, saved: g.saved + actualTransfer } : g
      )

      // Mathematical integrity: Transfer from liquid balance to goal reserves
      const nextBalance = Math.max(0, prev.balance - actualTransfer)
      const nextSafe = Math.max(0, prev.safeToSpend - actualTransfer)

      return {
        ...prev,
        balance: nextBalance,
        safeToSpend: nextSafe,
        goals: nextGoals,
      }
    })
  }, [])

  const withdrawFromGoal = useCallback((id: string, amount: number) => {
    const parsedAmount = Number(amount)
    if (
      !id ||
      typeof id !== 'string' ||
      Number.isNaN(parsedAmount) ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      console.warn('Invalid withdrawFromGoal call:', { id, amount })
      return
    }

    setState(prev => {
      const targetGoal = prev.goals.find(g => g.id === id)
      if (!targetGoal) return prev

      if (parsedAmount > targetGoal.saved) {
        console.warn('Cannot withdraw more than current saved amount:', {
          saved: targetGoal.saved,
          requested: parsedAmount,
        })
        return prev
      }

      const nextGoals = prev.goals.map(g =>
        g.id === id ? { ...g, saved: Math.max(0, g.saved - parsedAmount) } : g
      )

      // Mathematical integrity: Return allocated money back to liquid balance
      const nextBalance = prev.balance + parsedAmount
      const nextSafe = prev.safeToSpend + parsedAmount

      return {
        ...prev,
        balance: nextBalance,
        safeToSpend: nextSafe,
        goals: nextGoals,
      }
    })
  }, [])

  const addIncomeRecord = useCallback((record: IncomeRecord) => {
    const rawAmount = Number(record.amount)
    if (
      !record.source ||
      typeof record.source !== 'string' ||
      !record.source.trim() ||
      Number.isNaN(rawAmount) ||
      !Number.isFinite(rawAmount) ||
      rawAmount <= 0
    ) {
      console.warn('Invalid income record rejected in addIncomeRecord:', record)
      return
    }

    const sanitized: IncomeRecord = {
      id: record.id?.trim() || `income-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source: record.source.trim(),
      amount: rawAmount,
      expectedDate: record.expectedDate || new Date().toISOString().slice(0, 10),
      actualDate: record.actualDate,
      frequency: record.frequency || 'Monthly',
      status: record.status || 'EXPECTED',
    }

    setState(prev => {
      const totals = {
        balance: prev.balance,
        income: prev.income,
        monthlySpending: prev.monthlySpending,
        safeToSpend: prev.safeToSpend,
        financialHealth: prev.financialHealth,
      }

      applyIncomeRecordImpact(totals, sanitized)

      return {
        ...prev,
        ...totals,
        incomeRecords: [...prev.incomeRecords, sanitized],
      }
    })
  }, [])

  const updateIncomeRecord = useCallback((id: string, updated: Partial<IncomeRecord>) => {
    setState(prev => {
      const index = prev.incomeRecords.findIndex(r => r.id === id)
      if (index < 0) return prev

      const oldRecord = prev.incomeRecords[index]
      let newAmount = oldRecord.amount

      if (updated.amount !== undefined) {
        const parsedAmount = Number(updated.amount)
        if (Number.isNaN(parsedAmount) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          console.warn('Invalid amount passed to updateIncomeRecord:', updated.amount)
          return prev
        }
        newAmount = parsedAmount
      }

      const newRecord: IncomeRecord = {
        ...oldRecord,
        ...updated,
        id: oldRecord.id, // preserve stable identity
        source: updated.source !== undefined ? updated.source.trim() || oldRecord.source : oldRecord.source,
        amount: newAmount,
        expectedDate: updated.expectedDate !== undefined ? updated.expectedDate || oldRecord.expectedDate : oldRecord.expectedDate,
        actualDate: updated.actualDate !== undefined ? updated.actualDate : oldRecord.actualDate,
        frequency: updated.frequency !== undefined ? updated.frequency || oldRecord.frequency : oldRecord.frequency,
        status: updated.status !== undefined ? updated.status : oldRecord.status,
      }

      const totals = {
        balance: prev.balance,
        income: prev.income,
        monthlySpending: prev.monthlySpending,
        safeToSpend: prev.safeToSpend,
        financialHealth: prev.financialHealth,
      }

      // Step 1: reverse old impact
      reverseIncomeRecordImpact(totals, oldRecord)
      // Step 2: apply updated impact
      applyIncomeRecordImpact(totals, newRecord)

      const nextRecords = prev.incomeRecords.map((r, i) => (i === index ? newRecord : r))

      return {
        ...prev,
        ...totals,
        incomeRecords: nextRecords,
      }
    })
  }, [])

  const deleteIncomeRecord = useCallback((id: string) => {
    setState(prev => {
      const target = prev.incomeRecords.find(r => r.id === id)
      if (!target) return prev

      const totals = {
        balance: prev.balance,
        income: prev.income,
        monthlySpending: prev.monthlySpending,
        safeToSpend: prev.safeToSpend,
        financialHealth: prev.financialHealth,
      }

      // Reverse previous impact
      reverseIncomeRecordImpact(totals, target)

      return {
        ...prev,
        ...totals,
        incomeRecords: prev.incomeRecords.filter(r => r.id !== id),
      }
    })
  }, [])

  const addCommitment = useCallback((commitment: Commitment) => {
    const rawAmount = Number(commitment.amount)
    if (
      !commitment.name ||
      typeof commitment.name !== 'string' ||
      !commitment.name.trim() ||
      Number.isNaN(rawAmount) ||
      !Number.isFinite(rawAmount) ||
      rawAmount <= 0
    ) {
      console.warn('Invalid commitment rejected in addCommitment:', commitment)
      return
    }

    const sanitized: Commitment = {
      id: commitment.id?.trim() || `commitment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: commitment.name.trim(),
      amount: rawAmount,
      date: commitment.date?.trim() || new Date().toISOString().slice(0, 10),
      type: commitment.type?.trim() || 'Known expense',
    }

    setState(prev => ({
      ...prev,
      commitments: [...prev.commitments, sanitized],
    }))
  }, [])

  const updateCommitment = useCallback((id: string, updated: Partial<Commitment>) => {
    setState(prev => {
      const index = prev.commitments.findIndex(com => com.id === id)
      if (index < 0) return prev

      const oldRecord = prev.commitments[index]
      let newAmount = oldRecord.amount

      if (updated.amount !== undefined) {
        const parsedAmount = Number(updated.amount)
        if (Number.isNaN(parsedAmount) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          console.warn('Invalid amount passed to updateCommitment:', updated.amount)
          return prev
        }
        newAmount = parsedAmount
      }

      const newRecord: Commitment = {
        ...oldRecord,
        ...updated,
        id: oldRecord.id, // preserve stable identity
        name: updated.name !== undefined ? updated.name.trim() || oldRecord.name : oldRecord.name,
        amount: newAmount,
        date: updated.date !== undefined ? updated.date.trim() || oldRecord.date : oldRecord.date,
        type: updated.type !== undefined ? updated.type.trim() || oldRecord.type : oldRecord.type,
      }

      const nextCommitments = prev.commitments.map((c, i) => (i === index ? newRecord : c))

      return {
        ...prev,
        commitments: nextCommitments,
      }
    })
  }, [])

  const deleteCommitment = useCallback((id: string) => {
    setState(prev => {
      const target = prev.commitments.find(c => c.id === id)
      if (!target) return prev

      return {
        ...prev,
        commitments: prev.commitments.filter(c => c.id !== id),
      }
    })
  }, [])

  const addBudget = useCallback((category: string, amount: number) => {
    const trimmedCategory = typeof category === 'string' ? category.trim() : ''
    const rawAmount = Number(amount)
    if (!trimmedCategory || Number.isNaN(rawAmount) || !Number.isFinite(rawAmount) || rawAmount < 0) {
      console.warn('Invalid budget rejected in addBudget:', { category, amount })
      return
    }

    setState(prev => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [trimmedCategory]: rawAmount,
      },
    }))
  }, [])

  const updateBudget = useCallback((category: string, amount: number, newCategoryName?: string) => {
    const trimmedCategory = typeof category === 'string' ? category.trim() : ''
    const rawAmount = Number(amount)
    if (!trimmedCategory || Number.isNaN(rawAmount) || !Number.isFinite(rawAmount) || rawAmount < 0) {
      console.warn('Invalid amount passed to updateBudget:', { category, amount })
      return
    }

    setState(prev => {
      const trimmedNewName = newCategoryName ? newCategoryName.trim() : ''
      if (trimmedNewName && trimmedNewName !== trimmedCategory) {
        const nextBudgets: Record<string, number> = {}
        for (const [k, v] of Object.entries(prev.budgets)) {
          if (k === trimmedCategory) {
            nextBudgets[trimmedNewName] = rawAmount
          } else {
            nextBudgets[k] = v
          }
        }
        if (!(trimmedCategory in prev.budgets)) {
          nextBudgets[trimmedNewName] = rawAmount
        }
        return {
          ...prev,
          budgets: nextBudgets,
        }
      }

      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [trimmedCategory]: rawAmount,
        },
      }
    })
  }, [])

  const deleteBudget = useCallback((category: string) => {
    const trimmedCategory = typeof category === 'string' ? category.trim() : ''
    if (!trimmedCategory) return

    setState(prev => {
      if (!(trimmedCategory in prev.budgets)) return prev
      const nextBudgets = { ...prev.budgets }
      delete nextBudgets[trimmedCategory]
      return {
        ...prev,
        budgets: nextBudgets,
      }
    })
  }, [])

  const intelligence = useMemo<FinancialIntelligence>(() => {
    return calculateFinancialIntelligence(state)
  }, [state])

  const decisions = useMemo<FinancialDecision[]>(() => {
    return deriveAllDecisions(intelligence, state)
  }, [intelligence, state])

  const topDecisions = useMemo<FinancialDecision[]>(() => {
    return getRankedDecisions(intelligence, state, 5)
  }, [intelligence, state])

  const evaluatePurchase = useCallback(
    (input: PurchaseEvaluationInput): PurchaseDecisionResult => {
      return evaluatePurchaseDecision(input, intelligence, state)
    },
    [intelligence, state]
  )

  const askAdvisor = useCallback(
    (prompt: string): AdvisorResponse => {
      return generateAdvisorResponse(prompt, intelligence, state)
    },
    [intelligence, state]
  )

  const askAdvisorAsync = useCallback(
    async (
      prompt: string,
      history?: Array<{ from: string; text: string }>
    ): Promise<{ answer: string; isAI: boolean; grounded: boolean }> => {
      try {
        const response = await fetch('/api/advisor/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            intelligence,
            state,
            conversationHistory: history || [],
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.available && data.answer) {
            return {
              answer: data.answer,
              isAI: true,
              grounded: Boolean(data.grounded),
            }
          }
        }
      } catch (err) {
        console.warn('Backend AI advisor request error, falling back to deterministic engine:', err)
      }

      // Grounded deterministic fallback
      const fallback = generateAdvisorResponse(prompt, intelligence, state)
      return {
        answer: fallback.answer,
        isAI: false,
        grounded: true,
      }
    },
    [intelligence, state]
  )

  const simulateScenario = useCallback(
    (scenario: FinancialScenario): SimulationResult => {
      return simulateFinancialScenario(state, scenario)
    },
    [state]
  )

  const contextValue = useMemo<FinanceContextType>(
    () => ({
      state,
      intelligence,
      decisions,
      topDecisions,
      evaluatePurchase,
      askAdvisor,
      askAdvisorAsync,
      simulateScenario,
      setState,
      updateState,
      resetFinancialState,
      initializeUserFinancialProfile,
      loadUserOrDemoState,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      withdrawFromGoal,
      addIncomeRecord,
      updateIncomeRecord,
      deleteIncomeRecord,
      addCommitment,
      updateCommitment,
      deleteCommitment,
      addBudget,
      updateBudget,
      deleteBudget,
    }),
    [
      state,
      intelligence,
      decisions,
      topDecisions,
      evaluatePurchase,
      askAdvisor,
      askAdvisorAsync,
      simulateScenario,
      updateState,
      resetFinancialState,
      initializeUserFinancialProfile,
      loadUserOrDemoState,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      withdrawFromGoal,
      addIncomeRecord,
      updateIncomeRecord,
      deleteIncomeRecord,
      addCommitment,
      updateCommitment,
      deleteCommitment,
      addBudget,
      updateBudget,
      deleteBudget,
    ]
  )

  return <FinanceContext.Provider value={contextValue}>{children}</FinanceContext.Provider>
}

export function useFinance(): FinanceContextType {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}
