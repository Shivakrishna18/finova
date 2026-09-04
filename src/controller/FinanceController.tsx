import React, { useState, useMemo } from 'react'
import {
  runReconciliation,
  answerSettlementQuery,
  type ReconciliationResult
} from './reconciliationEngine'
import type {
  ControllerRecord,
  ReconciliationException,
  ExceptionReason,
  ExceptionSeverity
} from './financeControllerTypes'
import { useFinance, formatINR } from '../finance/FinanceContext'
import { logAuditEvent } from '../audit/auditLogger'
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  CreditCard,
  FileText,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  Info
} from 'lucide-react'

export default function FinanceController() {
  const { state: finance } = useFinance()

  // Reconciliation state
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())
  const [resolvedMap, setResolvedMap] = useState<Map<string, string>>(new Map())
  const [isReconciling, setIsReconciling] = useState(false)

  // Modals & Inspect
  const [selectedException, setSelectedException] = useState<ReconciliationException | null>(null)
  const [resolutionInput, setResolutionInput] = useState('')

  // Q&A State
  const [activeQuestion, setActiveQuestion] = useState<string>('How many settlements are unresolved?')
  const [customQuery, setCustomQuery] = useState('')

  // Records Table Filter
  const [recordSearch, setRecordSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Run reconciliation
  const reconResult = useMemo<ReconciliationResult>(() => {
    return runReconciliation(undefined, reviewedIds, resolvedMap)
  }, [reviewedIds, resolvedMap])

  const { summary, exceptions, records, statusMap } = reconResult

  const triggerManualRecon = () => {
    setIsReconciling(true)
    logAuditEvent({
      eventType: 'Reconciliation Started',
      category: 'RECONCILIATION',
      description: `Manual reconciliation cycle started for ${records.length} records across 5 ledgers.`,
      source: 'CONTROLLER',
      relatedEntity: 'Razorpay Track 4 Engine',
      severity: 'INFO',
      isDemo: true
    })

    setTimeout(() => {
      setIsReconciling(false)
      logAuditEvent({
        eventType: 'Reconciliation Completed',
        category: 'RECONCILIATION',
        description: `Reconciliation cycle completed: ${summary.matchedRecords}/${summary.totalRecords} matched (${summary.matchRate}%).`,
        source: 'CONTROLLER',
        relatedEntity: 'Razorpay Track 4 Engine',
        severity: 'SUCCESS',
        isDemo: true
      })
    }, 600)
  }

  const handleMarkReviewed = (exc: ReconciliationException) => {
    const next = new Set(reviewedIds)
    next.add(exc.id)
    setReviewedIds(next)
    logAuditEvent({
      eventType: 'Reconciliation Exception',
      category: 'RECONCILIATION',
      description: `Exception ${exc.id} (${exc.reason}) marked as reviewed.`,
      source: 'CONTROLLER',
      relatedEntity: exc.recordA.referenceId,
      severity: 'INFO',
      isDemo: true
    })
    setSelectedException(null)
  }

  const handleResolveException = (exc: ReconciliationException) => {
    const note = resolutionInput.trim() || 'Variance accepted / manually balanced.'
    const next = new Map(resolvedMap)
    next.set(exc.id, note)
    setResolvedMap(next)
    setResolutionInput('')
    logAuditEvent({
      eventType: 'Reconciliation Exception',
      category: 'RECONCILIATION',
      description: `Exception ${exc.id} resolved: ${note}`,
      source: 'CONTROLLER',
      relatedEntity: exc.recordA.referenceId,
      severity: 'SUCCESS',
      isDemo: true
    })
    setSelectedException(null)
  }

  // Answer for Settlement Q&A
  const qaResult = useMemo(() => {
    return answerSettlementQuery(activeQuestion, summary, exceptions, records)
  }, [activeQuestion, summary, exceptions, records])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false
      const st = statusMap.get(r.id) || 'MATCHED'
      if (statusFilter !== 'ALL' && st !== statusFilter) return false
      if (recordSearch.trim()) {
        const q = recordSearch.toLowerCase()
        const matchRef = r.referenceId.toLowerCase().includes(q)
        const matchSource = r.source.toLowerCase().includes(q)
        const matchDesc = r.description.toLowerCase().includes(q)
        const matchEmail = (r.customerEmail || '').toLowerCase().includes(q)
        if (!matchRef && !matchSource && !matchDesc && !matchEmail) return false
      }
      return true
    })
  }, [records, typeFilter, statusFilter, recordSearch, statusMap])

  // Cash Position & Forecast calculations (Section 16)
  const currentCash = finance.balance
  const expectedIncome = finance.income
  const upcomingCommitments = finance.commitments.reduce((sum, c) => sum + c.amount, 0)
  const expectedDiscretionary = finance.monthlySpending
  const totalOutflows = upcomingCommitments + expectedDiscretionary
  const projectedPosition = currentCash + expectedIncome - totalOutflows

  return (
    <div className="workspace-page" style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Banner & Header */}
      <div className="page-intro" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="eyebrow" style={{ color: '#98111E', fontWeight: 700, letterSpacing: '0.12em' }}>
              FINOVA OS /// RAZORPAY TRACK 4
            </span>
            <span
              style={{
                fontSize: '10px',
                background: '#F8F4EC',
                border: '1px solid #DED4C5',
                color: '#756A60',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600
              }}
            >
              SYNTHETIC DEMO DATA
            </span>
          </div>
          <h1 style={{ fontSize: '30px', color: '#211A17', margin: '4px 0 6px 0', fontFamily: 'Manrope, sans-serif' }}>
            Finance Controller & Reconciliation Engine
          </h1>
          <p style={{ color: '#756A60', fontSize: '14px', maxWidth: '780px', margin: 0, lineHeight: 1.5 }}>
            Automated multi-source transaction ingestion, discrepancy detection, settlement reconciliation, and cash forecast for high-throughput merchants and enterprises.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={triggerManualRecon}
            disabled={isReconciling}
            className="soft-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              background: '#98111E',
              border: '1px solid #98111E',
              color: '#FFFDF8',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '8px',
              cursor: isReconciling ? 'not-allowed' : 'pointer'
            }}
          >
            <RotateCw size={14} className={isReconciling ? 'animate-spin' : ''} />
            {isReconciling ? 'Reconciling...' : 'Run Reconcile Cycle ↻'}
          </button>
        </div>
      </div>

      {/* Reconciliation Loop Stages Bar */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DED4C5',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '24px'
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontFamily: "'IBM Plex Mono', monospace",
            color: '#756A60',
            letterSpacing: '0.08em',
            display: 'block',
            marginBottom: '10px'
          }}
        >
          RECONCILIATION PIPELINE STATE
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          {['INGEST', 'NORMALIZE', 'MATCH', 'RECONCILE', 'EXCEPTIONS', 'EXPLAIN', 'REPORT'].map((stage, idx, arr) => (
            <React.Fragment key={stage}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#98111E',
                    color: '#FFFDF8',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 700
                  }}
                >
                  {idx + 1}
                </span>
                <strong style={{ fontSize: '12px', color: '#211A17', letterSpacing: '0.04em' }}>{stage}</strong>
              </div>
              {idx < arr.length - 1 && <ArrowRight size={14} color="#DED4C5" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '10px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
            RECORDS PROCESSED
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#211A17', marginTop: '6px', fontFamily: 'Manrope, sans-serif' }}>
            {summary.totalRecords}
          </div>
          <small style={{ color: '#756A60', fontSize: '11px' }}>5 Source Ledgers</small>
        </div>

        <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '10px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
            MATCH RATE
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#166534', marginTop: '6px', fontFamily: 'Manrope, sans-serif' }}>
            {summary.matchRate}%
          </div>
          <small style={{ color: '#166534', fontSize: '11px' }}>{summary.matchedRecords} clean settlements</small>
        </div>

        <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '10px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
            EXCEPTIONS
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: summary.exceptionRecords > 0 ? '#98111E' : '#211A17', marginTop: '6px', fontFamily: 'Manrope, sans-serif' }}>
            {summary.exceptionRecords}
          </div>
          <small style={{ color: '#98111E', fontSize: '11px' }}>{exceptions.filter(e => e.status === 'OPEN').length} requiring review</small>
        </div>

        <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '10px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
            EXCEPTION RATE
          </span>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#211A17', marginTop: '6px', fontFamily: 'Manrope, sans-serif' }}>
            {summary.exceptionRate}%
          </div>
          <small style={{ color: '#756A60', fontSize: '11px' }}>Variance: {formatINR(summary.totalExceptionVolume)}</small>
        </div>

        <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '10px', padding: '16px' }}>
          <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
            PROCESSING STATUS
          </span>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#166534', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#166534' }} />
            {summary.status}
          </div>
          <small style={{ color: '#756A60', fontSize: '11px' }}>Verified T+0</small>
        </div>
      </div>

      {/* Section 16: CASH POSITION & FORECAST */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DED4C5',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span className="panel-kicker" style={{ color: '#98111E' }}>SECTION 16 /// LIQUIDITY POSITION & CASH FORECAST</span>
            <h2 style={{ fontSize: '18px', color: '#211A17', margin: '4px 0', fontFamily: 'Manrope, sans-serif' }}>
              Multi-Horizon Cash Forecasting
            </h2>
            <p style={{ color: '#756A60', fontSize: '12px', margin: 0 }}>
              Deterministic integration between current reconciled liquidity, incoming receivables, and fixed obligations.
            </p>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: '#F8F4EC',
              border: '1px solid #DED4C5',
              fontSize: '11px',
              fontFamily: "'IBM Plex Mono', monospace",
              color: '#756A60'
            }}
          >
            END-OF-MONTH HORIZON
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div style={{ background: '#F8F4EC', padding: '14px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase' }}>CURRENT CASH</span>
              <span style={{ fontSize: '9px', background: '#DED4C5', color: '#211A17', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                ACTUAL
              </span>
            </div>
            <strong style={{ fontSize: '20px', color: '#211A17', display: 'block', marginTop: '6px', fontFamily: "'IBM Plex Mono', monospace" }}>
              {formatINR(currentCash)}
            </strong>
            <small style={{ color: '#756A60', fontSize: '11px' }}>Cleared bank balance</small>
          </div>

          <div style={{ background: '#F8F4EC', padding: '14px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase' }}>EXPECTED INCOME</span>
              <span style={{ fontSize: '9px', background: '#C8E6C9', color: '#1B5E20', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                EXPECTED
              </span>
            </div>
            <strong style={{ fontSize: '20px', color: '#166534', display: 'block', marginTop: '6px', fontFamily: "'IBM Plex Mono', monospace" }}>
              + {formatINR(expectedIncome)}
            </strong>
            <small style={{ color: '#756A60', fontSize: '11px' }}>Contracted salary/inflows</small>
          </div>

          <div style={{ background: '#F8F4EC', padding: '14px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase' }}>UPCOMING BILLS</span>
              <span style={{ fontSize: '9px', background: '#FFE082', color: '#B78103', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                EXPECTED
              </span>
            </div>
            <strong style={{ fontSize: '20px', color: '#98111E', display: 'block', marginTop: '6px', fontFamily: "'IBM Plex Mono', monospace" }}>
              − {formatINR(upcomingCommitments)}
            </strong>
            <small style={{ color: '#756A60', fontSize: '11px' }}>Rent, utilities, EMI commitments</small>
          </div>

          <div style={{ background: '#F8F4EC', padding: '14px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase' }}>EXPECTED OUTFLOWS</span>
              <span style={{ fontSize: '9px', background: '#FFE082', color: '#B78103', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                EXPECTED
              </span>
            </div>
            <strong style={{ fontSize: '20px', color: '#756A60', display: 'block', marginTop: '6px', fontFamily: "'IBM Plex Mono', monospace" }}>
              − {formatINR(expectedDiscretionary)}
            </strong>
            <small style={{ color: '#756A60', fontSize: '11px' }}>Living & discretionary forecast</small>
          </div>

          <div style={{ background: '#F8F4EC', padding: '14px', borderRadius: '8px', border: '1px solid #98111E' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#98111E', fontWeight: 700, textTransform: 'uppercase' }}>PROJECTED CASH</span>
              <span style={{ fontSize: '9px', background: '#98111E', color: '#FFFDF8', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                PROJECTED
              </span>
            </div>
            <strong style={{ fontSize: '20px', color: '#211A17', display: 'block', marginTop: '6px', fontFamily: "'IBM Plex Mono', monospace" }}>
              {formatINR(projectedPosition)}
            </strong>
            <small style={{ color: '#166534', fontSize: '11px' }}>Safe runway: {Math.max(1, Math.round(projectedPosition / (totalOutflows / 30 || 1)))} days</small>
          </div>
        </div>
      </div>

      {/* Section 15: SETTLEMENT Q&A */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DED4C5',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}
      >
        <div style={{ marginBottom: '14px' }}>
          <span className="panel-kicker" style={{ color: '#98111E' }}>SECTION 15 /// DETERMINISTIC SETTLEMENT Q&A</span>
          <h2 style={{ fontSize: '18px', color: '#211A17', margin: '4px 0', fontFamily: 'Manrope, sans-serif' }}>
            Automated Ledger Query Assistant
          </h2>
          <p style={{ color: '#756A60', fontSize: '12px', margin: 0 }}>
            Inspect settlement states and query reconciliation variances using real-time calculated responses.
          </p>
        </div>

        {/* Quick query presets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[
            'How many settlements are unresolved?',
            'Which transactions have amount mismatches?',
            'What is the total exception amount?',
            'Show unmatched payments.',
            'How many records were reconciled?'
          ].map(q => (
            <button
              key={q}
              onClick={() => setActiveQuestion(q)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                border: activeQuestion === q ? '1px solid #98111E' : '1px solid #DED4C5',
                background: activeQuestion === q ? '#98111E' : '#F8F4EC',
                color: activeQuestion === q ? '#FFFDF8' : '#211A17',
                fontWeight: 500,
                transition: 'all 0.15s ease'
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Answer card */}
        <div
          style={{
            background: '#F8F4EC',
            border: '1px solid #DED4C5',
            borderRadius: '10px',
            padding: '16px 20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", color: '#98111E', fontWeight: 700 }}>
              FINOVA RECON INTELLIGENCE:
            </span>
            <span style={{ fontSize: '11px', color: '#756A60' }}>
              Q: "{activeQuestion}"
            </span>
          </div>
          <p style={{ fontSize: '14px', color: '#211A17', margin: '0 0 12px 0', fontWeight: 600, lineHeight: 1.5 }}>
            {qaResult.answer}
          </p>

          {qaResult.details && qaResult.details.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginTop: '10px' }}>
              {qaResult.details.map((d, i) => (
                <div
                  key={i}
                  style={{
                    background: '#FFFDF8',
                    border: '1px solid #DED4C5',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px'
                  }}
                >
                  <span style={{ color: '#756A60', display: 'block', fontSize: '11px' }}>{d.label}</span>
                  <strong style={{ color: '#211A17', fontFamily: "'IBM Plex Mono', monospace" }}>{d.value}</strong>
                </div>
              ))}
            </div>
          )}

          {qaResult.suggestedAction && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#98111E', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} />
              <span>Recommended Action: {qaResult.suggestedAction}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 14: EXCEPTION BREAKDOWN & WORKSPACE */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DED4C5',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span className="panel-kicker" style={{ color: '#98111E' }}>SECTION 14 /// EXCEPTION WORKSPACE</span>
            <h2 style={{ fontSize: '18px', color: '#211A17', margin: '4px 0', fontFamily: 'Manrope, sans-serif' }}>
              Active Reconciliation Exceptions ({exceptions.length})
            </h2>
            <p style={{ color: '#756A60', fontSize: '12px', margin: 0 }}>
              Inspect side-by-side ledger variances, identify root causes, and resolve discrepancies without modifying source records.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {exceptions.map(exc => {
            const isResolved = exc.status === 'RESOLVED'
            const isReviewed = exc.status === 'REVIEWED'

            const sevBadge =
              exc.severity === 'CRITICAL'
                ? { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2' }
                : exc.severity === 'HIGH'
                ? { bg: '#FFF8E1', text: '#B78103', border: '#FFE082' }
                : { bg: '#E3F2FD', text: '#1565C0', border: '#BBDEFB' }

            return (
              <div
                key={exc.id}
                style={{
                  background: isResolved ? '#FDFBF7' : '#FFFDF8',
                  border: isResolved ? '1px solid #E8E2D8' : '1px solid #DED4C5',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 140px 120px',
                  gap: '16px',
                  alignItems: 'center',
                  opacity: isResolved ? 0.75 : 1
                }}
              >
                {/* Exception Type */}
                <div>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: sevBadge.bg,
                      color: sevBadge.text,
                      border: `1px solid ${sevBadge.border}`,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      display: 'inline-block',
                      marginBottom: '4px'
                    }}
                  >
                    {exc.severity}
                  </span>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#211A17' }}>{exc.reason}</strong>
                  <span style={{ fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", color: '#756A60' }}>
                    {exc.recordA.referenceId}
                  </span>
                </div>

                {/* Explanation */}
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#211A17', lineHeight: 1.4 }}>
                    {exc.explanation}
                  </p>
                  {exc.resolutionNote && (
                    <small style={{ display: 'block', marginTop: '4px', color: '#166534', fontWeight: 600 }}>
                      ✓ Resolution: {exc.resolutionNote}
                    </small>
                  )}
                </div>

                {/* Amounts */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#756A60', display: 'block' }}>
                    Exp: {formatINR(exc.expectedAmount)}
                  </span>
                  <span style={{ fontSize: '11px', color: '#756A60', display: 'block' }}>
                    Act: {formatINR(exc.actualAmount)}
                  </span>
                  <strong style={{ fontSize: '13px', color: '#98111E', fontFamily: "'IBM Plex Mono', monospace" }}>
                    Diff: {formatINR(exc.difference)}
                  </strong>
                </div>

                {/* Action button */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedException(exc)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      background: '#F8F4EC',
                      border: '1px solid #DED4C5',
                      borderRadius: '6px',
                      color: '#211A17',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {isResolved ? 'Inspect ✓' : isReviewed ? 'Reviewed 🔍' : 'Resolve ↗'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Exception Inspection Modal */}
      {selectedException && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(33, 26, 23, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setSelectedException(null)}
        >
          <div
            style={{
              background: '#FFFDF8',
              border: '1px solid #DED4C5',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span className="panel-kicker" style={{ color: '#98111E' }}>INSPECT RECONCILIATION EXCEPTION</span>
                <h3 style={{ fontSize: '18px', color: '#211A17', margin: '4px 0', fontFamily: 'Manrope, sans-serif' }}>
                  {selectedException.reason} — {selectedException.recordA.referenceId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedException(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#756A60' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#756A60', marginBottom: '16px', lineHeight: 1.5 }}>
              {selectedException.explanation}
            </p>

            {/* Side by side comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: '#F8F4EC', padding: '12px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
                <span style={{ fontSize: '10px', color: '#98111E', fontWeight: 700, textTransform: 'uppercase' }}>
                  SOURCE A: {selectedException.recordA.source}
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#211A17', margin: '4px 0', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatINR(selectedException.recordA.amount)}
                </div>
                <small style={{ color: '#756A60', fontSize: '11px', display: 'block' }}>Date: {selectedException.recordA.date}</small>
                <small style={{ color: '#756A60', fontSize: '11px', display: 'block' }}>Status: {selectedException.recordA.status}</small>
                <small style={{ color: '#756A60', fontSize: '11px', display: 'block' }}>{selectedException.recordA.description}</small>
              </div>

              <div style={{ background: '#F8F4EC', padding: '12px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
                <span style={{ fontSize: '10px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>
                  SOURCE B: {selectedException.recordB ? selectedException.recordB.source : 'Not Present in Ledger'}
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#211A17', margin: '4px 0', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {selectedException.recordB ? formatINR(selectedException.recordB.amount) : '₹0 (Missing)'}
                </div>
                <small style={{ color: '#756A60', fontSize: '11px', display: 'block' }}>Date: {selectedException.recordB ? selectedException.recordB.date : '—'}</small>
                <small style={{ color: '#756A60', fontSize: '11px', display: 'block' }}>Status: {selectedException.recordB ? selectedException.recordB.status : 'Missing'}</small>
                <small style={{ color: '#756A60', fontSize: '11px', display: 'block' }}>{selectedException.recordB ? selectedException.recordB.description : 'Unsettled credit'}</small>
              </div>
            </div>

            {/* Resolution Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#211A17', fontWeight: 600, marginBottom: '6px' }}>
                Resolution / Auditor Note
              </label>
              <input
                type="text"
                placeholder="e.g. Bank MDR fee deduction verified; adjusted in ledger."
                value={resolutionInput}
                onChange={e => setResolutionInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#F8F4EC',
                  border: '1px solid #DED4C5',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#211A17',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => handleMarkReviewed(selectedException)}
                style={{
                  padding: '8px 14px',
                  background: '#F8F4EC',
                  border: '1px solid #DED4C5',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#211A17',
                  cursor: 'pointer'
                }}
              >
                Mark as Reviewed
              </button>
              <button
                onClick={() => handleResolveException(selectedException)}
                style={{
                  padding: '8px 16px',
                  background: '#98111E',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#FFFDF8',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Resolve Exception ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ingested Records Ledger Table */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DED4C5',
          borderRadius: '12px',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span className="panel-kicker" style={{ color: '#98111E' }}>INGESTED LEDGER AUDIT</span>
            <h2 style={{ fontSize: '18px', color: '#211A17', margin: '4px 0', fontFamily: 'Manrope, sans-serif' }}>
              Multi-Source Records ({filteredRecords.length} / {records.length})
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#756A60' }} />
              <input
                type="text"
                placeholder="Search reference, email, source..."
                value={recordSearch}
                onChange={e => setRecordSearch(e.target.value)}
                style={{
                  padding: '7px 10px 7px 30px',
                  background: '#F8F4EC',
                  border: '1px solid #DED4C5',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#211A17',
                  outline: 'none',
                  minWidth: '200px'
                }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                background: '#F8F4EC',
                border: '1px solid #DED4C5',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#211A17',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Types</option>
              <option value="PAYMENT">Payments</option>
              <option value="SETTLEMENT">Settlements</option>
              <option value="ORDER">Orders</option>
              <option value="REFUND">Refunds</option>
              <option value="EXPENSE">Expenses</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                background: '#F8F4EC',
                border: '1px solid #DED4C5',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#211A17',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Reconciliation States</option>
              <option value="MATCHED">Matched</option>
              <option value="EXCEPTION">Exception</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #DED4C5', textAlign: 'left', color: '#756A60' }}>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>REFERENCE ID</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>SOURCE LEDGER</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>TYPE</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>DATE</th>
                <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>AMOUNT</th>
                <th style={{ padding: '10px 12px', fontWeight: 600 }}>RECON STATE</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(rec => {
                const st = statusMap.get(rec.id) || 'MATCHED'
                return (
                  <tr
                    key={rec.id}
                    style={{
                      borderBottom: '1px solid #F3EDE3',
                      color: '#211A17'
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
                      {rec.referenceId}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: '#211A17' }}>{rec.source}</span>
                      <small style={{ display: 'block', color: '#756A60', fontSize: '11px' }}>{rec.description}</small>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#F8F4EC',
                          border: '1px solid #DED4C5',
                          fontWeight: 600
                        }}
                      >
                        {rec.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: "'IBM Plex Mono', monospace", color: '#756A60' }}>
                      {rec.date}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>
                      {formatINR(rec.amount)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          background: st === 'MATCHED' ? '#E8F5E9' : '#FFEBEE',
                          color: st === 'MATCHED' ? '#1B5E20' : '#C62828',
                          border: st === 'MATCHED' ? '1px solid #C8E6C9' : '1px solid #FFCDD2'
                        }}
                      >
                        {st === 'MATCHED' ? '✓ MATCHED' : '⚠ EXCEPTION'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
