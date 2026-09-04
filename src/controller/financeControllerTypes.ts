export type RecordType = 'PAYMENT' | 'ORDER' | 'SETTLEMENT' | 'REFUND' | 'EXPENSE'

export type ReconciliationStatus = 'MATCHED' | 'EXCEPTION' | 'UNMATCHED' | 'RESOLVED'

export type ExceptionReason =
  | 'Amount mismatch'
  | 'Missing settlement'
  | 'Missing payment'
  | 'Duplicate record'
  | 'Date mismatch'
  | 'Status mismatch'

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ControllerRecord {
  id: string
  referenceId: string
  type: RecordType
  source: 'Razorpay Gateway' | 'Internal Order Ledger' | 'Bank Settlement (HDFC)' | 'Merchant Payout' | 'ERP Expense Ledger'
  amount: number
  date: string
  status: 'captured' | 'settled' | 'pending' | 'refunded' | 'failed'
  customerEmail?: string
  merchantId?: string
  description: string
  notes?: string
}

export interface ReconciliationException {
  id: string
  recordA: ControllerRecord
  recordB?: ControllerRecord
  reason: ExceptionReason
  severity: ExceptionSeverity
  expectedAmount: number
  actualAmount: number
  difference: number
  explanation: string
  status: 'OPEN' | 'REVIEWED' | 'RESOLVED'
  resolutionNote?: string
  reviewedAt?: string
}

export interface ReconciliationSummary {
  totalRecords: number
  matchedRecords: number
  unmatchedRecords: number
  exceptionRecords: number
  resolvedRecords: number
  matchRate: number
  exceptionRate: number
  totalProcessedVolume: number
  totalExceptionVolume: number
  status: 'COMPLETED' | 'RUNNING' | 'IDLE'
  lastReconciledAt: string
}
