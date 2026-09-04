import React, { useState, useEffect, useMemo } from 'react'
import { getStoredAuditLogs, resetAuditLogsToDemo, type AuditRecord, type AuditEventType } from './auditLogger'
import { formatINR } from '../data/demoFinancialState'
import { Search, Filter, RefreshCw, Shield, AlertTriangle, CheckCircle, Download } from 'lucide-react'

export default function AuditTrail() {
  const [logs, setLogs] = useState<AuditRecord[]>(() => getStoredAuditLogs())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ALL')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL')
  const [referenceTime, setReferenceTime] = useState(() => Date.now())

  useEffect(() => {
    const handleUpdate = () => {
      setLogs(getStoredAuditLogs())
      setReferenceTime(Date.now())
    }
    window.addEventListener('finova-audit-updated', handleUpdate)
    return () => window.removeEventListener('finova-audit-updated', handleUpdate)
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Category filter
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false
      }
      // Severity filter
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
        return false
      }
      // Timeframe filter
      if (selectedTimeframe !== 'ALL') {
        const logTime = new Date(log.timestamp).getTime()
        const diffHours = (referenceTime - logTime) / (1000 * 60 * 60)
        if (selectedTimeframe === 'TODAY' && diffHours > 24) return false
        if (selectedTimeframe === 'WEEK' && diffHours > 24 * 7) return false
        if (selectedTimeframe === 'MONTH' && diffHours > 24 * 30) return false
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchDesc = log.description.toLowerCase().includes(q)
        const matchEvent = log.eventType.toLowerCase().includes(q)
        const matchEntity = (log.relatedEntity || '').toLowerCase().includes(q)
        const matchSource = log.source.toLowerCase().includes(q)
        if (!matchDesc && !matchEvent && !matchEntity && !matchSource) return false
      }
      return true
    })
  }, [logs, selectedCategory, selectedSeverity, selectedTimeframe, searchQuery])

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Event Type', 'Category', 'Source', 'Entity', 'Amount', 'Description', 'Severity', 'Is Demo']
    const rows = filteredLogs.map(l => [
      new Date(l.timestamp).toLocaleString(),
      `"${l.eventType}"`,
      l.category,
      l.source,
      `"${l.relatedEntity || ''}"`,
      l.amount ? l.amount : '',
      `"${l.description.replace(/"/g, '""')}"`,
      l.severity || 'INFO',
      l.isDemo ? 'Yes' : 'No'
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `finova_audit_trail_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="workspace-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <div className="page-intro" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ color: '#98111E', letterSpacing: '0.12em', fontWeight: 600 }}>
            FINOVA OS /// GOVERNANCE & COMPLIANCE
          </span>
          <h1 style={{ fontSize: '28px', color: '#211A17', margin: '8px 0 6px 0', fontFamily: 'Manrope, sans-serif' }}>
            Financial Audit Trail
          </h1>
          <p style={{ color: '#756A60', fontSize: '14px', maxWidth: '680px', margin: 0 }}>
            Immutable chronological record of all state transitions, transaction additions, goal contributions, scenario evaluations, and reconciliation checks.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={exportAuditCSV}
            className="soft-button"
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
              fontWeight: 500
            }}
          >
            <Download size={14} color="#98111E" />
            Export CSV
          </button>
          <span
            className="demo-badge"
            style={{
              padding: '6px 12px',
              background: '#F8F4EC',
              border: '1px solid #DED4C5',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: "'IBM Plex Mono', monospace",
              color: '#756A60'
            }}
          >
            {logs.length} LOGGED EVENTS
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid #DED4C5',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#756A60' }}
            />
            <input
              type="text"
              placeholder="Search audit trail by description, entity, or event type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                background: '#F8F4EC',
                border: '1px solid #DED4C5',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#211A17',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{
                padding: '9px 12px',
                background: '#F8F4EC',
                border: '1px solid #DED4C5',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#211A17',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="TRANSACTION">Transactions</option>
              <option value="INCOME">Income</option>
              <option value="BUDGET">Budgets</option>
              <option value="GOAL">Goals</option>
              <option value="COMMITMENT">Commitments</option>
              <option value="SCANNER">Bill Scanner</option>
              <option value="RECONCILIATION">Reconciliation</option>
              <option value="SIMULATION">Simulation</option>
              <option value="SYSTEM">System</option>
            </select>

            <select
              value={selectedTimeframe}
              onChange={e => setSelectedTimeframe(e.target.value)}
              style={{
                padding: '9px 12px',
                background: '#F8F4EC',
                border: '1px solid #DED4C5',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#211A17',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Last 24 Hours</option>
              <option value="WEEK">Past 7 Days</option>
              <option value="MONTH">Past 30 Days</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              style={{
                padding: '9px 12px',
                background: '#F8F4EC',
                border: '1px solid #DED4C5',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#211A17',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="SUCCESS">Success</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredLogs.length === 0 ? (
          <div
            style={{
              background: '#FFFDF8',
              border: '1px dashed #DED4C5',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
              color: '#756A60'
            }}
          >
            <Shield size={32} style={{ margin: '0 auto 12px auto', color: '#98111E', opacity: 0.6 }} />
            <h3 style={{ fontSize: '16px', color: '#211A17', marginBottom: '6px' }}>No audit records matched</h3>
            <p style={{ fontSize: '13px', margin: 0 }}>Try adjusting your search keywords or filter criteria.</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const dateStr = new Date(log.timestamp).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
            const timeStr = new Date(log.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })

            const badgeColor =
              log.severity === 'SUCCESS'
                ? { bg: '#E8F5E9', border: '#C8E6C9', text: '#1B5E20' }
                : log.severity === 'WARNING'
                ? { bg: '#FFF8E1', border: '#FFE082', text: '#B78103' }
                : log.severity === 'CRITICAL'
                ? { bg: '#FFEBEE', border: '#FFCDD2', text: '#C62828' }
                : { bg: '#F8F4EC', border: '#DED4C5', text: '#756A60' }

            return (
              <div
                key={log.id}
                style={{
                  background: '#FFFDF8',
                  border: '1px solid #DED4C5',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr auto',
                  gap: '16px',
                  alignItems: 'center'
                }}
              >
                {/* Timestamp & Tag */}
                <div>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '11px',
                      color: '#756A60',
                      display: 'block'
                    }}
                  >
                    {dateStr}
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '11px',
                      color: '#9A8F84',
                      display: 'block'
                    }}
                  >
                    {timeStr}
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: badgeColor.bg,
                      border: `1px solid ${badgeColor.border}`,
                      color: badgeColor.text,
                      fontWeight: 600,
                      textTransform: 'uppercase'
                    }}
                  >
                    {log.category}
                  </span>
                </div>

                {/* Event details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: '#211A17' }}>{log.eventType}</strong>
                    {log.relatedEntity && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#98111E',
                          background: 'rgba(152, 17, 30, 0.06)',
                          padding: '1px 7px',
                          borderRadius: '4px',
                          fontWeight: 500
                        }}
                      >
                        {log.relatedEntity}
                      </span>
                    )}
                    {log.isDemo && (
                      <span
                        style={{
                          fontSize: '9px',
                          color: '#756A60',
                          background: '#F8F4EC',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          fontFamily: "'IBM Plex Mono', monospace"
                        }}
                      >
                        DEMO
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#756A60', lineHeight: 1.4 }}>
                    {log.description}
                  </p>
                  {(log.previousValue !== undefined || log.newValue !== undefined) && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#9A8F84', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {log.previousValue !== undefined && <span>Previous: {String(log.previousValue)} → </span>}
                      {log.newValue !== undefined && <strong style={{ color: '#211A17' }}>New: {String(log.newValue)}</strong>}
                    </div>
                  )}
                </div>

                {/* Amount / Source */}
                <div style={{ textAlign: 'right', minWidth: '90px' }}>
                  {log.amount !== undefined ? (
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#211A17',
                        fontFamily: "'IBM Plex Mono', monospace",
                        display: 'block'
                      }}
                    >
                      {formatINR(log.amount)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#9A8F84' }}>—</span>
                  )}
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#756A60',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    via {log.source}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
