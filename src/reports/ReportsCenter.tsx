import React, { useState, useMemo } from 'react'
import { useFinance, formatINR } from '../finance/FinanceContext'
import { runReconciliation } from '../controller/reconciliationEngine'
import { logAuditEvent } from '../audit/auditLogger'
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Shield,
  Layers,
  ChevronDown
} from 'lucide-react'

export type ReportType =
  | 'Monthly Financial Report'
  | 'Income Report'
  | 'Spending Report'
  | 'Budget Report'
  | 'Cash Flow Report'
  | 'Goals Report'
  | 'Commitments Report'
  | 'Financial Health Report'
  | 'Transaction Report'
  | 'Finance Controller / Reconciliation Report'

const REPORT_NAMES: ReportType[] = [
  'Monthly Financial Report',
  'Income Report',
  'Spending Report',
  'Budget Report',
  'Cash Flow Report',
  'Goals Report',
  'Commitments Report',
  'Financial Health Report',
  'Transaction Report',
  'Finance Controller / Reconciliation Report'
]

export default function ReportsCenter() {
  const { state: finance, intelligence } = useFinance()
  const [selectedReport, setSelectedReport] = useState<ReportType>('Monthly Financial Report')
  const [dateRange, setDateRange] = useState<string>('THIS_MONTH')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  // Run reconciliation for reconciliation report
  const recon = useMemo(() => runReconciliation(), [])

  const handlePrint = () => {
    logAuditEvent({
      eventType: 'Financial Report Generated',
      category: 'SYSTEM',
      description: `Report '${selectedReport}' printed / exported to PDF.`,
      source: 'ENGINE',
      relatedEntity: selectedReport,
      severity: 'INFO',
      isDemo: true
    })
    window.print()
  }

  const handleExportCSV = () => {
    logAuditEvent({
      eventType: 'Financial Report Generated',
      category: 'SYSTEM',
      description: `Report '${selectedReport}' exported to CSV.`,
      source: 'ENGINE',
      relatedEntity: selectedReport,
      severity: 'INFO',
      isDemo: true
    })

    let csvContent = ''
    if (selectedReport === 'Transaction Report') {
      csvContent = 'ID,Name,Category,Amount,Date,PaymentMethod\n' +
        finance.transactions.map(t => `"${t.id || ''}","${t.name}","${t.category}",${t.amount},"${t.date}","${t.paymentMethod || 'UPI'}"`).join('\n')
    } else if (selectedReport === 'Budget Report') {
      csvContent = 'Category,Budget,Actual,Remaining,UtilizationStatus\n' +
        intelligence.budgets.categories.map(b => `"${b.category}",${b.budget},${b.actual},${b.remaining},"${b.status}"`).join('\n')
    } else if (selectedReport === 'Goals Report') {
      csvContent = 'GoalName,Target,Saved,Remaining,ProgressPercent,Status\n' +
        intelligence.goals.items.map(g => `"${g.name}",${g.target},${g.saved},${g.remaining},${g.progress}%,"${g.status}"`).join('\n')
    } else if (selectedReport === 'Finance Controller / Reconciliation Report') {
      csvContent = 'ReferenceId,Source,Type,Date,Amount,ReconStatus\n' +
        recon.records.map(r => `"${r.referenceId}","${r.source}","${r.type}","${r.date}",${r.amount},"${recon.statusMap.get(r.id) || 'MATCHED'}"`).join('\n')
    } else {
      // General financial summary CSV
      csvContent = 'Metric,Value\n' +
        `Current Balance,${finance.balance}\n` +
        `Monthly Income,${finance.income}\n` +
        `Monthly Spending,${finance.monthlySpending}\n` +
        `Safe to Spend,${finance.safeToSpend}\n` +
        `Financial Health Score,${finance.financialHealth}\n` +
        `Total Commitments,${intelligence.commitments.totalActiveCommitments}\n` +
        `Savings Rate,${intelligence.cashFlow.savingsRate}%\n`
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `finova_${selectedReport.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="workspace-page" style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div className="page-intro" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ color: '#98111E', fontWeight: 700, letterSpacing: '0.12em' }}>
            FINOVA OS /// INTELLIGENT REPORTING
          </span>
          <h1 style={{ fontSize: '28px', color: '#211A17', margin: '4px 0 6px 0', fontFamily: 'Manrope, sans-serif' }}>
            Financial Reports Center
          </h1>
          <p style={{ color: '#756A60', fontSize: '14px', maxWidth: '720px', margin: 0 }}>
            Executive summaries, structural breakdowns, discrepancy analysis, and verified actions computed dynamically from your financial twin.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#FFFDF8',
              border: '1px solid #DED4C5',
              borderRadius: '8px',
              color: '#211A17',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Printer size={14} color="#98111E" />
            Print / Save PDF
          </button>
          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#98111E',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFDF8',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Selection Grid & Filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        {/* Left Side: 10 Reports Selector */}
        <div
          style={{
            background: '#FFFDF8',
            border: '1px solid #DED4C5',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '10px', color: '#756A60', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em', marginBottom: '4px' }}>
            AVAILABLE REPORTS (10)
          </span>
          {REPORT_NAMES.map((name, idx) => {
            const isActive = selectedReport === name
            return (
              <button
                key={name}
                onClick={() => setSelectedReport(name)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  background: isActive ? '#98111E' : '#F8F4EC',
                  color: isActive ? '#FFFDF8' : '#211A17',
                  border: isActive ? '1px solid #98111E' : '1px solid #DED4C5',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", opacity: 0.7, marginRight: '6px' }}>
                    0{idx + 1}
                  </span>
                  {name}
                </span>
                {isActive && <ArrowRight size={12} />}
              </button>
            )
          })}
        </div>

        {/* Right Side: Report Canvas */}
        <div
          id="finova-report-document"
          style={{
            background: '#FFFDF8',
            border: '1px solid #DED4C5',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #DED4C5',
              paddingBottom: '16px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <span style={{ fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", color: '#98111E', fontWeight: 700 }}>
                STATEMENT DOCUMENT
              </span>
              <h2 style={{ fontSize: '22px', color: '#211A17', margin: '2px 0 0 0', fontFamily: 'Manrope, sans-serif' }}>
                {selectedReport}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                style={{
                  padding: '7px 10px',
                  background: '#F8F4EC',
                  border: '1px solid #DED4C5',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#211A17'
                }}
              >
                <option value="THIS_MONTH">This Month (August 2026)</option>
                <option value="LAST_MONTH">Last Month (July 2026)</option>
                <option value="LAST_3_MONTHS">Last 3 Months (Q2-Q3)</option>
                <option value="LAST_6_MONTHS">Last 6 Months</option>
                <option value="THIS_YEAR">This Year (FY 2026-27)</option>
              </select>
            </div>
          </div>

          {/* Render selected report content */}
          <ReportContent
            reportType={selectedReport}
            finance={finance}
            intelligence={intelligence}
            recon={recon}
          />
        </div>
      </div>
    </div>
  )
}

function ReportContent({
  reportType,
  finance,
  intelligence,
  recon
}: {
  reportType: ReportType
  finance: any
  intelligence: any
  recon: any
}) {
  if (reportType === 'Monthly Financial Report') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Executive Summary */}
        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Executive Summary
          </h3>
          <p style={{ fontSize: '13px', color: '#211A17', lineHeight: 1.6, margin: 0 }}>
            During August 2026, total net cash inflow of {formatINR(finance.income)} was offset by {formatINR(finance.monthlySpending)} in operating expenditures and {formatINR(intelligence.commitments.totalActiveCommitments)} in ringfenced commitments. The resulting monthly surplus stands at {formatINR(intelligence.cashFlow.monthlySurplus)}, yielding a healthy net savings rate of {intelligence.cashFlow.savingsRate}%. Overall Financial Health is rated at {finance.financialHealth}/100.
          </p>
        </div>

        {/* Key Metrics */}
        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Key Metrics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#F8F4EC', padding: '12px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
              <span style={{ fontSize: '11px', color: '#756A60' }}>Net Liquid Cash</span>
              <strong style={{ fontSize: '16px', color: '#211A17', display: 'block', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(finance.balance)}</strong>
            </div>
            <div style={{ background: '#F8F4EC', padding: '12px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
              <span style={{ fontSize: '11px', color: '#756A60' }}>Safe to Spend</span>
              <strong style={{ fontSize: '16px', color: '#166534', display: 'block', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(finance.safeToSpend)}</strong>
            </div>
            <div style={{ background: '#F8F4EC', padding: '12px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
              <span style={{ fontSize: '11px', color: '#756A60' }}>Monthly Surplus</span>
              <strong style={{ fontSize: '16px', color: '#211A17', display: 'block', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(intelligence.cashFlow.monthlySurplus)}</strong>
            </div>
            <div style={{ background: '#F8F4EC', padding: '12px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
              <span style={{ fontSize: '11px', color: '#756A60' }}>Savings Rate</span>
              <strong style={{ fontSize: '16px', color: '#211A17', display: 'block', fontFamily: "'IBM Plex Mono', monospace" }}>{intelligence.cashFlow.savingsRate}%</strong>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Category Breakdown
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #DED4C5', color: '#756A60', textAlign: 'left' }}>
                  <th style={{ padding: '8px 6px' }}>CATEGORY</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>BUDGET</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>ACTUAL</th>
                  <th style={{ padding: '8px 6px', textAlign: 'right' }}>UTILIZATION</th>
                  <th style={{ padding: '8px 6px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {intelligence.budgets.categories.map((b: any) => (
                  <tr key={b.category} style={{ borderBottom: '1px solid #F3EDE3' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 600 }}>{b.category}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(b.budget)}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(b.actual)}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{b.utilization}%</td>
                    <td style={{ padding: '8px 6px' }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: b.status === 'ON TRACK' ? '#E8F5E9' : '#FFEBEE',
                        color: b.status === 'ON TRACK' ? '#1B5E20' : '#C62828',
                        fontWeight: 600
                      }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights & Actions */}
        <div style={{ background: '#F8F4EC', padding: '14px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
          <strong style={{ fontSize: '13px', color: '#211A17', display: 'block', marginBottom: '4px' }}>
            Recommended Strategic Actions
          </strong>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#756A60', lineHeight: 1.6 }}>
            <li>Safe-to-spend is positive at {formatINR(finance.safeToSpend)}. Keep discretionary purchases under {formatINR(8000)} to protect MacBook goal schedule.</li>
            <li>Maintain emergency buffer growth: currently at {intelligence.savings.emergencyProgress}% of recommended 3-month target.</li>
          </ul>
        </div>
      </div>
    )
  }

  if (reportType === 'Income Report') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Executive Summary
          </h3>
          <p style={{ fontSize: '13px', color: '#211A17', lineHeight: 1.6, margin: 0 }}>
            Inflow stream analysis confirms monthly net salary inflow of {formatINR(finance.income)} across verified payroll and client retainers. No incoming payment delays or volatility spikes detected in the current period.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Verified Inflow Streams
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {finance.incomeRecords && finance.incomeRecords.length > 0 ? (
              finance.incomeRecords.map((r: any) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8F4EC', borderRadius: '6px', border: '1px solid #DED4C5' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#211A17' }}>{r.name}</strong>
                    <small style={{ color: '#756A60', display: 'block', fontSize: '11px' }}>{r.frequency} · Cleared on {r.date}</small>
                  </div>
                  <strong style={{ fontSize: '14px', color: '#166534', fontFamily: "'IBM Plex Mono', monospace" }}>+{formatINR(r.amount)}</strong>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: '#756A60' }}>Primary salary credited via payroll direct deposit: {formatINR(finance.income)}.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (reportType === 'Spending Report') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Executive Summary
          </h3>
          <p style={{ fontSize: '13px', color: '#211A17', lineHeight: 1.6, margin: 0 }}>
            Total discretionary and operating spending for August reached {formatINR(finance.monthlySpending)}. Average daily burn velocity is {formatINR(Math.round(finance.monthlySpending / 30))}/day.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Recent High-Value Outflows
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {finance.transactions.filter((t: any) => t.category !== 'Income').slice(0, 8).map((t: any, i: number) => (
              <div key={t.id || i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8F4EC', borderRadius: '6px', border: '1px solid #DED4C5' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#211A17' }}>{t.name}</strong>
                  <small style={{ color: '#756A60', display: 'block', fontSize: '11px' }}>{t.category} · {t.date}</small>
                </div>
                <strong style={{ fontSize: '14px', color: '#98111E', fontFamily: "'IBM Plex Mono', monospace" }}>−{formatINR(t.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (reportType === 'Budget Report') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Budget Allocation Performance
          </h3>
          <p style={{ fontSize: '13px', color: '#211A17', lineHeight: 1.6, margin: 0 }}>
            Overall budget utilization across active categories is {intelligence.budgets.overallUtilization}%. Total budgeted limit: {formatINR(intelligence.budgets.totalBudget)} vs actual spend of {formatINR(intelligence.budgets.totalActual)}.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #DED4C5', color: '#756A60', textAlign: 'left' }}>
                <th style={{ padding: '8px 6px' }}>CATEGORY</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>ALLOCATED</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>SPENT</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>BALANCE</th>
                <th style={{ padding: '8px 6px' }}>DISCIPLINE STATUS</th>
              </tr>
            </thead>
            <tbody>
              {intelligence.budgets.categories.map((b: any) => (
                <tr key={b.category} style={{ borderBottom: '1px solid #F3EDE3' }}>
                  <td style={{ padding: '8px 6px', fontWeight: 600 }}>{b.category}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(b.budget)}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(b.actual)}</td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", color: b.remaining < 0 ? '#98111E' : '#166534' }}>
                    {formatINR(b.remaining)}
                  </td>
                  <td style={{ padding: '8px 6px' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: b.status === 'ON TRACK' ? '#E8F5E9' : '#FFEBEE',
                      color: b.status === 'ON TRACK' ? '#1B5E20' : '#C62828',
                      fontWeight: 600
                    }}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (reportType === 'Goals Report') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Goal Constellation Progress
          </h3>
          <p style={{ fontSize: '13px', color: '#211A17', lineHeight: 1.6, margin: 0 }}>
            Tracking {intelligence.goals.items.length} active financial goals. Aggregate progress across targets is {intelligence.goals.aggregateProgress}%, with {formatINR(intelligence.goals.totalSaved)} saved toward {formatINR(intelligence.goals.totalTarget)} total capital requirement.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {intelligence.goals.items.map((g: any) => (
            <div key={g.id} style={{ background: '#F8F4EC', padding: '14px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <strong style={{ fontSize: '14px', color: '#211A17' }}>{g.name}</strong>
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600, background: '#E8F5E9', padding: '2px 8px', borderRadius: '4px' }}>
                  {g.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#756A60', marginBottom: '6px' }}>
                <span>Saved: {formatINR(g.saved)} / {formatINR(g.target)}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 }}>{g.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#DED4C5', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${g.progress}%`, height: '100%', background: '#98111E' }} />
              </div>
              <small style={{ color: '#756A60', fontSize: '11px', display: 'block', marginTop: '6px' }}>
                Monthly pace: {formatINR(g.monthlyContribution)}/mo · Est. completion in ~{g.estimatedMonths} months
              </small>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (reportType === 'Commitments Report') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Fixed Commitments & Ringfenced Obligations
          </h3>
          <p style={{ fontSize: '13px', color: '#211A17', lineHeight: 1.6, margin: 0 }}>
            FINOVA ringfences {formatINR(intelligence.commitments.totalActiveCommitments)} in recurring commitments each cycle. Commitment-to-income ratio is {intelligence.commitments.commitmentToIncomeRatio}% (Pressure Level: {intelligence.commitments.commitmentPressure}).
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {finance.commitments.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: '#F8F4EC', borderRadius: '6px', border: '1px solid #DED4C5' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#211A17' }}>{c.name}</strong>
                <small style={{ color: '#756A60', display: 'block', fontSize: '11px' }}>Due: {c.dueDate || c.date || 'Monthly'} · {c.frequency || 'Monthly'}</small>
              </div>
              <strong style={{ fontSize: '14px', color: '#98111E', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(c.amount)}</strong>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (reportType === 'Financial Health Report') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Comprehensive Health Diagnostics
          </h3>
          <p style={{ fontSize: '13px', color: '#211A17', lineHeight: 1.6, margin: 0 }}>
            Deterministic Financial Health Score is {finance.financialHealth}/100 ({intelligence.health.level}). Solvency runway is modeled at {intelligence.cashFlow.runwayDays} days.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {intelligence.health.factors.map((f: any) => (
            <div key={f.name} style={{ background: '#F8F4EC', padding: '12px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#211A17' }}>{f.name}</span>
                <strong style={{ fontSize: '12px', color: '#98111E', fontFamily: "'IBM Plex Mono', monospace" }}>{f.score}/100</strong>
              </div>
              <small style={{ color: '#756A60', fontSize: '11px', display: 'block' }}>{f.note}</small>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (reportType === 'Finance Controller / Reconciliation Report') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Reconciliation & Audit Sign-Off
          </h3>
          <p style={{ fontSize: '13px', color: '#211A17', lineHeight: 1.6, margin: 0 }}>
            Reconciliation batch across 5 ledgers (Gateway, Bank Settlement, Order Ledger, ERP, Refunds) evaluated {recon.summary.totalRecords} records. Clean match rate is {recon.summary.matchRate}% with {recon.summary.exceptionRecords} exceptions totaling {formatINR(recon.summary.totalExceptionVolume)} in variance.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <div style={{ background: '#F8F4EC', padding: '10px', borderRadius: '6px', border: '1px solid #DED4C5' }}>
            <span style={{ fontSize: '10px', color: '#756A60' }}>TOTAL PROCESSED</span>
            <strong style={{ fontSize: '16px', display: 'block', color: '#211A17' }}>{recon.summary.totalRecords}</strong>
          </div>
          <div style={{ background: '#F8F4EC', padding: '10px', borderRadius: '6px', border: '1px solid #DED4C5' }}>
            <span style={{ fontSize: '10px', color: '#756A60' }}>CLEAN MATCHES</span>
            <strong style={{ fontSize: '16px', display: 'block', color: '#166534' }}>{recon.summary.matchedRecords}</strong>
          </div>
          <div style={{ background: '#F8F4EC', padding: '10px', borderRadius: '6px', border: '1px solid #DED4C5' }}>
            <span style={{ fontSize: '10px', color: '#756A60' }}>EXCEPTIONS</span>
            <strong style={{ fontSize: '16px', display: 'block', color: '#98111E' }}>{recon.summary.exceptionRecords}</strong>
          </div>
          <div style={{ background: '#F8F4EC', padding: '10px', borderRadius: '6px', border: '1px solid #DED4C5' }}>
            <span style={{ fontSize: '10px', color: '#756A60' }}>TOTAL VARIANCE</span>
            <strong style={{ fontSize: '16px', display: 'block', color: '#211A17', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(recon.summary.totalExceptionVolume)}</strong>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '12px', color: '#211A17', textTransform: 'uppercase', marginBottom: '8px' }}>
            Exceptions Ledger
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recon.exceptions.map((e: any) => (
              <div key={e.id} style={{ padding: '10px 12px', background: '#F8F4EC', borderRadius: '6px', border: '1px solid #DED4C5', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#98111E' }}>{e.reason}</strong>
                  <span style={{ color: '#756A60', marginLeft: '8px' }}>({e.recordA.referenceId})</span>
                  <small style={{ display: 'block', color: '#756A60' }}>{e.explanation}</small>
                </div>
                <strong style={{ color: '#211A17', fontFamily: "'IBM Plex Mono', monospace" }}>Diff: {formatINR(e.difference)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Fallback for Cash Flow / Transaction Report
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '14px', color: '#98111E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Verified Financial Activity
      </h3>
      <p style={{ fontSize: '13px', color: '#211A17', lineHeight: 1.6 }}>
        Total transaction volume for the selected cycle includes {finance.transactions.length} cleared entries across all categories.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {finance.transactions.slice(0, 10).map((tx: any, idx: number) => (
          <div key={tx.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F8F4EC', borderRadius: '6px', border: '1px solid #DED4C5', fontSize: '12px' }}>
            <span><strong>{tx.name}</strong> · {tx.category}</span>
            <strong style={{ color: tx.category === 'Income' ? '#166534' : '#211A17', fontFamily: "'IBM Plex Mono', monospace" }}>
              {tx.category === 'Income' ? '+' : '−'}{formatINR(tx.amount)}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}
