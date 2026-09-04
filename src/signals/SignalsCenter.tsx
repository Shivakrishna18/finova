import React, { useState, useMemo } from 'react'
import { useFinance, formatINR } from '../finance/FinanceContext'
import { runReconciliation } from '../controller/reconciliationEngine'
import { generateLiveSignals, type FinancialSignal, type SignalSeverity } from './signalsEngine'
import { logAuditEvent } from '../audit/auditLogger'
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Check,
  X,
  ArrowRight,
  Filter,
  Settings,
  Shield,
  Trash2
} from 'lucide-react'

export default function SignalsCenter({
  onNavigate
}: {
  onNavigate?: (view: string) => void
}) {
  const { state: finance, intelligence } = useFinance()
  const recon = useMemo(() => runReconciliation(), [])

  // Stored signals state
  const [signals, setSignals] = useState<FinancialSignal[]>(() => {
    try {
      const stored = localStorage.getItem('finova-signals-v1')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
    return generateLiveSignals(finance, intelligence, recon.summary)
  })

  // Filter state
  const [filterType, setFilterType] = useState<string>('ALL')
  const [showPreferences, setShowPreferences] = useState(false)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [thresholdAlerts, setThresholdAlerts] = useState(true)
  const [reconAlerts, setReconAlerts] = useState(true)

  const persistSignals = (updated: FinancialSignal[]) => {
    setSignals(updated)
    try {
      localStorage.setItem('finova-signals-v1', JSON.stringify(updated))
    } catch {}
  }

  const handleMarkAllRead = () => {
    const updated = signals.map(s => ({ ...s, read: true }))
    persistSignals(updated)
    logAuditEvent({
      eventType: 'Signal Dismissed',
      category: 'SYSTEM',
      description: 'All pending notifications marked as read.',
      source: 'USER',
      severity: 'INFO',
      isDemo: true
    })
  }

  const handleMarkRead = (id: string) => {
    const updated = signals.map(s => (s.id === id ? { ...s, read: true } : s))
    persistSignals(updated)
  }

  const handleDismiss = (id: string) => {
    const updated = signals.map(s => (s.id === id ? { ...s, dismissed: true } : s))
    persistSignals(updated)
    logAuditEvent({
      eventType: 'Signal Dismissed',
      category: 'SYSTEM',
      description: `Notification ${id} dismissed.`,
      source: 'USER',
      severity: 'INFO',
      isDemo: true
    })
  }

  const handleResetSignals = () => {
    const fresh = generateLiveSignals(finance, intelligence, recon.summary)
    persistSignals(fresh)
  }

  const filteredSignals = useMemo(() => {
    return signals.filter(s => {
      if (s.dismissed) return false
      if (filterType === 'UNREAD') return !s.read
      if (filterType === 'CRITICAL') return s.severity === 'CRITICAL'
      if (filterType === 'WARNING') return s.severity === 'WARNING'
      if (filterType === 'INSIGHT') return s.severity === 'INFO' || s.severity === 'SUCCESS'
      return true
    })
  }, [signals, filterType])

  const unreadCount = signals.filter(s => !s.read && !s.dismissed).length

  return (
    <div className="workspace-page" style={{ maxWidth: '1040px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div className="page-intro" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ color: '#98111E', fontWeight: 700, letterSpacing: '0.12em' }}>
            FINOVA OS /// INTELLIGENT SIGNALS
          </span>
          <h1 style={{ fontSize: '28px', color: '#211A17', margin: '4px 0 6px 0', fontFamily: 'Manrope, sans-serif' }}>
            Signals & Notifications Hub
          </h1>
          <p style={{ color: '#756A60', fontSize: '14px', maxWidth: '680px', margin: 0 }}>
            Proactive alerts on budget cushions, upcoming commitments, goal milestones, and reconciliation exceptions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#FFFDF8',
              border: '1px solid #DED4C5',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#211A17',
              cursor: 'pointer'
            }}
          >
            <Settings size={14} color="#756A60" />
            Preferences
          </button>
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            style={{
              padding: '8px 14px',
              background: '#F8F4EC',
              border: '1px solid #DED4C5',
              borderRadius: '8px',
              fontSize: '12px',
              color: unreadCount > 0 ? '#211A17' : '#9A8F84',
              cursor: unreadCount > 0 ? 'pointer' : 'default',
              fontWeight: 500
            }}
          >
            Mark All Read
          </button>
          <button
            onClick={handleResetSignals}
            style={{
              padding: '8px 14px',
              background: '#98111E',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#FFFDF8',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Refresh Signals ↻
          </button>
        </div>
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <div
          style={{
            background: '#FFFDF8',
            border: '1px solid #DED4C5',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px'
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={thresholdAlerts}
              onChange={e => setThresholdAlerts(e.target.checked)}
              style={{ accentColor: '#98111E' }}
            />
            <span>Budget & Safe-to-Spend Thresholds</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={reconAlerts}
              onChange={e => setReconAlerts(e.target.checked)}
              style={{ accentColor: '#98111E' }}
            />
            <span>Reconciliation & Discrepancy Alerts</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={e => setEmailAlerts(e.target.checked)}
              style={{ accentColor: '#98111E' }}
            />
            <span>Daily Financial Summary Digest</span>
          </label>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { id: 'ALL', label: 'All Signals' },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'CRITICAL', label: 'Critical' },
          { id: 'WARNING', label: 'Warnings' },
          { id: 'INSIGHT', label: 'Insights & Goals' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              border: filterType === f.id ? '1px solid #98111E' : '1px solid #DED4C5',
              background: filterType === f.id ? '#98111E' : '#FFFDF8',
              color: filterType === f.id ? '#FFFDF8' : '#211A17',
              fontWeight: 500
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Signals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredSignals.length === 0 ? (
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
            <CheckCircle size={32} style={{ margin: '0 auto 10px auto', color: '#166534', opacity: 0.8 }} />
            <h3 style={{ fontSize: '16px', color: '#211A17', marginBottom: '4px' }}>All caught up!</h3>
            <p style={{ fontSize: '13px', margin: 0 }}>No active signals matching your current filter.</p>
          </div>
        ) : (
          filteredSignals.map(sig => {
            const isUnread = !sig.read

            const badge =
              sig.severity === 'CRITICAL'
                ? { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2', icon: AlertTriangle }
                : sig.severity === 'WARNING'
                ? { bg: '#FFF8E1', text: '#B78103', border: '#FFE082', icon: AlertTriangle }
                : sig.severity === 'SUCCESS'
                ? { bg: '#E8F5E9', text: '#1B5E20', border: '#C8E6C9', icon: CheckCircle }
                : { bg: '#F8F4EC', text: '#756A60', border: '#DED4C5', icon: Info }

            const IconComp = badge.icon

            return (
              <div
                key={sig.id}
                style={{
                  background: isUnread ? '#FFFDF8' : '#FAF6F0',
                  border: isUnread ? '1px solid #DED4C5' : '1px solid #E8E2D8',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '16px',
                  alignItems: 'center',
                  boxShadow: isUnread ? '0 2px 6px rgba(0,0,0,0.02)' : 'none'
                }}
              >
                {/* Severity Icon */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: badge.bg,
                    border: `1px solid ${badge.border}`,
                    color: badge.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconComp size={18} />
                </div>

                {/* Body */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: '#211A17' }}>{sig.title}</strong>
                    {isUnread && (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#98111E',
                          display: 'inline-block'
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: badge.bg,
                        color: badge.text,
                        border: `1px solid ${badge.border}`,
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    >
                      {sig.severity}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#756A60', lineHeight: 1.4 }}>
                    {sig.message}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {sig.actionLabel && onNavigate && (
                    <button
                      onClick={() => {
                        handleMarkRead(sig.id)
                        onNavigate(sig.targetView)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        background: '#98111E',
                        color: '#FFFDF8',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <span>{sig.actionLabel}</span>
                      <ArrowRight size={12} />
                    </button>
                  )}

                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(sig.id)}
                      title="Mark as read"
                      style={{
                        padding: '6px',
                        background: '#F8F4EC',
                        border: '1px solid #DED4C5',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#756A60'
                      }}
                    >
                      <Check size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => handleDismiss(sig.id)}
                    title="Dismiss"
                    style={{
                      padding: '6px',
                      background: '#F8F4EC',
                      border: '1px solid #DED4C5',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#756A60'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
