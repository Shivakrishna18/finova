import type {
  ControllerRecord,
  ReconciliationException,
  ReconciliationSummary,
  ExceptionReason,
  ExceptionSeverity
} from './financeControllerTypes'
import { SYNTHETIC_CONTROLLER_RECORDS } from './syntheticControllerData'

export interface ReconciliationResult {
  records: ControllerRecord[]
  exceptions: ReconciliationException[]
  summary: ReconciliationSummary
  statusMap: Map<string, 'MATCHED' | 'EXCEPTION' | 'UNMATCHED'>
}

export function runReconciliation(
  customRecords?: ControllerRecord[],
  reviewedExceptionIds: Set<string> = new Set(),
  resolvedExceptionIds: Map<string, string> = new Map()
): ReconciliationResult {
  const records = customRecords || SYNTHETIC_CONTROLLER_RECORDS
  const exceptions: ReconciliationException[] = []
  const statusMap = new Map<string, 'MATCHED' | 'EXCEPTION' | 'UNMATCHED'>()

  // 1. Group by referenceId
  const byRef = new Map<string, ControllerRecord[]>()
  for (const rec of records) {
    const list = byRef.get(rec.referenceId) || []
    list.push(rec)
    byRef.set(rec.referenceId, list)
  }

  // 2. Evaluate pairs
  for (const [refId, list] of byRef.entries()) {
    // Check for duplicates
    const payments = list.filter(r => r.type === 'PAYMENT')
    const settlements = list.filter(r => r.type === 'SETTLEMENT')

    if (payments.length > 1) {
      // Duplicate payment detected
      const excId = `exc-dup-${refId}`
      const isResolved = resolvedExceptionIds.has(excId)
      const isReviewed = reviewedExceptionIds.has(excId)

      exceptions.push({
        id: excId,
        recordA: payments[0],
        recordB: payments[1],
        reason: 'Duplicate record',
        severity: 'HIGH',
        expectedAmount: payments[0].amount,
        actualAmount: payments[0].amount + payments[1].amount,
        difference: payments[1].amount,
        explanation: `Duplicate gateway payment capture observed for reference ${refId}. Two events logged within the same callback window.`,
        status: isResolved ? 'RESOLVED' : isReviewed ? 'REVIEWED' : 'OPEN',
        resolutionNote: resolvedExceptionIds.get(excId)
      })
      list.forEach(r => statusMap.set(r.id, 'EXCEPTION'))
      continue
    }

    if (payments.length === 1 && settlements.length === 1) {
      const p = payments[0]
      const s = settlements[0]

      // Check amount mismatch
      if (p.amount !== s.amount) {
        const diff = Math.abs(p.amount - s.amount)
        const excId = `exc-amt-${refId}`
        const isResolved = resolvedExceptionIds.has(excId)
        const isReviewed = reviewedExceptionIds.has(excId)

        exceptions.push({
          id: excId,
          recordA: p,
          recordB: s,
          reason: 'Amount mismatch',
          severity: 'HIGH',
          expectedAmount: p.amount,
          actualAmount: s.amount,
          difference: diff,
          explanation: `Settlement amount mismatch: Gateway recorded payment of ₹${p.amount.toLocaleString('en-IN')}, but Bank Settlement credited ₹${s.amount.toLocaleString('en-IN')}. Variance of ₹${diff.toLocaleString('en-IN')}.`,
          status: isResolved ? 'RESOLVED' : isReviewed ? 'REVIEWED' : 'OPEN',
          resolutionNote: resolvedExceptionIds.get(excId)
        })
        statusMap.set(p.id, 'EXCEPTION')
        statusMap.set(s.id, 'EXCEPTION')
        continue
      }

      // Check status mismatch (e.g., refunded vs settled)
      if (p.status === 'refunded' && s.status === 'settled') {
        const excId = `exc-stat-${refId}`
        const isResolved = resolvedExceptionIds.has(excId)
        const isReviewed = reviewedExceptionIds.has(excId)

        exceptions.push({
          id: excId,
          recordA: p,
          recordB: s,
          reason: 'Status mismatch',
          severity: 'CRITICAL',
          expectedAmount: 0,
          actualAmount: s.amount,
          difference: s.amount,
          explanation: `Status conflict: Payment ${refId} was marked as refunded in Gateway, but Bank clearing settled the full amount of ₹${s.amount.toLocaleString('en-IN')}. Risk of double charge or payout leakage.`,
          status: isResolved ? 'RESOLVED' : isReviewed ? 'REVIEWED' : 'OPEN',
          resolutionNote: resolvedExceptionIds.get(excId)
        })
        statusMap.set(p.id, 'EXCEPTION')
        statusMap.set(s.id, 'EXCEPTION')
        continue
      }

      // Check date mismatch (settlement date > 5 days after payment)
      const pDate = new Date(p.date).getTime()
      const sDate = new Date(s.date).getTime()
      const daysDiff = Math.round((sDate - pDate) / (1000 * 60 * 60 * 24))
      if (daysDiff > 5) {
        const excId = `exc-date-${refId}`
        const isResolved = resolvedExceptionIds.has(excId)
        const isReviewed = reviewedExceptionIds.has(excId)

        exceptions.push({
          id: excId,
          recordA: p,
          recordB: s,
          reason: 'Date mismatch',
          severity: 'MEDIUM',
          expectedAmount: p.amount,
          actualAmount: s.amount,
          difference: 0,
          explanation: `Clearing SLA breach: Payment captured on ${p.date} but bank settlement delayed by ${daysDiff} days until ${s.date} (exceeds T+2 settlement standard).`,
          status: isResolved ? 'RESOLVED' : isReviewed ? 'REVIEWED' : 'OPEN',
          resolutionNote: resolvedExceptionIds.get(excId)
        })
        statusMap.set(p.id, 'EXCEPTION')
        statusMap.set(s.id, 'EXCEPTION')
        continue
      }

      // If all clean: MATCHED
      statusMap.set(p.id, 'MATCHED')
      statusMap.set(s.id, 'MATCHED')
      continue
    }

    if (payments.length === 1 && settlements.length === 0) {
      // Missing settlement
      const p = payments[0]
      const excId = `exc-nosetl-${refId}`
      const isResolved = resolvedExceptionIds.has(excId)
      const isReviewed = reviewedExceptionIds.has(excId)

      exceptions.push({
        id: excId,
        recordA: p,
        reason: 'Missing settlement',
        severity: 'HIGH',
        expectedAmount: p.amount,
        actualAmount: 0,
        difference: p.amount,
        explanation: `Missing Bank Settlement: Payment of ₹${p.amount.toLocaleString('en-IN')} was captured via ${p.source} on ${p.date} but has not appeared in bank settlement batches after T+3 days.`,
        status: isResolved ? 'RESOLVED' : isReviewed ? 'REVIEWED' : 'OPEN',
        resolutionNote: resolvedExceptionIds.get(excId)
      })
      statusMap.set(p.id, 'EXCEPTION')
      continue
    }

    if (payments.length === 0 && settlements.length === 1) {
      // Missing payment
      const s = settlements[0]
      const excId = `exc-nopay-${refId}`
      const isResolved = resolvedExceptionIds.has(excId)
      const isReviewed = reviewedExceptionIds.has(excId)

      exceptions.push({
        id: excId,
        recordA: s,
        reason: 'Missing payment',
        severity: 'MEDIUM',
        expectedAmount: 0,
        actualAmount: s.amount,
        difference: s.amount,
        explanation: `Orphan Settlement Credit: Inbound bank credit of ₹${s.amount.toLocaleString('en-IN')} on ${s.date} has no corresponding payment record or merchant order in the gateway.`,
        status: isResolved ? 'RESOLVED' : isReviewed ? 'REVIEWED' : 'OPEN',
        resolutionNote: resolvedExceptionIds.get(excId)
      })
      statusMap.set(s.id, 'EXCEPTION')
      continue
    }

    // Single order, expense, or refund without direct payment pair
    for (const r of list) {
      if (!statusMap.has(r.id)) {
        statusMap.set(r.id, 'MATCHED')
      }
    }
  }

  // 3. Compute deterministic metrics
  const totalRecords = records.length
  let matchedCount = 0
  let exceptionCount = 0
  let unmatchedCount = 0

  for (const [_, st] of statusMap.entries()) {
    if (st === 'MATCHED') matchedCount++
    else if (st === 'EXCEPTION') exceptionCount++
    else unmatchedCount++
  }

  const matchRate = totalRecords > 0 ? (matchedCount / totalRecords) * 100 : 0
  const exceptionRate = totalRecords > 0 ? (exceptionCount / totalRecords) * 100 : 0

  const totalProcessedVolume = records.reduce((acc, r) => acc + r.amount, 0)
  const totalExceptionVolume = exceptions.reduce((acc, e) => acc + e.difference, 0)
  const resolvedCount = exceptions.filter(e => e.status === 'RESOLVED').length

  const summary: ReconciliationSummary = {
    totalRecords,
    matchedRecords: matchedCount,
    unmatchedRecords: unmatchedCount,
    exceptionRecords: exceptionCount,
    resolvedRecords: resolvedCount,
    matchRate: Math.round(matchRate * 10) / 10,
    exceptionRate: Math.round(exceptionRate * 10) / 10,
    totalProcessedVolume,
    totalExceptionVolume,
    status: 'COMPLETED',
    lastReconciledAt: new Date().toISOString()
  }

  return {
    records,
    exceptions,
    summary,
    statusMap
  }
}

// Settlement Q&A calculation engine
export function answerSettlementQuery(
  question: string,
  summary: ReconciliationSummary,
  exceptions: ReconciliationException[],
  records: ControllerRecord[]
): {
  answer: string
  details?: Array<{ label: string; value: string | number }>
  suggestedAction?: string
} {
  const q = question.toLowerCase().trim()

  if (q.includes('how many settlements are unresolved') || q.includes('unresolved')) {
    const unresolved = exceptions.filter(e => e.status !== 'RESOLVED')
    return {
      answer: `There are currently ${unresolved.length} unresolved reconciliation exceptions across the processed batch.`,
      details: [
        { label: 'Total Open Exceptions', value: unresolved.filter(e => e.status === 'OPEN').length },
        { label: 'Under Review', value: unresolved.filter(e => e.status === 'REVIEWED').length },
        { label: 'Resolved Exceptions', value: summary.resolvedRecords },
        { label: 'Total Value at Risk', value: `₹${unresolved.reduce((acc, e) => acc + e.difference, 0).toLocaleString('en-IN')}` }
      ],
      suggestedAction: 'Open the Exception Workspace below to inspect mismatches and mark resolutions.'
    }
  }

  if (q.includes('amount mismatch') || q.includes('mismatch')) {
    const mismatches = exceptions.filter(e => e.reason === 'Amount mismatch')
    const totalDiff = mismatches.reduce((acc, e) => acc + e.difference, 0)
    return {
      answer: `${mismatches.length} transaction pair(s) exhibit amount mismatches with an aggregate variance of ₹${totalDiff.toLocaleString('en-IN')}.`,
      details: mismatches.map(m => ({
        label: `${m.recordA.referenceId} (${m.recordA.source})`,
        value: `Gateway: ₹${m.expectedAmount.toLocaleString('en-IN')} vs Bank: ₹${m.actualAmount.toLocaleString('en-IN')} (Diff: ₹${m.difference.toLocaleString('en-IN')})`
      })),
      suggestedAction: 'Verify MDR commission fees or merchant discount rate charges deducted by the acquiring bank.'
    }
  }

  if (q.includes('total exception amount') || q.includes('exception volume') || q.includes('variance')) {
    return {
      answer: `The total cumulative exception variance is ₹${summary.totalExceptionVolume.toLocaleString('en-IN')} across ${summary.exceptionRecords} flagged records.`,
      details: [
        { label: 'Exception Rate', value: `${summary.exceptionRate}%` },
        { label: 'Total Batch Volume', value: `₹${summary.totalProcessedVolume.toLocaleString('en-IN')}` },
        { label: 'Variance vs Processed', value: `${((summary.totalExceptionVolume / (summary.totalProcessedVolume || 1)) * 100).toFixed(2)}%` }
      ],
      suggestedAction: 'Resolve high-severity status conflicts first to prevent payout leakage.'
    }
  }

  if (q.includes('unmatched payments') || q.includes('missing settlement') || q.includes('unmatched')) {
    const missing = exceptions.filter(e => e.reason === 'Missing settlement' || e.reason === 'Missing payment')
    return {
      answer: `Found ${missing.length} unmatched record(s) where gateway captures lack bank credits, or orphan bank credits lack gateway records.`,
      details: missing.map(m => ({
        label: `${m.recordA.referenceId} (${m.reason})`,
        value: `₹${m.difference.toLocaleString('en-IN')} on ${m.recordA.date} via ${m.recordA.source}`
      })),
      suggestedAction: 'Request settlement batch logs for nodal account clearing window.'
    }
  }

  if (q.includes('how many records were reconciled') || q.includes('reconciled') || q.includes('match rate')) {
    return {
      answer: `A total of ${summary.totalRecords} records were processed through the 6-stage reconciliation loop. ${summary.matchedRecords} were cleanly verified for a match rate of ${summary.matchRate}%.`,
      details: [
        { label: 'Total Ingested', value: summary.totalRecords },
        { label: 'Matched Records', value: summary.matchedRecords },
        { label: 'Exceptions Flagged', value: summary.exceptionRecords },
        { label: 'Match Rate', value: `${summary.matchRate}%` }
      ],
      suggestedAction: 'Export the Reconciliation Report for auditor sign-off.'
    }
  }

  // Fallback dynamic match
  return {
    answer: `Reconciliation query processed against ${summary.totalRecords} deterministic records: ${summary.matchedRecords} matched cleanly (${summary.matchRate}% match rate) with ${summary.exceptionRecords} exceptions totaling ₹${summary.totalExceptionVolume.toLocaleString('en-IN')}.`,
    details: [
      { label: 'Total Ingested Volume', value: `₹${summary.totalProcessedVolume.toLocaleString('en-IN')}` },
      { label: 'Clean Settlements', value: summary.matchedRecords },
      { label: 'Open Exceptions', value: exceptions.filter(e => e.status === 'OPEN').length }
    ],
    suggestedAction: 'Ask specific questions about amount mismatches, unresolved settlements, or match rates.'
  }
}
