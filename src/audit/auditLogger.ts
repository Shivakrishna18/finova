export type AuditEventType =
  | 'Transaction Created'
  | 'Transaction Updated'
  | 'Transaction Deleted'
  | 'Income Created'
  | 'Income Updated'
  | 'Income Deleted'
  | 'Budget Created'
  | 'Budget Updated'
  | 'Budget Deleted'
  | 'Goal Created'
  | 'Goal Updated'
  | 'Goal Contribution'
  | 'Goal Withdrawal'
  | 'Commitment Created'
  | 'Commitment Updated'
  | 'Commitment Deleted'
  | 'Bill Scanned'
  | 'Bill Confirmed'
  | 'Bill Rejected'
  | 'Purchase Scenario Evaluated'
  | 'Financial Report Generated'
  | 'Reconciliation Started'
  | 'Reconciliation Completed'
  | 'Reconciliation Exception'
  | 'Profile Updated'
  | 'Demo State Reset'

export interface AuditRecord {
  id: string
  timestamp: string
  eventType: AuditEventType
  category: 'TRANSACTION' | 'INCOME' | 'BUDGET' | 'GOAL' | 'COMMITMENT' | 'SCANNER' | 'SIMULATION' | 'RECONCILIATION' | 'SYSTEM'
  description: string
  source: 'MANUAL' | 'BILL SCANNER' | 'ENGINE' | 'CONTROLLER' | 'SIMULATOR' | 'DEMO'
  relatedEntity?: string
  amount?: number
  previousValue?: string | number
  newValue?: string | number
  severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'
  isDemo?: boolean
}

const AUDIT_STORAGE_KEY = 'finova-audit-trail-v1'

const INITIAL_DEMO_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    eventType: 'Reconciliation Completed',
    category: 'RECONCILIATION',
    description: 'Automated batch reconciliation of 64 transactions completed with 94.6% match rate.',
    source: 'CONTROLLER',
    relatedEntity: 'Batch #RZP-20260827',
    severity: 'SUCCESS',
    isDemo: true,
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    eventType: 'Reconciliation Exception',
    category: 'RECONCILIATION',
    description: 'Settlement amount mismatch detected on payment pay_N8s9A2k1: expected ₹7,200 vs actual ₹6,900.',
    source: 'CONTROLLER',
    relatedEntity: 'pay_N8s9A2k1',
    amount: 300,
    previousValue: '₹7,200',
    newValue: '₹6,900',
    severity: 'WARNING',
    isDemo: true,
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    eventType: 'Bill Confirmed',
    category: 'SCANNER',
    description: 'Smart bill receipt from Blue Tokai Coffee Roasters confirmed and committed.',
    source: 'BILL SCANNER',
    relatedEntity: 'Coffee & Bistro',
    amount: 480,
    severity: 'INFO',
    isDemo: true,
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    eventType: 'Goal Contribution',
    category: 'GOAL',
    description: 'Scheduled monthly contribution to Emergency Reserve.',
    source: 'ENGINE',
    relatedEntity: 'Emergency Reserve',
    amount: 5000,
    previousValue: '₹75,000',
    newValue: '₹80,000',
    severity: 'SUCCESS',
    isDemo: true,
  },
  {
    id: 'audit-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    eventType: 'Purchase Scenario Evaluated',
    category: 'SIMULATION',
    description: 'Simulated ₹50,000 laptop purchase evaluated as SAFE under current liquidity.',
    source: 'SIMULATOR',
    relatedEntity: 'MacBook Pro / Electronics',
    amount: 50000,
    severity: 'INFO',
    isDemo: true,
  },
  {
    id: 'audit-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    eventType: 'Financial Report Generated',
    category: 'SYSTEM',
    description: 'Monthly Financial Integrity & Health report compiled and exported.',
    source: 'ENGINE',
    relatedEntity: 'Monthly Report (August 2026)',
    severity: 'INFO',
    isDemo: true,
  },
  {
    id: 'audit-007',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    eventType: 'Transaction Created',
    category: 'TRANSACTION',
    description: 'Monthly broadband internet subscription payment recorded.',
    source: 'MANUAL',
    relatedEntity: 'Airtel Fiber Broadband',
    amount: 1199,
    severity: 'INFO',
    isDemo: true,
  },
  {
    id: 'audit-008',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    eventType: 'Income Created',
    category: 'INCOME',
    description: 'Primary salary income credited from Horizon Labs Inc.',
    source: 'MANUAL',
    relatedEntity: 'Horizon Labs Primary Salary',
    amount: 85000,
    severity: 'SUCCESS',
    isDemo: true,
  },
]

export function getStoredAuditLogs(): AuditRecord[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_AUDIT_LOGS
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_AUDIT_LOGS))
      return INITIAL_DEMO_AUDIT_LOGS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DEMO_AUDIT_LOGS
  } catch (err) {
    console.error('Failed reading audit logs:', err)
    return INITIAL_DEMO_AUDIT_LOGS
  }
}

export function logAuditEvent(
  record: Omit<AuditRecord, 'id' | 'timestamp'>
): AuditRecord {
  const newRecord: AuditRecord = {
    ...record,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  }

  if (typeof window !== 'undefined') {
    try {
      const current = getStoredAuditLogs()
      // Keep up to 500 audit records
      const updated = [newRecord, ...current].slice(0, 500)
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent('finova-audit-updated', { detail: newRecord }))
    } catch (err) {
      console.error('Failed saving audit record:', err)
    }
  }

  return newRecord
}

export function resetAuditLogsToDemo(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_AUDIT_LOGS))
      window.dispatchEvent(new CustomEvent('finova-audit-updated'))
    } catch (err) {
      console.error('Failed resetting audit logs:', err)
    }
  }
}
