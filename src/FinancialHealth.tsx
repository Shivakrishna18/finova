import { useState, useMemo } from 'react'
import PlasmaRing from './components/originkit/ui/plasma-ring'
import { useFinance, formatINR, type FinancialDecision } from './finance/FinanceContext'
import AnimatedNumber from './components/AnimatedNumber'
import ScrollReveal from './components/ScrollReveal'

export default function FinancialHealth() {
  const { state: finance, intelligence, topDecisions } = useFinance()
  const [activeFactorName, setActiveFactorName] = useState<string>('Cash-flow stability')
  const [actionOpen, setActionOpen] = useState(false)
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)

  const derived = intelligence.health
  const cashFlow = intelligence.cashFlow
  const liquidity = intelligence.liquidity
  const savings = intelligence.savings
  const goals = intelligence.goals
  const budgets = intelligence.budgets
  const commitments = intelligence.commitments

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('finova-navigate', { detail: view }))
  }

  const openEvent = () => {
    window.dispatchEvent(new CustomEvent('finova-modal', { detail: 'Event Mode' }))
  }

  // Active factor object lookup
  const activeFactor = useMemo(() => {
    const found = derived.factors.find(
      f => f.name.toLowerCase() === activeFactorName.toLowerCase() ||
           f.name.toLowerCase().includes(activeFactorName.toLowerCase()) ||
           activeFactorName.toLowerCase().includes(f.name.toLowerCase())
    )
    return found || derived.factors[0] || { name: 'Cash-flow stability', score: 50, note: 'Analyzing current cash-flow parameters.' }
  }, [derived.factors, activeFactorName])

  // Get status color tokens
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'EXCELLENT':
        return '#166534'
      case 'HEALTHY':
        return '#166534'
      case 'STABLE':
        return '#98111E'
      case 'WATCH':
        return '#b45309'
      case 'AT RISK':
      case 'CRITICAL':
        return '#991b1b'
      default:
        return '#98111E'
    }
  }

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#166534'
      case 'Ahead':
        return '#166534'
      case 'On Track':
        return '#98111E'
      case 'Needs Attention':
        return '#b45309'
      case 'At Risk':
      default:
        return '#991b1b'
    }
  }

  // Ranked actionable decisions from FinancialDecisionEngine
  const displayDecisions: FinancialDecision[] = topDecisions && topDecisions.length > 0
    ? topDecisions.slice(0, 4)
    : [
        {
          id: 'dec-fallback-1',
          category: 'LIQUIDITY',
          priority: 'MEDIUM',
          severity: 'medium',
          title: 'Protect Recurring Commitments',
          summary: `${formatINR(commitments.totalActiveCommitments)} is already reserved for active obligations.`,
          explanation: 'Keep committed money separate from safe-to-spend liquidity to avoid end-of-month cash squeeze.',
          action: 'Review scheduled outflows in Cash Flow view.',
          route: 'Cash Flow',
          confidence: 'Deterministic (100%)',
        },
        {
          id: 'dec-fallback-2',
          category: 'EMERGENCY_RESERVE',
          priority: savings.emergencyProgress < 70 ? 'HIGH' : 'LOW',
          severity: savings.emergencyProgress < 70 ? 'high' : 'low',
          title: 'Strengthen Emergency Cushion',
          summary: `Current reserve covers ${savings.emergencyCoverageDays} of normal living expenses.`,
          explanation: `Your emergency target is ${formatINR(savings.emergencyTarget)}. Continuing allocations will reinforce stability.`,
          action: 'Contribute to emergency reserve goal.',
          route: 'Goals',
          confidence: 'Deterministic (100%)',
        },
      ]

  return (
    <div className="workspace-page health-page">
      {/* 1. Page Header & Live Status */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">FINANCIAL HEALTH / COMMAND CENTER</span>
          <h1>
            Your financial state.
            <br />
            <em>Made visible.</em>
          </h1>
          <p>Deterministic financial health analysis derived continuously from your income, spending, commitments, and goals.</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: getLevelColor(derived.level) }}
            />
            <span className="font-mono text-xs tracking-wider" style={{ color: getLevelColor(derived.level) }}>
              STATUS: {derived.level} ({derived.score}/100)
            </span>
          </div>
          <span className="demo-badge">REACTIVE INTELLIGENCE</span>
        </div>
      </div>

      {/* 2. Top Metric Snapshot Bar */}
      <section className="health-snapshot-bar grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mb-3">
        <div className="p-3.5 border border-[var(--os-line)] bg-[var(--os-panel)] rounded-sm">
          <span className="block text-[9px] font-mono text-[var(--os-text-muted)] uppercase tracking-wider">Health Score</span>
          <strong className="block mt-2 text-xl font-mono text-[var(--os-text-primary)]">
            <AnimatedNumber value={derived.score} format="number" />
            <small className="text-xs text-[var(--os-text-secondary)] font-normal ml-1">/100</small>
          </strong>
          <span className="block mt-1 text-[9px] font-mono font-medium" style={{ color: getLevelColor(derived.level) }}>
            {derived.level}
          </span>
        </div>

        <div className="p-3.5 border border-[var(--os-line)] bg-[var(--os-panel)] rounded-sm">
          <span className="block text-[9px] font-mono text-[var(--os-text-muted)] uppercase tracking-wider">Monthly Income</span>
          <strong className="block mt-2 text-xl font-mono text-[#166534]">
            {formatINR(cashFlow.monthlyIncome)}
          </strong>
          <span className="block mt-1 text-[9px] font-mono text-[var(--os-text-muted)]">
            {finance.incomeRecords?.length || 0} scheduled sources
          </span>
        </div>

        <div className="p-3.5 border border-[var(--os-line)] bg-[var(--os-panel)] rounded-sm">
          <span className="block text-[9px] font-mono text-[var(--os-text-muted)] uppercase tracking-wider">Monthly Spending</span>
          <strong className="block mt-2 text-xl font-mono text-[var(--os-text-primary)]">
            {formatINR(cashFlow.monthlySpending)}
          </strong>
          <span className="block mt-1 text-[9px] font-mono text-[var(--os-text-muted)]">
            {cashFlow.spendingVelocity}% of income
          </span>
        </div>

        <div className="p-3.5 border border-[var(--os-line)] bg-[var(--os-panel)] rounded-sm">
          <span className="block text-[9px] font-mono text-[var(--os-text-muted)] uppercase tracking-wider">
            {liquidity.isDeficit ? 'Monthly Deficit' : 'Monthly Surplus'}
          </span>
          <strong
            className="block mt-2 text-xl font-mono"
            style={{ color: liquidity.isDeficit ? '#991b1b' : '#166534' }}
          >
            {liquidity.isDeficit ? `- ${formatINR(liquidity.monthlyDeficit)}` : `+ ${formatINR(cashFlow.monthlySurplus)}`}
          </strong>
          <span className="block mt-1 text-[9px] font-mono text-[var(--os-text-muted)]">
            {cashFlow.cashFlowStatus}
          </span>
        </div>

        <div className="p-3.5 border border-[var(--os-line)] bg-[var(--os-panel)] rounded-sm">
          <span className="block text-[9px] font-mono text-[var(--os-text-muted)] uppercase tracking-wider">Savings Rate</span>
          <strong className="block mt-2 text-xl font-mono text-[#98111E]">
            {cashFlow.savingsRate}%
          </strong>
          <span className="block mt-1 text-[9px] font-mono text-[var(--os-text-muted)]">
            {cashFlow.savingsRate >= 40 ? 'High capacity' : 'Moderate'}
          </span>
        </div>

        <div className="p-3.5 border border-[var(--os-line)] bg-[var(--os-panel)] rounded-sm">
          <span className="block text-[9px] font-mono text-[var(--os-text-muted)] uppercase tracking-wider">Emergency Buffer</span>
          <strong className="block mt-2 text-xl font-mono text-[#b45309]">
            {savings.emergencyCoverageDays}
          </strong>
          <span className="block mt-1 text-[9px] font-mono text-[var(--os-text-muted)]">
            {savings.reserveStatus} ({savings.emergencyProgress}%)
          </span>
        </div>
      </section>

      {/* 3. Core Health Hero Grid: Plasma Ring Score + Interactive Factor Breakdown */}
      <section className="health-hero-grid">
        <div className="health-core-card">
          <div className="health-core-scene">
            <div className="health-orbit orbit-a" />
            <div className="health-orbit orbit-b" />
            <div className="health-core">
              <PlasmaRing
                background="rgba(0,0,0,0)"
                colors={['#73eaff', '#6677ff', '#b55dff']}
                density={46}
                speed={24}
                centerOpacity={8}
                scale={30}
                style={{ width: '100%', height: '100%' }}
              />
              <div>
                <strong>
                  <AnimatedNumber value={derived.score} format="number" />
                </strong>
                <small>/ 100</small>
                <b style={{ color: getLevelColor(derived.level) }}>{derived.level}</b>
              </div>
            </div>
            <span className="health-label label-top">FINANCIAL HEALTH</span>
            <span className="health-label label-left">CASH FLOW: {cashFlow.savingsRate}%</span>
            <span className="health-label label-right">GOALS: {goals.aggregateProgress}%</span>
            <span className="health-label label-bottom">RESERVE: {savings.emergencyProgress}%</span>
          </div>
          <div className="health-core-footer">
            <span>DETERMINISTIC EVALUATION ENGINE</span>
            <strong>{derived.summary} · Evaluated across {derived.factors.length} verified metrics</strong>
          </div>
        </div>

        <div className="health-factor-card">
          <div className="card-top">
            <div>
              <span className="panel-kicker">HEALTH FACTORS</span>
              <h2>Why the score looks like this</h2>
            </div>
            <span className="demo-badge">REACTIVE</span>
          </div>
          <div className="factor-list health-factors">
            {derived.factors.map(factor => (
              <button
                className={activeFactor.name === factor.name ? 'active' : ''}
                key={factor.name}
                onClick={() => setActiveFactorName(factor.name)}
                aria-label={`Select factor ${factor.name}`}
              >
                <span>{factor.name}</span>
                <i>
                  <b style={{ width: `${factor.score}%` }} />
                </i>
                <strong>{factor.score}</strong>
              </button>
            ))}
          </div>
          <div className="factor-explanation">
            <span>SELECTED FACTOR BREAKDOWN</span>
            <strong>{activeFactor.name} · Score {activeFactor.score}/100</strong>
            <p>{activeFactor.note}</p>
          </div>
        </div>
      </section>

      {/* 4. Actionable Priorities from Financial Decision Engine */}
      <section className="health-two-column">
        <section className="priorities-panel">
          <div className="card-top">
            <div>
              <span className="panel-kicker">ACTIONABLE PRIORITIES / DECISION ENGINE</span>
              <h2>What deserves attention</h2>
            </div>
            <span className="demo-badge">RANKED INTELLIGENCE</span>
          </div>
          <p className="text-xs text-[var(--os-text-secondary)] mt-2 mb-4 leading-relaxed">
            Prioritized recommendations dynamically derived from your liquidity constraints, budget limits, and upcoming commitments.
          </p>

          <div className="space-y-3 mt-4">
            {displayDecisions.map((decision, index) => {
              const isSelected = selectedDecisionId === decision.id
              return (
                <div
                  key={decision.id}
                  className={`p-4 border transition-all duration-200 rounded-sm cursor-pointer ${
                    isSelected
                      ? 'border-[#98111E] bg-[#FFFDF8]'
                      : 'border-[var(--os-line)] bg-[#F8F4EC] hover:border-[#98111E]'
                  }`}
                  onClick={() => setSelectedDecisionId(isSelected ? null : decision.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-mono text-[#98111E] font-medium mt-0.5">
                        0{index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm text-[var(--os-text-primary)] font-medium">
                            {decision.title}
                          </strong>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 border rounded-xs uppercase tracking-wider ${
                              decision.priority === 'CRITICAL'
                                ? 'text-[#991b1b] border-[rgba(153,27,27,0.3)] bg-[rgba(153,27,27,0.08)]'
                                : decision.priority === 'HIGH'
                                ? 'text-[#b45309] border-[rgba(180,83,9,0.3)] bg-[rgba(180,83,9,0.08)]'
                                : decision.priority === 'MEDIUM'
                                ? 'text-[#98111E] border-[rgba(152,17,30,0.3)] bg-[rgba(152,17,30,0.08)]'
                                : 'text-[#166534] border-[rgba(22,101,52,0.3)] bg-[rgba(22,101,52,0.08)]'
                            }`}
                          >
                            {decision.priority}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--os-text-secondary)] mt-1.5 leading-normal">
                          {decision.summary}
                        </p>
                      </div>
                    </div>

                    <button
                      className="shrink-0 px-3 py-1.5 border border-[#98111E] bg-[rgba(152,17,30,0.06)] text-[#98111E] text-[10px] font-mono hover:bg-[#98111E] hover:text-[#FFFDF8] transition-colors rounded-xs whitespace-nowrap font-medium"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(decision.route || 'Action Center')
                      }}
                    >
                      Take Action ↗
                    </button>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-[var(--os-line)] text-xs text-[var(--os-text-muted)] space-y-1.5">
                      <p><strong className="text-[var(--os-text-secondary)]">Analysis:</strong> {decision.explanation}</p>
                      <p><strong className="text-[var(--os-text-secondary)]">Next Step:</strong> {decision.action}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Financial DNA & Patterns */}
        <section className="dna-panel">
          <div className="card-top">
            <div>
              <span className="panel-kicker">YOUR FINANCIAL DNA</span>
              <h2>Patterns, not labels.</h2>
            </div>
            <span className="demo-badge">5 VECTORS</span>
          </div>
          <p className="text-xs text-[var(--os-text-secondary)] mt-2 mb-2 leading-relaxed">
            Continuous behavioral traits calculated from regular spending pace and income flows.
          </p>

          <div className="mt-4">
            {derived.dna.map(item => (
              <div className="dna-row" key={item.name}>
                <span>{item.name}</span>
                <i>
                  <b style={{ width: `${item.score}%` }} />
                </i>
                <strong>{item.trend} ({item.score}%)</strong>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--os-line)] flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--os-text-muted)]">
              Model stability: Verified
            </span>
            <button className="text-link" onClick={() => navigate('Financial Twin')}>
              Open Financial Twin ↗
            </button>
          </div>
        </section>
      </section>

      {/* 5. Health Explanation: Key Live Signals */}
      <section className="health-explanation">
        <div>
          <span className="panel-kicker">REACTIVE INTELLIGENCE</span>
          <h2>
            Three things that matter
            <br />
            <em>right now.</em>
          </h2>
          <p className="text-xs text-[var(--os-text-secondary)] mt-3 leading-relaxed">
            Real-time notifications generated when current commitments, budgets, or goal trajectories deviate from targets.
          </p>
        </div>
        <div className="important-signals">
          {derived.signals.map((signal, index) => (
            <ScrollReveal key={signal.title} staggerIndex={index} staggerDelay={40}>
              <article>
                <span>0{index + 1}</span>
                <div>
                  <strong>{signal.title}</strong>
                  <p>{signal.reason}</p>
                  <small>Impact · {signal.impact}</small>
                </div>
                <button onClick={() => navigate(signal.route)}>Review ↗</button>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 6. Radar Visualization: 6 Deterministic Dimensions */}
      <section className="radar-section">
        <div className="radar-copy">
          <span className="panel-kicker">FINANCIAL HEALTH RADAR</span>
          <h2>
            The shape of
            <br />
            <em>your stability.</em>
          </h2>
          <p>Six deterministic dimensions derived from the current shared financial state.</p>
          <div className="radar-legend">
            {derived.radar.map(item => {
              const isSelected = activeFactorName.toLowerCase().includes(item.name.toLowerCase()) ||
                                 item.name.toLowerCase().includes(activeFactorName.toLowerCase())
              return (
                <button
                  className={isSelected ? 'active' : ''}
                  key={item.name}
                  onClick={() => setActiveFactorName(item.name)}
                >
                  <i />
                  {item.name}
                  <b>{item.score} / 100</b>
                </button>
              )
            })}
          </div>
        </div>
        <div className="radar-visual">
          <RadarChart
            radarData={derived.radar}
            onSelectDimension={(name) => setActiveFactorName(name)}
          />
        </div>
      </section>

      {/* 7. Cash Flow Health Deep Dive */}
      <section className="stability-section">
        <div className="stability-heading flex justify-between items-end flex-wrap gap-3">
          <div>
            <span className="panel-kicker">CASH FLOW HEALTH & RUNWAY</span>
            <h2>How steady is the system?</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[var(--os-text-muted)]">PRESSURE:</span>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 border rounded-xs"
              style={{
                color: cashFlow.cashFlowPressure === 'LOW' ? '#166534' :
                       cashFlow.cashFlowPressure === 'BALANCED' ? '#98111E' :
                       cashFlow.cashFlowPressure === 'ELEVATED' ? '#b45309' : '#991b1b',
                borderColor: 'currentColor',
                backgroundColor: '#FFFDF8',
              }}
            >
              {cashFlow.cashFlowPressure}
            </span>
          </div>
        </div>

        <div className="stability-grid">
          <div>
            <span>INCOME STABILITY</span>
            <strong>{derived.stability[0]?.trend || '→ Stable'}</strong>
            <small>{derived.stability[0]?.note || 'Based on received income records.'}</small>
          </div>
          <div>
            <span>EXPENSE DISCIPLINE</span>
            <strong>{derived.stability[1]?.trend || (budgets.overBudgetCount === 0 ? '→ Stable' : '↓ Pressure')}</strong>
            <small>{budgets.overBudgetCount > 0 ? `${budgets.overBudgetCount} budgets exceeded` : 'All budgets within plan.'}</small>
          </div>
          <div>
            <span>LIQUIDITY RUNWAY</span>
            <strong className="text-[var(--os-cyan)]">{cashFlow.runwayDays} Days</strong>
            <small>Estimated survival runway on uncommitted cash.</small>
          </div>
          <div>
            <span>SAFE-TO-SPEND FLEXIBILITY</span>
            <strong className="text-[#56E39F]">{formatINR(liquidity.safeToSpend)}</strong>
            <small>Safe discretionary buffer after commitments.</small>
          </div>
        </div>
      </section>

      {/* 8. Emergency Reserve & Goal Protection */}
      <section className="safety-goal-grid">
        {/* Dynamic Emergency Reserve */}
        <section className="safety-net">
          <div className="card-top">
            <div>
              <span className="panel-kicker">FINANCIAL SAFETY NET</span>
              <h2>Emergency reserve</h2>
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 border rounded-xs"
              style={{
                color: savings.reserveStatus === 'Strong' ? '#56E39F' :
                       savings.reserveStatus === 'Healthy' ? '#7CFFCB' :
                       savings.reserveStatus === 'Building' ? '#74D9FF' : '#FFC857',
                borderColor: 'currentColor',
              }}
            >
              {savings.reserveStatus.toUpperCase()}
            </span>
          </div>

          <div className="reserve-amount">
            <strong>{formatINR(savings.emergencyReserve)}</strong>
            <span>of {formatINR(savings.emergencyTarget)} target</span>
          </div>

          <div className="reserve-progress">
            <i style={{ width: `${savings.emergencyProgress}%` }} />
          </div>

          <div className="reserve-meta">
            <span>{savings.emergencyProgress}% funded</span>
            <span>{savings.emergencyCoverageMonths} mos ({savings.emergencyCoverageDays})</span>
          </div>

          <p className="mt-3 text-xs text-[var(--os-text-secondary)] leading-relaxed">
            Your reserve represents protected capital intended to absorb unexpected shocks without disrupting investments or debt obligations.
          </p>

          <div className="flex gap-2 mt-4 flex-wrap">
            <button className="soft-button" onClick={openEvent}>
              Simulate Emergency ↗
            </button>
            <button
              className="px-3 py-1.5 border border-[var(--os-line)] bg-transparent text-[var(--os-text-secondary)] text-[10px] font-mono hover:text-[var(--os-cyan)] hover:border-[var(--os-cyan)] rounded-xs transition-colors"
              onClick={() => navigate('Goals')}
            >
              Manage in Goals ↗
            </button>
          </div>
        </section>

        {/* Dynamic Goal Health & Protection */}
        <section className="goal-protection-panel">
          <div className="card-top">
            <div>
              <span className="panel-kicker">GOAL PROTECTION & HEALTH</span>
              <h2>Goals under care</h2>
            </div>
            <span className="font-mono text-xs text-[var(--os-cyan)]">
              {goals.aggregateProgress}% OVERALL
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--os-text-muted)] mt-2 mb-2 flex-wrap">
            <span className="text-[#56E39F]">● {goals.completedCount} Completed</span>
            <span className="text-[var(--os-cyan)]">● {goals.onTrackCount + goals.aheadCount} On Track</span>
            <span className="text-[#FFC857]">● {goals.needsAttentionCount + goals.atRiskCount} Watch</span>
          </div>

          {goals.items.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-[var(--os-line)] rounded-sm my-4">
              <p className="text-xs text-[var(--os-text-muted)]">No goals established yet.</p>
              <button
                className="mt-3 px-3 py-1.5 border border-[var(--os-cyan)] text-[var(--os-cyan)] text-[10px] font-mono hover:bg-[var(--os-cyan)] hover:text-[#061019] rounded-xs"
                onClick={() => navigate('Goals')}
              >
                Create First Goal ↗
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {goals.items.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => navigate('Goals')}
                  className="group"
                  aria-label={`Open goal ${goal.name}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-xs text-[var(--os-text-primary)] group-hover:text-[var(--os-cyan)]">
                      {goal.name}
                    </span>
                    <strong className="font-mono text-xs" style={{ color: getGoalStatusColor(goal.status) }}>
                      {goal.progress}%
                    </strong>
                  </div>
                  <small className="flex items-center justify-between w-full mt-1">
                    <span style={{ color: getGoalStatusColor(goal.status) }}>{goal.status.toUpperCase()}</span>
                    <span>{formatINR(goal.saved)} / {formatINR(goal.target)}</span>
                  </small>
                  <i>
                    <b style={{ width: `${goal.progress}%`, backgroundColor: getGoalStatusColor(goal.status) }} />
                  </i>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>

      {/* 9. Positive Momentum & Strengths */}
      <section className="positive-section">
        <div>
          <span className="panel-kicker">POSITIVE SIGNALS & STRENGTHS</span>
          <h2>What's going well</h2>
          <p className="text-xs text-[var(--os-text-secondary)] mt-2 leading-relaxed">
            Deterministic strengths identified across your regular cash flow and asset protection buffers.
          </p>
        </div>
        <div className="positive-list">
          {derived.positives.map((item, idx) => (
            <div key={idx}>
              <i>+</i>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 10. Simple Plain-Language Briefing */}
      <section className="briefing-panel">
        <div>
          <span className="panel-kicker">FINOVA EXECUTIVE BRIEFING</span>
          <h2>
            The state,
            <br />
            <em>explained simply.</em>
          </h2>
        </div>
        <div className="briefing-copy">
          <span>CURRENT POSITION</span>
          <p>{derived.briefing.state}</p>
          <span>WHAT DEMANDS VIGILANCE</span>
          <p>{derived.briefing.matters}</p>
          <span>OPTIMAL NEXT MOVE</span>
          <p>{derived.briefing.next}</p>
        </div>
      </section>

      {/* 11. Interactive Decision Support Move */}
      <section className="next-action">
        <div>
          <span className="panel-kicker">DECISION SUPPORT ENGINE</span>
          <h2>What should I do right now?</h2>
          <p>{derived.nextAction}</p>
        </div>
        <button onClick={() => setActionOpen(!actionOpen)}>
          {actionOpen ? 'Hide Strategic Detail' : 'Explore Next Move'} <span>↗</span>
        </button>
        {actionOpen && (
          <div className="next-action-detail">
            <p>{derived.nextReason}</p>
            <button onClick={() => navigate(derived.nextRoute)}>
              Open {derived.nextRoute} in FINOVA ↗
            </button>
          </div>
        )}
      </section>

      {/* 12. Direct Workspace Navigation Links */}
      <section className="health-actions">
        <button onClick={() => navigate('Money')}>Review Spending ↗</button>
        <button onClick={() => navigate('Cash Flow')}>Open Cash Flow ↗</button>
        <button onClick={() => navigate('Smart Purchases')}>Evaluate Purchase ↗</button>
        <button onClick={() => navigate('Goals')}>Manage Goals ↗</button>
        <button onClick={openEvent}>Simulate Emergency ↗</button>
        <button onClick={() => navigate('AI Advisor')}>Consult Advisor ↗</button>
      </section>
    </div>
  )
}

function RadarChart({
  radarData,
  onSelectDimension,
}: {
  radarData: { name: string; score: number }[]
  onSelectDimension?: (name: string) => void
}) {
  const center = 150
  const maxRadius = 110

  const items = radarData && radarData.length > 0 ? radarData : [
    { name: 'Cash Flow', score: 50 },
    { name: 'Savings', score: 50 },
    { name: 'Spending', score: 50 },
    { name: 'Goals', score: 50 },
    { name: 'Commitments', score: 50 },
    { name: 'Emergency', score: 50 },
  ]

  const numAxes = items.length

  // Generate outer polygon points
  const points = items
    .map((item, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / numAxes
      const normalized = Math.max(10, Math.min(100, item.score)) / 100
      const radius = normalized * maxRadius
      return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`
    })
    .join(' ')

  const axes = items.map((item, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / numAxes
    const x = center + Math.cos(angle) * maxRadius
    const y = center + Math.sin(angle) * maxRadius
    return (
      <g key={item.name} className="cursor-pointer" onClick={() => onSelectDimension?.(item.name)}>
        <line
          x1={center}
          y1={center}
          x2={x}
          y2={y}
          stroke="var(--os-line)"
          strokeWidth="1"
        />
      </g>
    )
  })

  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="Financial health radar visualization" className="w-full max-w-[430px]">
      {/* Concentric reference rings */}
      <circle cx={center} cy={center} r={maxRadius} fill="none" stroke="var(--os-line)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx={center} cy={center} r={maxRadius * 0.75} fill="none" stroke="var(--os-line-subtle)" strokeWidth="1" />
      <circle cx={center} cy={center} r={maxRadius * 0.5} fill="none" stroke="var(--os-line-subtle)" strokeWidth="1" />
      <circle cx={center} cy={center} r={maxRadius * 0.25} fill="none" stroke="var(--os-line-subtle)" strokeWidth="1" />
      
      {/* Axes */}
      {axes}

      {/* Polygon representing current state */}
      <polygon
        points={points}
        fill="rgba(152, 17, 30, 0.12)"
        stroke="#98111E"
        strokeWidth="2"
        style={{ transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />

      {/* Vertex markers */}
      {items.map((item, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / numAxes
        const normalized = Math.max(10, Math.min(100, item.score)) / 100
        const radius = normalized * maxRadius
        const cx = center + Math.cos(angle) * radius
        const cy = center + Math.sin(angle) * radius
        return (
          <circle
            key={item.name}
            cx={cx}
            cy={cy}
            r="4"
            fill="#98111E"
            stroke="#FFFDF8"
            strokeWidth="1.5"
            className="cursor-pointer hover:scale-125 transition-transform"
            onClick={() => onSelectDimension?.(item.name)}
          />
        )
      })}
    </svg>
  )
}

