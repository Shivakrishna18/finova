export type Goal = {
  id: string
  name: string
  saved: number
  target: number
  completion: string
  monthlyContribution?: number
  priority?: 'High' | 'Medium' | 'Low'
  targetDate?: string
}

export type Transaction = {
  id?: string
  name: string
  category: string
  amount: number
  date: string
}

export type DemoFinancialState = {
  balance: number
  income: number
  monthlySpending: number
  safeToSpend: number
  financialHealth: number
  goals: Goal[]
  upcoming: { name: string; amount: number; due: string }[]
  transactions: Transaction[]
  cashFlow: Record<string, { income: number; expenses: number; savings: number }[]>
  incomeRecords: { id: string; source: string; amount: number; expectedDate: string; actualDate?: string; frequency: string; status: 'RECEIVED' | 'EXPECTED' | 'DELAYED' | 'NOT RECEIVED' }[]
  commitments: { id: string; name: string; amount: number; date: string; type: string }[]
  budgets: Record<string, number>
}

export const demoFinancialState: DemoFinancialState = {
  balance: 124850,
  income: 86000,
  monthlySpending: 38420,
  safeToSpend: 14800,
  financialHealth: 82,
  goals: [
    { id: 'macbook', name: 'MacBook', saved: 92000, target: 150000, completion: '4 months' },
    { id: 'emergency', name: 'Emergency Fund', saved: 68000, target: 100000, completion: '2 months' },
    { id: 'travel', name: 'Travel', saved: 24000, target: 50000, completion: '5 months' },
  ],
  upcoming: [
    { name: 'Internet Bill', amount: 899, due: 'Due in 3 days' },
    { name: 'College Expense', amount: 4500, due: 'Due in 8 days' },
    { name: 'Insurance', amount: 2800, due: 'Due in 17 days' },
  ],
  transactions: [
    { id: 'tx-cafe', name: 'Campus Cafe', category: 'Food & Dining', amount: 420, date: 'Today' },
    { id: 'tx-metro', name: 'Metro Recharge', category: 'Transport', amount: 800, date: 'Yesterday' },
    { id: 'tx-cloud', name: 'Cloud Storage', category: 'Subscriptions', amount: 149, date: '18 Aug' },
    { id: 'tx-freelance', name: 'Freelance Income', category: 'Income', amount: 24000, date: '16 Aug' },
    { id: 'tx-bookstore', name: 'Bookstore', category: 'Education', amount: 1280, date: '14 Aug' },
  ],
  cashFlow: {
    '7D': [{ income: 0, expenses: 1800, savings: 0 }, { income: 24000, expenses: 2600, savings: 21400 }, { income: 0, expenses: 1100, savings: 20300 }, { income: 0, expenses: 2100, savings: 18200 }, { income: 0, expenses: 900, savings: 17300 }, { income: 0, expenses: 1500, savings: 15800 }, { income: 0, expenses: 1000, savings: 14800 }],
    '30D': [{ income: 86000, expenses: 21000, savings: 65000 }, { income: 0, expenses: 33000, savings: 32000 }, { income: 0, expenses: 22000, savings: 10000 }, { income: 0, expenses: 38420, savings: 14800 }],
    '90D': [{ income: 79000, expenses: 41000, savings: 38000 }, { income: 82000, expenses: 36000, savings: 46000 }, { income: 86000, expenses: 38420, savings: 47580 }],
    '1Y': [{ income: 72000, expenses: 43000, savings: 29000 }, { income: 78000, expenses: 39000, savings: 39000 }, { income: 86000, expenses: 38420, savings: 47580 }],
  },
  incomeRecords: [
    { id: 'salary-aug', source: 'Salary', amount: 62000, expectedDate: '2026-08-01', actualDate: '2026-08-01', frequency: 'Monthly', status: 'RECEIVED' },
    { id: 'freelance-aug', source: 'Freelance', amount: 24000, expectedDate: '2026-08-16', actualDate: '2026-08-16', frequency: 'Variable', status: 'RECEIVED' },
    { id: 'scholarship-sep', source: 'Scholarship', amount: 12000, expectedDate: '2026-09-05', frequency: 'Monthly', status: 'EXPECTED' },
    { id: 'allowance-sep', source: 'Allowance', amount: 8000, expectedDate: '2026-09-10', frequency: 'Monthly', status: 'EXPECTED' },
  ],
  commitments: [
    { id: 'rent', name: 'Rent', amount: 18000, date: '2026-09-01', type: 'Recurring payment' },
    { id: 'subscription', name: 'Subscriptions', amount: 1499, date: '2026-09-03', type: 'Recurring payment' },
    { id: 'insurance', name: 'Insurance', amount: 2800, date: '2026-09-10', type: 'Bill' },
    { id: 'education', name: 'Education', amount: 4500, date: '2026-09-15', type: 'Known expense' },
    { id: 'goal-contribution', name: 'Goal contribution', amount: 12000, date: '2026-09-20', type: 'Goal allocation' },
  ],
  budgets: { Food: 8000, Transport: 5000, Shopping: 7000, Entertainment: 4000, Education: 6000, Other: 5000 },
}

export const formatINR = (value: number) => `₹${value.toLocaleString('en-IN')}`

export function applyDemoTransaction(type: 'Income' | 'Expense' | 'Transfer', amount: number) {
  if (type === 'Income') {
    demoFinancialState.income += amount
    demoFinancialState.balance += amount
    demoFinancialState.safeToSpend += amount
  } else if (type === 'Expense') {
    demoFinancialState.monthlySpending += amount
    demoFinancialState.balance -= amount
    demoFinancialState.safeToSpend = Math.max(0, demoFinancialState.safeToSpend - amount)
    demoFinancialState.financialHealth = Math.max(0, demoFinancialState.financialHealth - (amount > 5000 ? 2 : 1))
  }
}
