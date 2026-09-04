import React, { useState, useMemo } from 'react'
import { useFinance, formatINR } from '../finance/FinanceContext'
import { calculateFinancialIntelligence } from '../finance/FinancialIntelligence'
import { logAuditEvent } from '../audit/auditLogger'
import {
  Sliders,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RotateCcw,
  Save,
  Check,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Info
} from 'lucide-react'

export type ScenarioType =
  | 'Major Purchase'
  | 'Income Change'
  | 'Expense Shock'
  | 'Goal Acceleration'
  | 'Investment Shift'
  | 'Custom Scenario'

interface SavedScenario {
  id: string
  name: string
  type: ScenarioType
  purchaseAmount: number
  incomeDelta: number
  expenseDelta: number
  goalContributionDelta: number
  notes: string
  createdAt: string
}

export default function WhatIfSimulator() {
  const { state: liveState, intelligence: liveIntel, updateBalance, updateIncome } = useFinance()

  // Scenario parameters
  const [scenarioType, setScenarioType] = useState<ScenarioType>('Major Purchase')
  const [purchaseAmount, setPurchaseAmount] = useState<number>(45000)
  const [incomeDelta, setIncomeDelta] = useState<number>(0)
  const [expenseDelta, setExpenseDelta] = useState<number>(0)
  const [goalContributionDelta, setGoalContributionDelta] = useState<number>(0)
  const [scenarioNotes, setScenarioNotes] = useState<string>('')

  // Scenario management
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    try {
      const stored = localStorage.getItem('finova-saved-scenarios-v1')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [appliedFeedback, setAppliedFeedback] = useState(false)

  // Derive Simulated State (Completely isolated from liveState)
  const simState = useMemo(() => {
    const nextBalance = Math.max(0, liveState.balance - purchaseAmount)
    const nextIncome = Math.max(0, liveState.income + incomeDelta)
    const nextSpending = Math.max(0, liveState.monthlySpending + expenseDelta)

    // Clone goals with adjusted contribution if requested
    const nextGoals = liveState.goals.map(g => {
      const addedSaved = Math.max(0, (g.saved || 0) + (goalContributionDelta / (liveState.goals.length || 1)))
      return { ...g, saved: addedSaved }
    })

    // Clone commitments
    const nextCommitments = [...liveState.commitments]

    // Recalculate safe to spend: Balance - Commitments - (monthlySpending + expenseDelta)
    const totalCommitments = nextCommitments.reduce((sum, c) => sum + c.amount, 0)
    const nextSafeToSpend = Math.max(0, nextBalance - totalCommitments - nextSpending)

    // Compute synthetic health score shift
    const balanceRatio = nextBalance / (liveState.balance || 1)
    const surplusRatio = (nextIncome - nextSpending - totalCommitments) / Math.max(1, liveState.income - liveState.monthlySpending - totalCommitments)
    const healthShift = Math.round((balanceRatio - 1) * 15 + (surplusRatio - 1) * 15)
    const nextHealth = Math.min(100, Math.max(10, liveState.financialHealth + healthShift))

    return {
      ...liveState,
      balance: nextBalance,
      income: nextIncome,
      monthlySpending: nextSpending,
      safeToSpend: nextSafeToSpend,
      financialHealth: nextHealth,
      goals: nextGoals,
      commitments: nextCommitments
    }
  }, [liveState, purchaseAmount, incomeDelta, expenseDelta, goalContributionDelta])

  // Derive Simulated Intelligence
  const simIntel = useMemo(() => {
    return calculateFinancialIntelligence(simState)
  }, [simState])

  // Compare Deltas
  const balanceDelta = simState.balance - liveState.balance
  const safeToSpendDelta = simState.safeToSpend - liveState.safeToSpend
  const healthDelta = simState.financialHealth - liveState.financialHealth
  const runwayDelta = simIntel.cashFlow.runwayDays - liveIntel.cashFlow.runwayDays

  // Reset scenario
  const resetToBaseline = () => {
    setPurchaseAmount(0)
    setIncomeDelta(0)
    setExpenseDelta(0)
    setGoalContributionDelta(0)
    setScenarioNotes('')
  }

  // Save Scenario
  const handleSaveScenario = () => {
    const newScenario: SavedScenario = {
      id: `scen-${Date.now()}`,
      name: `${scenarioType} Simulation (${new Date().toLocaleDateString()})`,
      type: scenarioType,
      purchaseAmount,
      incomeDelta,
      expenseDelta,
      goalContributionDelta,
      notes: scenarioNotes || `Simulated with purchase of ${formatINR(purchaseAmount)}`,
      createdAt: new Date().toISOString()
    }
    const updated = [newScenario, ...savedScenarios]
    setSavedScenarios(updated)
    localStorage.setItem('finova-saved-scenarios-v1', JSON.stringify(updated))

    logAuditEvent({
      eventType: 'Scenario Simulated',
      category: 'SIMULATION',
      description: `Scenario saved: ${newScenario.name}`,
      source: 'ENGINE',
      relatedEntity: newScenario.name,
      amount: purchaseAmount,
      severity: 'INFO',
      isDemo: true
    })
  }

  // Load Scenario
  const handleLoadScenario = (sc: SavedScenario) => {
    setScenarioType(sc.type)
    setPurchaseAmount(sc.purchaseAmount)
    setIncomeDelta(sc.incomeDelta)
    setExpenseDelta(sc.expenseDelta)
    setGoalContributionDelta(sc.goalContributionDelta)
    setScenarioNotes(sc.notes)
  }

  // Apply to Live State
  const handleApplyToLive = () => {
    setShowApplyModal(false)

    // Update live state with simulated deltas
    if (purchaseAmount > 0) {
      updateBalance(simState.balance)
    }
    if (incomeDelta !== 0) {
      updateIncome(simState.income)
    }

    logAuditEvent({
      eventType: 'Scenario Applied',
      category: 'SIMULATION',
      description: `User applied simulated scenario '${scenarioType}' to live state. Balance changed by ${formatINR(balanceDelta)}, Income changed by ${formatINR(incomeDelta)}.`,
      source: 'USER',
      relatedEntity: scenarioType,
      amount: purchaseAmount,
      severity: 'WARNING',
      isDemo: true
    })

    setAppliedFeedback(true)
    setTimeout(() => setAppliedFeedback(false), 3000)
  }

  return (
    <div className="workspace-page" style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div className="page-intro" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="eyebrow" style={{ color: '#98111E', fontWeight: 700, letterSpacing: '0.12em' }}>
              FINOVA OS /// WHAT-IF SIMULATOR
            </span>
            <span
              style={{
                fontSize: '10px',
                background: '#FFF8E1',
                border: '1px solid #FFE082',
                color: '#B78103',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 700
              }}
            >
              SIMULATION ACTIVE (ISOLATED)
            </span>
          </div>
          <h1 style={{ fontSize: '28px', color: '#211A17', margin: '4px 0 6px 0', fontFamily: 'Manrope, sans-serif' }}>
            Financial Scenario Simulator
          </h1>
          <p style={{ color: '#756A60', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
            Model major cash disbursements, income shifts, expense shocks, and goal acceleration without altering live financial records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={resetToBaseline}
            style={{
              padding: '8px 14px',
              background: '#FFFDF8',
              border: '1px solid #DED4C5',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#211A17',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleSaveScenario}
            style={{
              padding: '8px 14px',
              background: '#F8F4EC',
              border: '1px solid #DED4C5',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#211A17',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600
            }}
          >
            <Save size={14} />
            Save Scenario
          </button>
          <button
            onClick={() => setShowApplyModal(true)}
            style={{
              padding: '8px 16px',
              background: '#98111E',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#FFFDF8',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Zap size={14} />
            Apply to Live State...
          </button>
        </div>
      </div>

      {appliedFeedback && (
        <div
          style={{
            background: '#E8F5E9',
            border: '1px solid #C8E6C9',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#1B5E20',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle size={16} />
          <span>Scenario successfully committed to live financial state! Audit event recorded.</span>
        </div>
      )}

      {/* Preset Scenario Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { type: 'Major Purchase', defAmt: 45000, inc: 0, exp: 0, label: 'Major Purchase (e.g. ₹45k)' },
          { type: 'Income Change', defAmt: 0, inc: 20000, exp: 0, label: 'Income Raise (+₹20k/mo)' },
          { type: 'Expense Shock', defAmt: 0, inc: 0, exp: 12000, label: 'Expense Shock (+₹12k/mo)' },
          { type: 'Goal Acceleration', defAmt: 0, inc: 0, exp: 0, label: 'Accelerate MacBook Goal' },
          { type: 'Investment Shift', defAmt: 30000, inc: 0, exp: 0, label: 'Lump Sum Investment (₹30k)' },
          { type: 'Custom Scenario', defAmt: 0, inc: 0, exp: 0, label: 'Custom Scenario' }
        ].map(preset => (
          <button
            key={preset.type}
            onClick={() => {
              setScenarioType(preset.type as ScenarioType)
              if (preset.type === 'Major Purchase') setPurchaseAmount(preset.defAmt)
              else if (preset.type === 'Income Change') setIncomeDelta(preset.inc)
              else if (preset.type === 'Expense Shock') setExpenseDelta(preset.exp)
              else if (preset.type === 'Investment Shift') setPurchaseAmount(preset.defAmt)
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              border: scenarioType === preset.type ? '1px solid #98111E' : '1px solid #DED4C5',
              background: scenarioType === preset.type ? '#98111E' : '#FFFDF8',
              color: scenarioType === preset.type ? '#FFFDF8' : '#211A17',
              fontWeight: 600
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Two Column Layout: Controls (Left) vs Real-Time Impact Matrix (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Controls Column */}
        <div
          style={{
            background: '#FFFDF8',
            border: '1px solid #DED4C5',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <span className="panel-kicker" style={{ color: '#98111E' }}>SCENARIO PARAMETERS</span>

          {/* One-time Outflow / Purchase */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <label style={{ color: '#211A17', fontWeight: 600 }}>One-Time Outflow / Purchase</label>
              <strong style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#98111E' }}>
                {formatINR(purchaseAmount)}
              </strong>
            </div>
            <input
              type="range"
              min={0}
              max={150000}
              step={2500}
              value={purchaseAmount}
              onChange={e => setPurchaseAmount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#98111E' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#756A60', marginTop: '2px' }}>
              <span>₹0</span>
              <span>₹75k</span>
              <span>₹1.5L</span>
            </div>
          </div>

          {/* Monthly Income Delta */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <label style={{ color: '#211A17', fontWeight: 600 }}>Monthly Income Delta</label>
              <strong style={{ fontFamily: "'IBM Plex Mono', monospace", color: incomeDelta >= 0 ? '#166534' : '#98111E' }}>
                {incomeDelta >= 0 ? '+' : ''}{formatINR(incomeDelta)}/mo
              </strong>
            </div>
            <input
              type="range"
              min={-40000}
              max={60000}
              step={2000}
              value={incomeDelta}
              onChange={e => setIncomeDelta(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#166534' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#756A60', marginTop: '2px' }}>
              <span>-₹40k</span>
              <span>Baseline (₹0)</span>
              <span>+₹60k</span>
            </div>
          </div>

          {/* Monthly Spending Delta */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <label style={{ color: '#211A17', fontWeight: 600 }}>Monthly Spending Delta</label>
              <strong style={{ fontFamily: "'IBM Plex Mono', monospace", color: expenseDelta > 0 ? '#98111E' : '#166534' }}>
                {expenseDelta >= 0 ? '+' : ''}{formatINR(expenseDelta)}/mo
              </strong>
            </div>
            <input
              type="range"
              min={-20000}
              max={40000}
              step={1000}
              value={expenseDelta}
              onChange={e => setExpenseDelta(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#98111E' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#756A60', marginTop: '2px' }}>
              <span>-₹20k (Cut)</span>
              <span>Baseline</span>
              <span>+₹40k (Inflation)</span>
            </div>
          </div>

          {/* Goal Extra Contribution */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <label style={{ color: '#211A17', fontWeight: 600 }}>Lump-Sum to Goals</label>
              <strong style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#166534' }}>
                +{formatINR(goalContributionDelta)}
              </strong>
            </div>
            <input
              type="range"
              min={0}
              max={50000}
              step={2000}
              value={goalContributionDelta}
              onChange={e => setGoalContributionDelta(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#166534' }}
            />
          </div>

          {/* Saved Scenarios Quick List */}
          {savedScenarios.length > 0 && (
            <div style={{ borderTop: '1px solid #DED4C5', paddingTop: '14px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'IBM Plex Mono', monospace", display: 'block', marginBottom: '8px' }}>
                SAVED SCENARIOS ({savedScenarios.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {savedScenarios.slice(0, 3).map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => handleLoadScenario(sc)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: '#F8F4EC',
                      border: '1px solid #DED4C5',
                      fontSize: '11px',
                      color: '#211A17',
                      cursor: 'pointer'
                    }}
                  >
                    <strong>{sc.name}</strong>
                    <small style={{ display: 'block', color: '#756A60' }}>{sc.notes}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Real-Time Impact Matrix Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Comparison Cards: Live vs Simulated */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {/* Safe to Spend */}
            <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '10px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase' }}>SAFE TO SPEND</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <strong style={{ fontSize: '20px', color: simState.safeToSpend > 0 ? '#166534' : '#98111E', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatINR(simState.safeToSpend)}
                </strong>
              </div>
              <small style={{ color: safeToSpendDelta >= 0 ? '#166534' : '#98111E', fontSize: '11px', fontWeight: 600 }}>
                {safeToSpendDelta >= 0 ? '+' : ''}{formatINR(safeToSpendDelta)} vs Live
              </small>
            </div>

            {/* Health Score */}
            <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '10px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase' }}>FINANCIAL HEALTH</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <strong style={{ fontSize: '20px', color: '#211A17', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {simState.financialHealth}/100
                </strong>
              </div>
              <small style={{ color: healthDelta >= 0 ? '#166534' : '#98111E', fontSize: '11px', fontWeight: 600 }}>
                {healthDelta >= 0 ? '+' : ''}{healthDelta} pts shift
              </small>
            </div>

            {/* Solvency Runway */}
            <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '10px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase' }}>SOLVENCY RUNWAY</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <strong style={{ fontSize: '20px', color: '#211A17', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {simIntel.cashFlow.runwayDays} days
                </strong>
              </div>
              <small style={{ color: runwayDelta >= 0 ? '#166534' : '#98111E', fontSize: '11px', fontWeight: 600 }}>
                {runwayDelta >= 0 ? '+' : ''}{runwayDelta} days change
              </small>
            </div>

            {/* Projected Balance */}
            <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '10px', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: '#756A60', textTransform: 'uppercase' }}>NET LIQUID CASH</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                <strong style={{ fontSize: '20px', color: '#211A17', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatINR(simState.balance)}
                </strong>
              </div>
              <small style={{ color: balanceDelta >= 0 ? '#166534' : '#98111E', fontSize: '11px', fontWeight: 600 }}>
                {balanceDelta >= 0 ? '+' : ''}{formatINR(balanceDelta)}
              </small>
            </div>
          </div>

          {/* Goal Timelines Impact */}
          <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '12px', padding: '20px' }}>
            <span className="panel-kicker" style={{ color: '#98111E' }}>IMPACT ON GOAL TIMELINES</span>
            <h3 style={{ fontSize: '16px', color: '#211A17', margin: '4px 0 12px 0', fontFamily: 'Manrope, sans-serif' }}>
              Target Fulfillment Projections
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {simIntel.goals.items.map((g: any) => {
                const liveGoal = liveIntel.goals.items.find((lg: any) => lg.id === g.id) || g
                const monthsDiff = g.estimatedMonths - liveGoal.estimatedMonths

                return (
                  <div key={g.id} style={{ background: '#F8F4EC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #DED4C5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#211A17' }}>{g.name}</strong>
                      <span style={{ fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: '#211A17' }}>
                        {g.progress}% Complete
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#756A60', marginTop: '4px' }}>
                      <span>Target: {formatINR(g.target)}</span>
                      <span>
                        Simulated timeline: {g.estimatedMonths} months
                        {monthsDiff !== 0 && (
                          <strong style={{ color: monthsDiff > 0 ? '#98111E' : '#166534', marginLeft: '4px' }}>
                            ({monthsDiff > 0 ? `+${monthsDiff} mo delay` : `${monthsDiff} mo faster`})
                          </strong>
                        )}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Risk Assessment & Recommendations */}
          <div style={{ background: '#FFFDF8', border: '1px solid #DED4C5', borderRadius: '12px', padding: '20px' }}>
            <span className="panel-kicker" style={{ color: '#98111E' }}>ENGINE EVALUATION & RECOMMENDATIONS</span>
            <h3 style={{ fontSize: '16px', color: '#211A17', margin: '4px 0 10px 0', fontFamily: 'Manrope, sans-serif' }}>
              Scenario Verdict: {simState.safeToSpend > 15000 ? 'LOW RISK' : simState.safeToSpend > 0 ? 'MODERATE RISK' : 'HIGH RISK'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#211A17', lineHeight: 1.5 }}>
              {simState.safeToSpend <= 0 ? (
                <div style={{ display: 'flex', gap: '8px', color: '#98111E', background: '#FFEBEE', padding: '10px 14px', borderRadius: '6px', border: '1px solid #FFCDD2' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Deficit Warning:</strong> This scenario drops Safe to Spend into negative territory ({formatINR(simState.safeToSpend)}), jeopardizing next month's recurring commitments.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', color: '#166534', background: '#E8F5E9', padding: '10px 14px', borderRadius: '6px', border: '1px solid #C8E6C9' }}>
                  <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    <strong>Capital Safe:</strong> Remaining buffer of {formatINR(simState.safeToSpend)} ensures all ringfenced commitments ({formatINR(liveIntel.commitments.totalActiveCommitments)}) remain fully solvent.
                  </span>
                </div>
              )}

              <p style={{ margin: 0, color: '#756A60', fontSize: '12px' }}>
                • Projected monthly surplus after this adjustment will be {formatINR(simIntel.cashFlow.monthlySurplus)}/month.
                <br />
                • Emergency runway remains protected at {simIntel.cashFlow.runwayDays} days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Apply Scenario */}
      {showApplyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(33, 26, 23, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            style={{
              background: '#FFFDF8',
              border: '1px solid #DED4C5',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            <span className="panel-kicker" style={{ color: '#98111E' }}>CONFIRM APPLICATION TO LIVE STATE</span>
            <h3 style={{ fontSize: '18px', color: '#211A17', margin: '6px 0 10px 0', fontFamily: 'Manrope, sans-serif' }}>
              Apply "{scenarioType}" to Live Financial State?
            </h3>
            <p style={{ fontSize: '13px', color: '#756A60', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              This will update your live balance from {formatINR(liveState.balance)} to {formatINR(simState.balance)} and adjust your active financial trajectory. All modifications are logged to the Audit Trail.
            </p>

            <div style={{ background: '#F8F4EC', padding: '12px', borderRadius: '8px', border: '1px solid #DED4C5', marginBottom: '16px', fontSize: '12px' }}>
              <div>• Balance Delta: <strong style={{ color: balanceDelta < 0 ? '#98111E' : '#166534' }}>{formatINR(balanceDelta)}</strong></div>
              <div>• Income Delta: <strong>{formatINR(incomeDelta)}/mo</strong></div>
              <div>• Safe to Spend Delta: <strong style={{ color: safeToSpendDelta < 0 ? '#98111E' : '#166534' }}>{formatINR(safeToSpendDelta)}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowApplyModal(false)}
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
                Cancel
              </button>
              <button
                onClick={handleApplyToLive}
                style={{
                  padding: '8px 18px',
                  background: '#98111E',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#FFFDF8',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Yes, Apply to Live State ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
