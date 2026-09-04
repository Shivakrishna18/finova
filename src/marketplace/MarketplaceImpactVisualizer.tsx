import { useState, useMemo } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  TrendingDown,
  Calendar,
  CheckCircle2,
  DollarSign,
  HelpCircle,
} from 'lucide-react'
import {
  useFinance,
  formatINR,
  evaluatePurchaseDecision,
  type PurchaseDecisionResult,
} from '../finance/FinanceContext'

export interface MarketplaceImpactVisualizerProps {
  itemName: string
  category: string
  budget: number
  isGrocery?: boolean
  onSelectAlternativeBudget?: (budget: number) => void
}

export default function MarketplaceImpactVisualizer({
  itemName,
  category,
  budget,
  isGrocery = false,
  onSelectAlternativeBudget,
}: MarketplaceImpactVisualizerProps) {
  const { state: finance, intelligence, addTransaction } = useFinance()
  const [showRecordConfirm, setShowRecordConfirm] = useState(false)
  const [recordSuccess, setRecordSuccess] = useState(false)

  // Map category to budget key
  const matchedBudgetCategory = useMemo(() => {
    if (isGrocery) return 'Groceries & Food'
    if (finance.budgets[category]) return category
    const lower = category.toLowerCase()
    const foundKey = Object.keys(finance.budgets).find(k => k.toLowerCase().includes(lower))
    return foundKey || 'Shopping & Discretionary'
  }, [category, isGrocery, finance.budgets])

  const categoryBudgetLimit = finance.budgets[matchedBudgetCategory] || 0

  const categoryCurrentSpent = useMemo(() => {
    return finance.transactions
      .filter(tx => tx.category.toLowerCase() === matchedBudgetCategory.toLowerCase() || (isGrocery && tx.category.toLowerCase().includes('food')))
      .reduce((sum, tx) => sum + tx.amount, 0)
  }, [finance.transactions, matchedBudgetCategory, isGrocery])

  // Pure Deterministic Evaluation from FinancialDecisionEngine
  const decision: PurchaseDecisionResult = useMemo(() => {
    return evaluatePurchaseDecision(
      {
        price: budget,
        category: matchedBudgetCategory,
        priority: 'Medium',
        purpose: itemName || 'Smart Marketplace Discovery',
      },
      intelligence,
      finance
    )
  }, [budget, matchedBudgetCategory, itemName, intelligence, finance])

  const currentSafe = Math.max(0, finance.safeToSpend)
  const remainingSafe = Math.max(0, currentSafe - budget)
  const isOverSafe = budget > currentSafe
  const overAmount = budget - currentSafe
  const percentOfSafe = currentSafe > 0 ? Math.round((budget / currentSafe) * 100) : 100

  // Category budget math
  const postSpendCategoryTotal = categoryCurrentSpent + budget
  const isOverCategoryBudget = categoryBudgetLimit > 0 && postSpendCategoryTotal > categoryBudgetLimit

  // Suggested Alternative Tiers when over capacity
  const alternatives = useMemo(() => {
    if (!isOverSafe) return []
    const safeCushion = Math.max(1000, Math.floor(currentSafe * 0.8 / 500) * 500)
    const midTier = Math.max(1000, Math.floor(budget * 0.5 / 500) * 500)
    const savingMonths = Math.ceil(budget / Math.max(5000, finance.income - finance.commitments - finance.monthlySpending))

    return [
      {
        title: 'Safe Discretionary Tier',
        amount: safeCushion,
        note: '100% within current uncommitted safe-to-spend range',
        tag: 'IMMEDIATE FIT',
      },
      {
        title: 'Value / Balanced Alternative',
        amount: midTier,
        note: 'High-utility tier minimizing cash-flow pressure',
        tag: 'RECOMMENDED COMPROMISE',
      },
      {
        title: 'Save & Target Plan',
        amount: budget,
        note: `Accumulate surplus over ~${Math.max(2, savingMonths)} months without touching emergency funds`,
        tag: 'DELAYED PURCHASE',
      },
    ]
  }, [isOverSafe, currentSafe, budget, finance.income, finance.commitments, finance.monthlySpending])

  const handleConfirmPurchaseRecord = () => {
    addTransaction({
      description: `${itemName || 'Marketplace Purchase'} (${category})`,
      amount: budget,
      category: matchedBudgetCategory,
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      source: 'Checking Account',
      note: 'Recorded via FINOVA Smart Marketplace',
    })
    setShowRecordConfirm(false)
    setRecordSuccess(true)
    setTimeout(() => setRecordSuccess(false), 4000)
  }

  return (
    <div
      style={{
        background: '#FFFDF8',
        border: isOverSafe
          ? '1px solid rgba(153, 27, 27, 0.4)'
          : decision.statusTag === 'CONSIDER'
          ? '1px solid rgba(180, 83, 9, 0.4)'
          : '1px solid var(--os-line)',
        borderRadius: '12px',
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 4px 20px rgba(63, 13, 18, 0.04)',
      }}
    >
      {/* Top Header & Decision Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#98111E', letterSpacing: '0.08em', fontWeight: 600 }}>
              FINOVA DECISION ENGINE • FINANCIAL CONTEXT
            </span>
            <span style={{ fontSize: '10px', color: '#9A8F84' }}>• Deterministic</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#211A17', fontWeight: 600 }}>
            {itemName ? `Evaluating: ${itemName}` : 'Target Purchase Evaluation'}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#756A60' }}>
            Target Budget: <strong style={{ color: '#211A17', fontFamily: "'DM Mono', monospace" }}>{formatINR(budget)}</strong>
            {' · '}Category: <span style={{ color: '#3F0D12', fontWeight: 500 }}>{matchedBudgetCategory}</span>
          </p>
        </div>

        {/* DECISION BADGE */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border:
              decision.statusTag === 'SAFE'
                ? '1px solid rgba(22, 101, 52, 0.3)'
                : decision.statusTag === 'CONSIDER'
                ? '1px solid rgba(180, 83, 9, 0.3)'
                : '1px solid rgba(153, 27, 27, 0.3)',
            background:
              decision.statusTag === 'SAFE'
                ? 'rgba(22, 101, 52, 0.08)'
                : decision.statusTag === 'CONSIDER'
                ? 'rgba(180, 83, 9, 0.08)'
                : 'rgba(153, 27, 27, 0.08)',
          }}
        >
          {decision.statusTag === 'SAFE' && <ShieldCheck className="w-5 h-5 text-[#166534]" />}
          {decision.statusTag === 'CONSIDER' && <AlertTriangle className="w-5 h-5 text-[#b45309]" />}
          {decision.statusTag === 'AVOID' && <XCircle className="w-5 h-5 text-[#991b1b]" />}
          <div>
            <strong
              style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: "'DM Mono', monospace",
                fontWeight: 700,
                color:
                  decision.statusTag === 'SAFE'
                    ? '#166534'
                    : decision.statusTag === 'CONSIDER'
                    ? '#b45309'
                    : '#991b1b',
              }}
            >
              FINOVA: {decision.statusTag}
            </strong>
            <small style={{ fontSize: '10px', color: '#756A60' }}>
              {decision.statusTag === 'SAFE'
                ? 'Fits within spending capacity'
                : decision.statusTag === 'CONSIDER'
                ? 'Reduces discretionary buffer'
                : 'Exceeds comfortable capacity'}
            </small>
          </div>
        </div>
      </div>

      {/* Primary Flow: Safe-to-Spend Impact Bar */}
      <div
        style={{
          background: '#F8F4EC',
          border: '1px solid var(--os-line)',
          borderRadius: '10px',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
            SAFE-TO-SPEND CAPACITY ANALYSIS
          </span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: "'DM Mono', monospace",
              color: isOverSafe ? '#991b1b' : '#166534',
              fontWeight: 600,
            }}
          >
            {percentOfSafe}% of Safe-to-Spend
          </span>
        </div>

        {/* 3-Part Metric Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', margin: '12px 0' }}>
          <div style={{ background: '#FFFDF8', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--os-line)' }}>
            <span style={{ fontSize: '10px', color: '#756A60', display: 'block' }}>Current Safe-to-Spend</span>
            <strong style={{ fontSize: '16px', color: '#211A17', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
              {formatINR(currentSafe)}
            </strong>
          </div>

          <div style={{ background: '#FFFDF8', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--os-line)' }}>
            <span style={{ fontSize: '10px', color: '#756A60', display: 'block' }}>Purchase Budget</span>
            <strong style={{ fontSize: '16px', color: isOverSafe ? '#991b1b' : '#3F0D12', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
              − {formatINR(budget)}
            </strong>
          </div>

          <div style={{ background: '#FFFDF8', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--os-line)' }}>
            <span style={{ fontSize: '10px', color: '#756A60', display: 'block' }}>Remaining Discretionary</span>
            <strong
              style={{
                fontSize: '16px',
                fontFamily: "'DM Mono', monospace",
                color: isOverSafe ? '#991b1b' : '#166534',
                fontWeight: 600,
              }}
            >
              {isOverSafe ? `Deficit: ${formatINR(overAmount)}` : formatINR(remainingSafe)}
            </strong>
          </div>
        </div>

        {/* Visual Progress Track */}
        <div style={{ width: '100%', height: '8px', background: '#E8E0D2', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, percentOfSafe)}%`,
              background: isOverSafe ? '#991b1b' : percentOfSafe > 70 ? '#b45309' : '#166534',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Context Insights: Goal Impact & Category Budget */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {/* Goal Delay Insight */}
        <div style={{ padding: '12px 14px', background: '#F8F4EC', borderRadius: '8px', border: '1px solid var(--os-line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Calendar className="w-4 h-4 text-[#756A60]" />
            <strong style={{ fontSize: '12px', color: '#211A17' }}>Primary Goal Impact</strong>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#756A60', lineHeight: 1.5 }}>
            {decision.goalDelayDays > 0
              ? `Estimated shift of ${decision.goalImpactText} on active timeline targets (${finance.goals[0]?.name || 'MacBook'}).`
              : 'Zero timeline disruption. Active goals remain protected on scheduled dates.'}
          </p>
        </div>

        {/* Category Budget Insight */}
        <div style={{ padding: '12px 14px', background: '#F8F4EC', borderRadius: '8px', border: '1px solid var(--os-line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <TrendingDown className="w-4 h-4 text-[#756A60]" />
            <strong style={{ fontSize: '12px', color: '#211A17' }}>{matchedBudgetCategory} Budget</strong>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#756A60', lineHeight: 1.5 }}>
            {categoryBudgetLimit > 0
              ? isOverCategoryBudget
                ? `Exceeds monthly category ceiling (${formatINR(categoryBudgetLimit)}) by ${formatINR(postSpendCategoryTotal - categoryBudgetLimit)}.`
                : `Leaves ${formatINR(categoryBudgetLimit - postSpendCategoryTotal)} unspent in ${matchedBudgetCategory} limit.`
              : `Total account balance: ${formatINR(finance.balance)} with ${formatINR(finance.commitments)} locked in commitments.`}
          </p>
        </div>
      </div>

      {/* CRITICAL BUDGET GUIDANCE WHEN OVER SAFE CAPACITY */}
      {isOverSafe && (
        <div
          style={{
            background: 'rgba(153, 27, 27, 0.06)',
            border: '1px solid rgba(153, 27, 27, 0.25)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle className="w-5 h-5 text-[#991b1b] flex-shrink-0 mt-0.5" />
            <div>
              <strong style={{ fontSize: '13px', color: '#991b1b' }}>
                {formatINR(budget)} is above your current comfortable spending capacity.
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#524840', lineHeight: 1.5 }}>
                Your current uncommitted Safe-to-Spend is <strong>{formatINR(currentSafe)}</strong>. Spending {formatINR(budget)} right now would encroach into upcoming commitments ({formatINR(finance.commitments)}) or emergency reserves.
              </p>
            </div>
          </div>

          {/* Actionable Alternatives */}
          <div>
            <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#756A60', letterSpacing: '0.08em', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              FINOVA RECOMMENDED ALTERNATIVE STRATEGIES:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              {alternatives.map((alt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectAlternativeBudget && onSelectAlternativeBudget(alt.amount)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#FFFDF8',
                    border: '1px solid var(--os-line)',
                    textAlign: 'left',
                    cursor: onSelectAlternativeBudget ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 6px rgba(63, 13, 18, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '9px', fontFamily: "'DM Mono', monospace", color: '#b45309', background: 'rgba(180, 83, 9, 0.1)', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                      {alt.tag}
                    </span>
                    <strong style={{ fontSize: '13px', color: '#98111E', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                      {formatINR(alt.amount)}
                    </strong>
                  </div>
                  <strong style={{ fontSize: '11px', color: '#211A17' }}>{alt.title}</strong>
                  <small style={{ fontSize: '10px', color: '#756A60', lineHeight: 1.3 }}>{alt.note}</small>
                  {onSelectAlternativeBudget && (
                    <span style={{ fontSize: '9px', color: '#98111E', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      Apply budget tier →
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXPLICIT PURCHASE RECORDING OPTION (Never automatic) */}
      <div style={{ borderTop: '1px solid var(--os-line)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle className="w-4 h-4 text-[#756A60]" />
          <span style={{ fontSize: '11px', color: '#756A60' }}>
            Viewing and searching does <strong>not</strong> modify your financial balance.
          </span>
        </div>

        {recordSuccess ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '11px', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
            <CheckCircle2 className="w-4 h-4" />
            <span>Recorded in FINOVA ledger successfully!</span>
          </div>
        ) : showRecordConfirm ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#211A17', fontWeight: 500 }}>Confirm record {formatINR(budget)}?</span>
            <button
              type="button"
              onClick={handleConfirmPurchaseRecord}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#98111E',
                color: '#FFFDF8',
                border: '1px solid #98111E',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Yes, Record
            </button>
            <button
              type="button"
              onClick={() => setShowRecordConfirm(false)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'transparent',
                color: '#756A60',
                border: '1px solid var(--os-line)',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowRecordConfirm(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: '#F8F4EC',
              color: '#3F0D12',
              border: '1px solid var(--os-line)',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <DollarSign className="w-3.5 h-3.5 text-[#98111E]" />
            <span>Record Confirmed Purchase in Cash Flow</span>
          </button>
        )}
      </div>
    </div>
  )
}
