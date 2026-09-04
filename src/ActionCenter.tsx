import React, { useState } from 'react'
import {
  useFinance,
  formatINR,
  type FinancialDecision,
} from './finance/FinanceContext'
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Filter,
  Layers,
  Zap,
} from 'lucide-react'
import AnimatedNumber from './components/AnimatedNumber'
import ScrollReveal from './components/ScrollReveal'

interface ActionCenterProps {
  navigate?: (view: string) => void
  openModal?: (modal: string) => void
}

export default function ActionCenter({ navigate, openModal }: ActionCenterProps) {
  const { decisions, intelligence, state: finance } = useFinance()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const categories = ['ALL', 'LIQUIDITY', 'CASH_FLOW', 'BUDGETS', 'GOALS', 'COMMITMENTS', 'EMERGENCY_RESERVE']
  const priorities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

  const filteredDecisions = decisions.filter(dec => {
    const matchesCategory = selectedCategory === 'ALL' || dec.category === selectedCategory
    const matchesPriority = selectedPriority === 'ALL' || dec.priority === selectedPriority
    return matchesCategory && matchesPriority
  })

  const handleAction = (decision: FinancialDecision) => {
    if (decision.route && navigate) {
      navigate(decision.route)
    } else if (decision.category === 'GOALS' && navigate) {
      navigate('Goals')
    } else if (decision.category === 'BUDGETS' && navigate) {
      navigate('Money')
    } else if (decision.category === 'COMMITMENTS' && navigate) {
      navigate('Cash Flow')
    } else if (decision.category === 'LIQUIDITY' && navigate) {
      navigate('Cash Flow')
    } else if (decision.category === 'CASH_FLOW' && navigate) {
      navigate('Cash Flow')
    } else if (decision.category === 'EMERGENCY_RESERVE' && navigate) {
      navigate('Financial Health')
    } else if (openModal) {
      openModal('Insight')
    }

    setActionSuccess(`Directing to ${decision.route || 'resolution'} for: "${decision.title}"`)
    setTimeout(() => setActionSuccess(null), 3500)
  }

  const criticalCount = decisions.filter(d => d.priority === 'CRITICAL' || d.priority === 'HIGH').length
  const goalDecisionsCount = decisions.filter(d => d.category === 'GOALS').length
  const budgetDecisionsCount = decisions.filter(d => d.category === 'BUDGETS').length

  return (
    <div className="workspace-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">ACTION CENTER / PRIORITIZED DIRECTIVES</span>
          <h1>
            Financial Command &amp;<br />
            <em>Prioritized Actions.</em>
          </h1>
          <p>
            Deterministic financial directives evaluated continuously across your liquidity,
            commitments, goals, and budget velocity.
          </p>
        </div>
        <div className="date-chip">
          <Zap className="w-3.5 h-3.5 text-[#98111E] inline mr-1" />
          <span>{decisions.length} ACTIVE DIRECTIVES</span>
        </div>
      </div>

      {actionSuccess && (
        <div
          style={{
            background: 'rgba(22, 101, 52, 0.08)',
            border: '1px solid rgba(22, 101, 52, 0.3)',
            color: '#166534',
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top Banner KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <ScrollReveal staggerIndex={0} staggerDelay={40}>
          <div className="snapshot-card safe">
            <span>
              URGENT ATTENTION
              <i style={{ background: criticalCount > 0 ? '#991b1b' : '#166534', color: '#FFFDF8', padding: '1px 6px', borderRadius: '4px' }}>
                {criticalCount > 0 ? 'ATTENTION' : 'STABLE'}
              </i>
            </span>
            <strong>
              <AnimatedNumber value={criticalCount} format="number" suffix=" Issues" />
            </strong>
            <small>{criticalCount > 0 ? 'Requires high priority review' : 'All critical thresholds clear'}</small>
          </div>
        </ScrollReveal>

        <ScrollReveal staggerIndex={1} staggerDelay={40}>
          <div className="snapshot-card balance">
            <span>
              GOAL SAFEGUARDING
              <i>{goalDecisionsCount} DIRECTIVES</i>
            </span>
            <strong>
              <AnimatedNumber value={intelligence.goals.aggregateProgress} format="percent" suffix=" Overall" />
            </strong>
            <small>{intelligence.goals.completedCount} of {finance.goals.length} goals completed</small>
          </div>
        </ScrollReveal>

        <ScrollReveal staggerIndex={2} staggerDelay={40}>
          <div className="snapshot-card spend">
            <span>
              BUDGET CONTROL
              <i>{budgetDecisionsCount} TRACKED</i>
            </span>
            <strong>
              <AnimatedNumber value={intelligence.budgets.overBudgetCount} format="number" suffix=" Over Budget" />
            </strong>
            <small>
              {intelligence.budgets.nearLimitCount} near 85% limit threshold
            </small>
          </div>
        </ScrollReveal>

        <ScrollReveal staggerIndex={3} staggerDelay={40}>
          <div className="snapshot-card goal">
            <span>
              SAFE LIQUIDITY
              <i>ACTIVE</i>
            </span>
            <strong>
              <AnimatedNumber value={intelligence.liquidity.safeToSpend} format="currency" />
            </strong>
            <small>Unencumbered discretionary capacity</small>
          </div>
        </ScrollReveal>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: '#F8F4EC',
          border: '1px solid var(--os-line)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '22px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(63, 13, 18, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: "'DM Mono', monospace",
              color: '#756A60',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginRight: '6px',
              fontWeight: 500,
            }}
          >
            <Filter className="w-3.5 h-3.5 text-[#98111E]" /> CATEGORY:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: '10px',
                fontFamily: "'DM Mono', monospace",
                padding: '5px 12px',
                borderRadius: '20px',
                border: selectedCategory === cat ? '1px solid #98111E' : '1px solid var(--os-line)',
                background: selectedCategory === cat ? '#FFFDF8' : 'transparent',
                color: selectedCategory === cat ? '#98111E' : '#756A60',
                fontWeight: selectedCategory === cat ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: selectedCategory === cat ? '0 2px 6px rgba(63, 13, 18, 0.05)' : 'none',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: "'DM Mono', monospace",
              color: '#756A60',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginRight: '6px',
              fontWeight: 500,
            }}
          >
            <Layers className="w-3.5 h-3.5 text-[#98111E]" /> PRIORITY:
          </span>
          {priorities.map(prio => (
            <button
              key={prio}
              onClick={() => setSelectedPriority(prio)}
              style={{
                fontSize: '10px',
                fontFamily: "'DM Mono', monospace",
                padding: '5px 12px',
                borderRadius: '20px',
                border: selectedPriority === prio ? '1px solid #3F0D12' : '1px solid var(--os-line)',
                background: selectedPriority === prio ? '#FFFDF8' : 'transparent',
                color: selectedPriority === prio ? '#3F0D12' : '#756A60',
                fontWeight: selectedPriority === prio ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: selectedPriority === prio ? '0 2px 6px rgba(63, 13, 18, 0.05)' : 'none',
              }}
            >
              {prio}
            </button>
          ))}
        </div>
      </div>

      {/* Decisions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredDecisions.map((decision, index) => {
          const isCritical = decision.priority === 'CRITICAL'
          const isHigh = decision.priority === 'HIGH'
          const isMedium = decision.priority === 'MEDIUM'

          const badgeColor = isCritical
            ? 'rgba(153, 27, 27, 0.08)'
            : isHigh
            ? 'rgba(180, 83, 9, 0.08)'
            : isMedium
            ? 'rgba(152, 17, 30, 0.08)'
            : 'rgba(117, 106, 96, 0.08)'

          const badgeBorder = isCritical
            ? 'rgba(153, 27, 27, 0.3)'
            : isHigh
            ? 'rgba(180, 83, 9, 0.3)'
            : isMedium
            ? 'rgba(152, 17, 30, 0.3)'
            : 'rgba(117, 106, 96, 0.25)'

          const badgeText = isCritical
            ? '#991b1b'
            : isHigh
            ? '#b45309'
            : isMedium
            ? '#98111E'
            : '#756A60'

          return (
            <ScrollReveal key={decision.id} staggerIndex={index} staggerDelay={30}>
              <article
                style={{
                  background: '#FFFDF8',
                  border: isCritical ? '1px solid rgba(153, 27, 27, 0.4)' : '1px solid var(--os-line)',
                  borderRadius: '14px',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 18px rgba(63, 13, 18, 0.03)',
                }}
              >
                {isCritical && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #991b1b, #98111E)',
                    }}
                  />
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                        color: badgeText,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {isCritical ? (
                        <ShieldAlert className="w-3 h-3" />
                      ) : isHigh ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {decision.priority}
                    </span>

                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: "'DM Mono', monospace",
                        color: '#756A60',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 500,
                      }}
                    >
                      {decision.category.replace('_', ' ')}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: "'DM Mono', monospace",
                      color: '#9A8F84',
                    }}
                  >
                    {decision.confidence}
                  </span>
                </div>

                <div>
                  <h3
                    style={{
                      margin: '0 0 6px 0',
                      fontSize: '17px',
                      fontWeight: 600,
                      color: '#211A17',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {decision.title}
                  </h3>
                  <p
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#524840',
                    }}
                  >
                    {decision.summary}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: '1.55',
                      color: '#756A60',
                    }}
                  >
                    {decision.explanation}
                  </p>
                </div>

                {/* Metrics Breakdown if available */}
                {decision.metrics && Object.keys(decision.metrics).length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                    {Object.entries(decision.metrics).map(([key, val]) => (
                      <span
                        key={key}
                        style={{
                          fontSize: '10px',
                          fontFamily: "'DM Mono', monospace",
                          background: '#F8F4EC',
                          border: '1px solid var(--os-line)',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          color: '#756A60',
                        }}
                      >
                        <span style={{ color: '#9A8F84' }}>{key}:</span>{' '}
                        <strong style={{ color: '#211A17', fontWeight: 600 }}>
                          {typeof val === 'number' ? formatINR(val) : String(val)}
                        </strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Recommendation & Resolution Button */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--os-line)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                    {decision.action && (
                      <div
                        style={{
                          fontSize: '11px',
                          background: 'rgba(251, 228, 227, 0.5)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          color: '#3F0D12',
                          border: '1px solid rgba(152, 17, 30, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Zap className="w-3 h-3 text-[#98111E] shrink-0" />
                        <span>Recommended: <strong style={{ color: '#98111E' }}>{decision.action}</strong></span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="soft-button"
                    onClick={() => handleAction(decision)}
                    style={{
                      margin: 0,
                      padding: '8px 16px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Resolve in {decision.route || 'Intelligence'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            </ScrollReveal>
          )
        })}

        {filteredDecisions.length === 0 && (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#F8F4EC',
              borderRadius: '14px',
              border: '1px dashed var(--os-line)',
            }}
          >
            <CheckCircle2 className="w-10 h-10 text-[#166534] mx-auto mb-3 opacity-80" />
            <h3 style={{ margin: '0 0 6px 0', color: '#211A17', fontSize: '16px', fontWeight: 600 }}>
              No Directives in Selected Filter
            </h3>
            <p style={{ margin: 0, color: '#756A60', fontSize: '13px' }}>
              All financial indicators for this filter are currently optimal and within healthy ranges.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

