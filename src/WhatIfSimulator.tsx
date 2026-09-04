import React, { useState } from 'react'
import {
  useFinance,
  formatINR,
  type FinancialScenario,
  type SimulationResult,
} from './finance/FinanceContext'
import PulsatingBorder from './components/originkit/ui/pulsating-border-custom-style'
import {
  ShieldCheck,
  Zap,
  Sliders,
  Check,
  AlertTriangle,
} from 'lucide-react'

export default function WhatIfSimulator() {
  const { state: finance, simulateScenario, setState } = useFinance()

  const [scenarioType, setScenarioType] = useState<
    'PURCHASE' | 'INCOME_CHANGE' | 'EXPENSE_CHANGE' | 'COMMITMENT_CHANGE' | 'GOAL_CONTRIBUTION'
  >('PURCHASE')

  // Purchase state
  const [purchaseAmount, setPurchaseAmount] = useState<number>(25000)
  const [purchaseName, setPurchaseName] = useState<string>('New Gadget')
  const [purchaseCategory, setPurchaseCategory] = useState<string>('Shopping')
  const [isInstallment, setIsInstallment] = useState<boolean>(false)
  const [installmentAmount, setInstallmentAmount] = useState<number>(5000)

  // Income state
  const [incomeDelta, setIncomeDelta] = useState<number>(15000)
  const [incomeSource, setIncomeSource] = useState<string>('Freelance Client')
  const [isRecurringIncome, setIsRecurringIncome] = useState<boolean>(true)

  // Expense state
  const [expenseDelta, setExpenseDelta] = useState<number>(8000)
  const [expenseCategory, setExpenseCategory] = useState<string>('Dining & Out')

  // Commitment state
  const [commitmentAmount, setCommitmentAmount] = useState<number>(6500)
  const [commitmentName, setCommitmentName] = useState<string>('New Vehicle Insurance')
  const [commitmentAction, setCommitmentAction] = useState<'ADD' | 'REMOVE'>('ADD')

  // Goal boost state
  const [goalBoostAmount, setGoalBoostAmount] = useState<number>(10000)
  const [selectedGoalId, setSelectedGoalId] = useState<string>(finance.goals[0]?.id || '')

  const [applySuccess, setApplySuccess] = useState<string | null>(null)

  // Derive scenario object
  const currentScenario: FinancialScenario = React.useMemo(() => {
    switch (scenarioType) {
      case 'PURCHASE':
        return {
          type: 'PURCHASE',
          amount: purchaseAmount,
          name: purchaseName,
          category: purchaseCategory,
          installment: isInstallment ? installmentAmount : 0,
        }
      case 'INCOME_CHANGE':
        return {
          type: 'INCOME_CHANGE',
          amount: incomeDelta,
          source: incomeSource,
          changeType: 'DELTA',
          isRecurring: isRecurringIncome,
        }
      case 'EXPENSE_CHANGE':
        return {
          type: 'EXPENSE_CHANGE',
          amount: expenseDelta,
          category: expenseCategory,
          changeType: 'DELTA',
        }
      case 'COMMITMENT_CHANGE':
        return {
          type: 'COMMITMENT_CHANGE',
          action: commitmentAction,
          name: commitmentName,
          amount: commitmentAmount,
        }
      case 'GOAL_CONTRIBUTION':
        return {
          type: 'GOAL_CONTRIBUTION',
          amount: goalBoostAmount,
          goalId: selectedGoalId,
        }
    }
  }, [
    scenarioType,
    purchaseAmount,
    purchaseName,
    purchaseCategory,
    isInstallment,
    installmentAmount,
    incomeDelta,
    incomeSource,
    isRecurringIncome,
    expenseDelta,
    expenseCategory,
    commitmentAction,
    commitmentName,
    commitmentAmount,
    goalBoostAmount,
    selectedGoalId,
  ])

  // Run deterministic simulation
  const result: SimulationResult = React.useMemo(() => {
    return simulateScenario(currentScenario)
  }, [simulateScenario, currentScenario])

  const handleApplyToRealState = () => {
    setState(result.simulatedState)
    setApplySuccess('Simulation applied successfully to active financial state!')
    setTimeout(() => setApplySuccess(null), 4000)
  }

  const statusBg =
    result.statusTag === 'SAFE'
      ? 'rgba(34, 197, 94, 0.12)'
      : result.statusTag === 'CONSIDER'
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(239, 68, 68, 0.12)'

  const statusBorder =
    result.statusTag === 'SAFE'
      ? 'rgba(34, 197, 94, 0.4)'
      : result.statusTag === 'CONSIDER'
      ? 'rgba(245, 158, 11, 0.4)'
      : 'rgba(239, 68, 68, 0.4)'

  const statusColor =
    result.statusTag === 'SAFE' ? '#4ade80' : result.statusTag === 'CONSIDER' ? '#fbbf24' : '#f87171'

  return (
    <div className="workspace-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">WHAT-IF / DETERMINISTIC SIMULATION SPACE</span>
          <h1>
            Simulate Financial Moves.<br />
            <em>See the exact outcome.</em>
          </h1>
          <p>
            Test major spending, income shifts, commitments, or goal boosts before taking action.
            FINOVA models the exact downstream consequence on your liquidity, goals, and stability.
          </p>
        </div>
        <div className="date-chip">
          <Sliders className="w-3.5 h-3.5 text-cyan-400 inline mr-1" />
          <span>INSTANT SIMULATION ENGINE</span>
        </div>
      </div>

      {applySuccess && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            color: '#86efac',
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
          }}
        >
          <Check className="w-5 h-5 text-[#D72638] shrink-0" />
          <span>{applySuccess}</span>
        </div>
      )}

      {/* Scenario Mode Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '20px',
        }}
      >
        {[
          { id: 'PURCHASE', label: '🛍️ Discretionary Purchase' },
          { id: 'INCOME_CHANGE', label: '📈 Income Shift' },
          { id: 'EXPENSE_CHANGE', label: '📉 Expense / Lifestyle' },
          { id: 'COMMITMENT_CHANGE', label: '📑 Recurring Commitment' },
          { id: 'GOAL_CONTRIBUTION', label: '🎯 Goal Acceleration' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setScenarioType(tab.id as any)}
            style={{
              padding: '10px 16px',
              borderRadius: '30px',
              fontSize: '12px',
              fontFamily: "'DM Mono', monospace",
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border:
                scenarioType === tab.id
                  ? '1px solid #98111E'
                  : '1px solid var(--os-line)',
              background:
                scenarioType === tab.id ? '#FFFDF8' : '#F8F4EC',
              color: scenarioType === tab.id ? '#98111E' : '#756A60',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 380px) 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Controls Column */}
        <section
          style={{
            background: '#FFFDF8',
            border: '1px solid var(--os-line)',
            borderRadius: '18px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 4px 20px rgba(63, 13, 18, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="panel-kicker">SCENARIO PARAMETERS</span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: "'DM Mono', monospace",
                color: '#98111E',
                fontWeight: 600,
              }}
            >
              ISOLATED SANDBOX
            </span>
          </div>

          {scenarioType === 'PURCHASE' && (
            <>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'DM Mono', monospace",
                    color: '#94a3b8',
                    marginBottom: '6px',
                  }}
                >
                  PURCHASE NAME
                </label>
                <input
                  className="modal-input"
                  value={purchaseName}
                  onChange={e => setPurchaseName(e.target.value)}
                  placeholder="e.g. Sony Headphones"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '11px',
                      fontFamily: "'DM Mono', monospace",
                      color: '#94a3b8',
                    }}
                  >
                    AMOUNT (INR)
                  </label>
                  <strong style={{ color: '#64eaff', fontSize: '14px' }}>
                    {formatINR(purchaseAmount)}
                  </strong>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="150000"
                  step="1000"
                  value={purchaseAmount}
                  onChange={e => setPurchaseAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#64eaff' }}
                />
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  {[5000, 15000, 30000, 60000, 100000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPurchaseAmount(val)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.03)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {formatINR(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'DM Mono', monospace",
                    color: '#94a3b8',
                    marginBottom: '6px',
                  }}
                >
                  CATEGORY
                </label>
                <select
                  value={purchaseCategory}
                  onChange={e => setPurchaseCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--os-line)',
                    background: '#F8F4EC',
                    color: '#211A17',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="Shopping">Shopping</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Travel">Travel</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Home">Home</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#F8F4EC',
                  border: '1px solid var(--os-line)',
                }}
              >
                <input
                  type="checkbox"
                  id="installment-chk"
                  checked={isInstallment}
                  onChange={e => setIsInstallment(e.target.checked)}
                  style={{ accentColor: '#64eaff', width: '16px', height: '16px' }}
                />
                <label
                  htmlFor="installment-chk"
                  style={{ fontSize: '12px', color: '#e2e8f0', cursor: 'pointer' }}
                >
                  Pay in Monthly Installments (EMI)
                </label>
              </div>

              {isInstallment && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '11px',
                        fontFamily: "'DM Mono', monospace",
                        color: '#756A60',
                      }}
                    >
                      MONTHLY EMI (INR)
                    </label>
                    <strong style={{ color: '#98111E', fontSize: '13px' }}>
                      {formatINR(installmentAmount)}/mo
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="25000"
                    step="500"
                    value={installmentAmount}
                    onChange={e => setInstallmentAmount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#98111E' }}
                  />
                </div>
              )}
            </>
          )}

          {scenarioType === 'INCOME_CHANGE' && (
            <>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'DM Mono', monospace",
                    color: '#756A60',
                    marginBottom: '6px',
                  }}
                >
                  INCOME SOURCE
                </label>
                <input
                  className="modal-input"
                  value={incomeSource}
                  onChange={e => setIncomeSource(e.target.value)}
                  placeholder="e.g. Salary hike or consulting"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '11px',
                      fontFamily: "'DM Mono', monospace",
                      color: '#756A60',
                    }}
                  >
                    MONTHLY DELTA
                  </label>
                  <strong style={{ color: '#166534', fontSize: '14px' }}>
                    +{formatINR(incomeDelta)}
                  </strong>
                </div>
                <input
                  type="range"
                  min="-30000"
                  max="100000"
                  step="2500"
                  value={incomeDelta}
                  onChange={e => setIncomeDelta(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#166534' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#F8F4EC',
                  border: '1px solid var(--os-line)',
                }}
              >
                <input
                  type="checkbox"
                  id="recurring-income-chk"
                  checked={isRecurringIncome}
                  onChange={e => setIsRecurringIncome(e.target.checked)}
                  style={{ accentColor: '#166534', width: '16px', height: '16px' }}
                />
                <label
                  htmlFor="recurring-income-chk"
                  style={{ fontSize: '12px', color: '#211A17', cursor: 'pointer' }}
                >
                  Recurring Monthly Stream (vs One-time Inflow)
                </label>
              </div>
            </>
          )}

          {scenarioType === 'EXPENSE_CHANGE' && (
            <>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'DM Mono', monospace",
                    color: '#756A60',
                    marginBottom: '6px',
                  }}
                >
                  EXPENSE CATEGORY
                </label>
                <input
                  className="modal-input"
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  placeholder="e.g. Food & Dining"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '11px',
                      fontFamily: "'DM Mono', monospace",
                      color: '#756A60',
                    }}
                  >
                    EXPENSE DELTA
                  </label>
                  <strong style={{ color: '#991b1b', fontSize: '14px' }}>
                    {expenseDelta >= 0 ? `+${formatINR(expenseDelta)}` : formatINR(expenseDelta)}
                  </strong>
                </div>
                <input
                  type="range"
                  min="-20000"
                  max="40000"
                  step="1000"
                  value={expenseDelta}
                  onChange={e => setExpenseDelta(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#98111E' }}
                />
              </div>
            </>
          )}

          {scenarioType === 'COMMITMENT_CHANGE' && (
            <>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'DM Mono', monospace",
                    color: '#756A60',
                    marginBottom: '6px',
                  }}
                >
                  ACTION
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCommitmentAction('ADD')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border:
                        commitmentAction === 'ADD'
                          ? '1px solid #98111E'
                          : '1px solid var(--os-line)',
                      background:
                        commitmentAction === 'ADD'
                          ? '#FFFDF8'
                          : '#F8F4EC',
                      color: commitmentAction === 'ADD' ? '#98111E' : '#756A60',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    + Add New
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommitmentAction('REMOVE')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border:
                        commitmentAction === 'REMOVE'
                          ? '1px solid #991b1b'
                          : '1px solid var(--os-line)',
                      background:
                        commitmentAction === 'REMOVE'
                          ? '#FFFDF8'
                          : '#F8F4EC',
                      color: commitmentAction === 'REMOVE' ? '#991b1b' : '#756A60',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    − Terminate
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'DM Mono', monospace",
                    color: '#756A60',
                    marginBottom: '6px',
                  }}
                >
                  COMMITMENT NAME
                </label>
                <input
                  className="modal-input"
                  value={commitmentName}
                  onChange={e => setCommitmentName(e.target.value)}
                  placeholder="e.g. Health Insurance"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '11px',
                      fontFamily: "'DM Mono', monospace",
                      color: '#756A60',
                    }}
                  >
                    AMOUNT (INR)
                  </label>
                  <strong style={{ color: '#b45309', fontSize: '14px' }}>
                    {formatINR(commitmentAmount)}
                  </strong>
                </div>
                <input
                  type="range"
                  min="500"
                  max="35000"
                  step="500"
                  value={commitmentAmount}
                  onChange={e => setCommitmentAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#98111E' }}
                />
              </div>
            </>
          )}

          {scenarioType === 'GOAL_CONTRIBUTION' && (
            <>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: "'DM Mono', monospace",
                    color: '#756A60',
                    marginBottom: '6px',
                  }}
                >
                  TARGET GOAL
                </label>
                <select
                  value={selectedGoalId}
                  onChange={e => setSelectedGoalId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--os-line)',
                    background: '#F8F4EC',
                    color: '#211A17',
                    fontFamily: 'inherit',
                  }}
                >
                  {finance.goals.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({formatINR(g.saved)} / {formatINR(g.target)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '11px',
                      fontFamily: "'DM Mono', monospace",
                      color: '#756A60',
                    }}
                  >
                    ONE-TIME CONTRIBUTION
                  </label>
                  <strong style={{ color: '#166534', fontSize: '14px' }}>
                    {formatINR(goalBoostAmount)}
                  </strong>
                </div>
                <input
                  type="range"
                  min="1000"
                  max={Math.max(10000, finance.balance)}
                  step="1000"
                  value={goalBoostAmount}
                  onChange={e => setGoalBoostAmount(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#166534' }}
                />
              </div>
            </>
          )}

          <div style={{ borderTop: '1px solid var(--os-line)', paddingTop: '16px' }}>
            <button
              type="button"
              className="soft-button"
              onClick={handleApplyToRealState}
              style={{
                width: '100%',
                margin: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                fontWeight: 600,
              }}
            >
              <Zap className="w-4 h-4 text-[#98111E]" />
              <span>Apply to Real Financial State</span>
            </button>
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '11px',
                color: '#756A60',
                textAlign: 'center',
              }}
            >
              Will immutably commit this simulated outcome into your active state.
            </p>
          </div>
        </section>

        {/* Results Column */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Outcome Assessment Card */}
          <PulsatingBorder
            colors={
              result.statusTag === 'SAFE'
                ? ['#4ade80', '#64eaff', '#4ade80']
                : result.statusTag === 'CONSIDER'
                ? ['#fbbf24', '#f59e0b', '#fbbf24']
                : ['#f87171', '#ef4444', '#f87171']
            }
            radius={18}
            thickness={2}
            intensity={18}
            bloom={28}
            style={{ display: 'block' }}
          >
            <div
              style={{
                background: '#FFFDF8',
                border: '1px solid var(--os-line)',
                borderRadius: '18px',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 4px 20px rgba(63, 13, 18, 0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: statusBg,
                    border: `1px solid ${statusBorder}`,
                    color: statusColor,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {result.statusTag === 'SAFE' ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  {result.statusTag} · IMPACT SCORE: {result.impactScore}/100
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "'DM Mono', monospace",
                    color: 'var(--os-muted)',
                  }}
                >
                  DETERMINISTIC SIMULATION RESULT
                </span>
              </div>

              <div>
                <h2
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#211A17',
                  }}
                >
                  {result.headline}
                </h2>
                <p
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#524840',
                  }}
                >
                  {result.summary}
                </p>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#756A60' }}>
                  {result.explanation}
                </p>
              </div>

              {result.recommendations.length > 0 && (
                <div
                  style={{
                    background: '#F8F4EC',
                    border: '1px solid var(--os-line)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontFamily: "'DM Mono', monospace",
                      color: 'var(--os-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    SYSTEM RECOMMENDATIONS
                  </span>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '18px',
                      fontSize: '12px',
                      color: '#524840',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </PulsatingBorder>

          {/* Metric Comparison Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px',
            }}
          >
            <MetricDeltaCard
              label="SAFE-TO-SPEND"
              comparison={result.comparisons.safeToSpend}
              unit="INR"
            />
            <MetricDeltaCard
              label="ACCOUNT BALANCE"
              comparison={result.comparisons.balance}
              unit="INR"
            />
            <MetricDeltaCard
              label="MONTHLY SURPLUS"
              comparison={result.comparisons.monthlySurplus}
              unit="INR"
            />
            <MetricDeltaCard
              label="FINANCIAL HEALTH"
              comparison={result.comparisons.financialHealth}
              unit="pts"
            />
            <MetricDeltaCard
              label="MONTHLY SPENDING"
              comparison={result.comparisons.monthlySpending}
              unit="INR"
            />
            <MetricDeltaCard
              label="EMERGENCY RESERVE"
              comparison={result.comparisons.emergencyCoverageMonths}
              unit="mo"
            />
          </div>

          {/* Goals Impact Breakdown */}
          {result.goals.length > 0 && (
            <section
              style={{
                background: '#FFFDF8',
                border: '1px solid var(--os-line)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: '0 4px 20px rgba(63, 13, 18, 0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <span className="panel-kicker">GOAL PROTECTION IMPACT</span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#211A17' }}>
                    Timeline & Completion Trajectory
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.goals.map(g => (
                  <div
                    key={g.id}
                    style={{
                      background: '#F8F4EC',
                      border: '1px solid var(--os-line)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#211A17', fontSize: '13px' }}>{g.name}</strong>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#756A60' }}>
                        {g.explanation}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: g.projectedProgress >= g.currentProgress ? '#166534' : '#991b1b',
                          }}
                        >
                          {g.currentProgress}% → {g.projectedProgress}%
                        </span>
                        <small
                          style={{
                            display: 'block',
                            fontSize: '10px',
                            color: 'var(--os-muted)',
                          }}
                        >
                          {g.delayDays > 0 ? `+${g.delayDays}d delay` : 'No delay'}
                        </small>
                      </div>

                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: "'DM Mono', monospace",
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background:
                            g.status === 'Ahead' || g.status === 'Completed'
                              ? 'rgba(22, 101, 52, 0.12)'
                              : g.status === 'On Track'
                              ? 'rgba(180, 83, 9, 0.12)'
                              : 'rgba(153, 27, 27, 0.12)',
                          color:
                            g.status === 'Ahead' || g.status === 'Completed'
                              ? '#166534'
                              : g.status === 'On Track'
                              ? '#b45309'
                              : '#991b1b',
                          fontWeight: 600,
                        }}
                      >
                        {g.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
    </div>
  )
}

function MetricDeltaCard({
  label,
  comparison,
  unit,
}: {
  label: string
  comparison: {
    formattedCurrent: string
    formattedProjected: string
    formattedDelta: string
    direction: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  }
  unit: string
}) {
  const isPositive = comparison.direction === 'POSITIVE'
  const isNegative = comparison.direction === 'NEGATIVE'

  const deltaColor = isPositive ? '#166534' : isNegative ? '#991b1b' : '#756A60'

  return (
    <div
      style={{
        background: '#FFFDF8',
        border: '1px solid var(--os-line)',
        borderRadius: '14px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxShadow: '0 2px 8px rgba(63, 13, 18, 0.03)',
      }}
    >
      <span
        style={{
          fontSize: '10px',
          fontFamily: "'DM Mono', monospace",
          color: 'var(--os-muted)',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <strong style={{ fontSize: '18px', color: '#211A17' }}>
          {comparison.formattedProjected}
          {unit ? <span style={{ fontSize: '12px', color: '#756A60', marginLeft: '4px' }}>{unit}</span> : null}
        </strong>
        <span style={{ fontSize: '11px', fontWeight: 600, color: deltaColor }}>
          {comparison.formattedDelta}
        </span>
      </div>
      <small style={{ fontSize: '10px', color: '#64748b' }}>
        Current: {comparison.formattedCurrent}
      </small>
    </div>
  )
}
