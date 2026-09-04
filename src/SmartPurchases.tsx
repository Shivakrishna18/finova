import { useMemo, useState } from 'react'
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Gift,
  ArrowRight,
  PlusCircle,
  ShoppingCart,
  Tag,
  Sliders,
  PackageCheck,
  Layers,
  Store,
} from 'lucide-react'
import PlasmaRing from './components/originkit/ui/plasma-ring'
import PulsatingBorder from './components/originkit/ui/pulsating-border-custom-style'
import {
  useFinance,
  formatINR,
  evaluatePurchaseDecision,
  type DemoFinancialState,
  type FinancialIntelligence,
  type PurchaseDecisionResult,
} from './finance/FinanceContext'
import SmartMarketplace from './marketplace/SmartMarketplace'

const categories = [
  'Electronics',
  'Home & Furniture',
  'Travel & Vacation',
  'Education & Courses',
  'Fitness & Health',
  'Fashion & Lifestyle',
  'Automobile & Transit',
  'Entertainment',
  'Other',
]

const occasions = [
  'Birthday',
  'Anniversary',
  'Wedding',
  'Festival / Diwali',
  'Graduation',
  'Housewarming',
  'Thank You',
  'Just Because',
]

const recipients = ['Partner / Spouse', 'Close Friend', 'Parents', 'Sibling', 'Colleague', 'Child']

const interestOptions = [
  'Tech & Gadgets',
  'Gaming & Esports',
  'Coffee & Culinary',
  'Fitness & Outdoor',
  'Books & Productivity',
  'Fashion & Styling',
  'Home Decor & Plants',
  'Music & Audio',
]

const giftStyles = [
  'Useful & Practical',
  'Emotional & Meaningful',
  'Premium Luxury',
  'Fun & Playful',
  'Experiential',
  'Personalized & Custom',
]

const PRESET_PURCHASES = [
  { name: 'Apple MacBook Air M3', price: 114900, category: 'Electronics', priority: 'High', emiMonths: 12, downPayment: 25000 },
  { name: 'Sony WH-1000XM5 Headphones', price: 29990, category: 'Electronics', priority: 'Medium', emiMonths: 6, downPayment: 5000 },
  { name: 'Ergonomic Standing Desk', price: 22500, category: 'Home & Furniture', priority: 'Medium', emiMonths: 3, downPayment: 0 },
  { name: 'Goa Weekend Getaway', price: 18000, category: 'Travel & Vacation', priority: 'Low', emiMonths: 0, downPayment: 0 },
  { name: 'Full-Stack AI Bootcamp', price: 35000, category: 'Education & Courses', priority: 'High', emiMonths: 6, downPayment: 10000 },
  { name: 'Garmin Venu 3 Smartwatch', price: 44990, category: 'Fitness & Health', priority: 'Medium', emiMonths: 9, downPayment: 8000 },
]

export default function SmartPurchases() {
  const {
    state: finance,
    intelligence,
    evaluatePurchase,
    addCommitment,
    addTransaction,
  } = useFinance()

  const [activeTab, setActiveTab] = useState<'marketplace' | 'designer' | 'gifts' | 'matrix' | 'event'>('marketplace')

  // Purchase Designer State
  const [purchaseName, setPurchaseName] = useState<string>('Sony WH-1000XM5 Headphones')
  const [category, setCategory] = useState<string>('Electronics')
  const [price, setPrice] = useState<number>(29990)
  const [purchaseDate, setPurchaseDate] = useState<string>('2026-09-15')
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')
  const [paymentMode, setPaymentMode] = useState<'upfront' | 'emi'>('emi')
  const [downPayment, setDownPayment] = useState<number>(5000)
  const [emiMonths, setEmiMonths] = useState<number>(6)
  const [isNoCostEmi, setIsNoCostEmi] = useState<boolean>(true)
  const [emiApr, setEmiApr] = useState<number>(14)
  const [purpose, setPurpose] = useState<string>('Work focus & audio clarity')
  const [necessity, setNecessity] = useState<'Essential' | 'Productive Investment' | 'Discretionary'>('Productive Investment')

  // Feedback Toast
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(null)
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setActionFeedback({ message, type })
    setTimeout(() => setActionFeedback(null), 3500)
  }

  // Calculated EMI
  const loanPrincipal = Math.max(0, price - downPayment)
  const calculatedMonthlyEmi = useMemo(() => {
    if (paymentMode === 'upfront' || loanPrincipal === 0 || emiMonths === 0) return 0
    if (isNoCostEmi || emiApr === 0) {
      return Math.round(loanPrincipal / emiMonths)
    }
    const r = emiApr / 12 / 100
    const emi = (loanPrincipal * r * Math.pow(1 + r, emiMonths)) / (Math.pow(1 + r, emiMonths) - 1)
    return Math.round(emi)
  }, [paymentMode, loanPrincipal, emiMonths, isNoCostEmi, emiApr])

  const totalFinancingCost = useMemo(() => {
    if (paymentMode === 'upfront') return price
    return downPayment + calculatedMonthlyEmi * emiMonths
  }, [paymentMode, price, downPayment, calculatedMonthlyEmi, emiMonths])

  const effectiveMonthlyBurden = paymentMode === 'emi' ? calculatedMonthlyEmi : price

  // Pure Deterministic Evaluation
  const purchaseDecision: PurchaseDecisionResult = useMemo(() => {
    return evaluatePurchase({
      price,
      category,
      installment: paymentMode === 'emi' ? calculatedMonthlyEmi : 0,
      priority,
      purchaseDate,
      purpose,
    })
  }, [evaluatePurchase, price, category, paymentMode, calculatedMonthlyEmi, priority, purchaseDate, purpose])

  // Category Budget Check
  const categoryBudget = finance.budgets[category] || 0
  const categoryCurrentSpent = useMemo(() => {
    return finance.transactions
      .filter(tx => tx.category.toLowerCase() === category.toLowerCase())
      .reduce((sum, tx) => sum + tx.amount, 0)
  }, [finance.transactions, category])

  const postPurchaseCategorySpent = categoryCurrentSpent + (paymentMode === 'emi' ? calculatedMonthlyEmi : price)
  const categoryBudgetStatus = useMemo(() => {
    if (categoryBudget === 0) return { text: 'No category budget limit set', isOver: false, pct: 0 }
    const pct = Math.round((postPurchaseCategorySpent / categoryBudget) * 100)
    const isOver = postPurchaseCategorySpent > categoryBudget
    return {
      text: isOver
        ? `Exceeds monthly ${category} budget by ${formatINR(postPurchaseCategorySpent - categoryBudget)} (${pct}%)`
        : `Consumes ${pct}% of monthly ${category} limit (${formatINR(categoryBudget)})`,
      isOver,
      pct,
    }
  }, [categoryBudget, postPurchaseCategorySpent, category])

  // Threshold / Down Payment Optimizer
  const safeDownPaymentThreshold = useMemo(() => {
    if (finance.safeToSpend <= 0) return price
    // Find down payment where monthly EMI fits within comfortable safe-to-spend
    const affordableMonthly = Math.max(1000, Math.round(finance.safeToSpend * 0.35))
    const maxLoan = affordableMonthly * (emiMonths || 6)
    const neededDown = Math.max(0, price - maxLoan)
    return Math.min(price, neededDown)
  }, [finance.safeToSpend, price, emiMonths])

  // Multi-Option Comparison Matrix State
  const [matrixOptions, setMatrixOptions] = useState([
    { id: 'opt-1', name: 'Baseline Choice', price: Math.round(price * 0.65), category: 'Electronics', emiMonths: 0 },
    { id: 'opt-2', name: purchaseName || 'Current Plan', price: price, category: category, emiMonths: emiMonths },
    { id: 'opt-3', name: 'Flagship / Pro Tier', price: Math.round(price * 1.5), category: 'Electronics', emiMonths: 12 },
  ])

  // Update option 2 whenever current purchase changes
  const activeMatrix = useMemo(() => {
    return matrixOptions.map((opt, idx) => {
      const evalRes = evaluatePurchaseDecision({ price: opt.price }, intelligence, finance)
      return {
        ...opt,
        isCurrent: idx === 1,
        evaluation: evalRes,
        safeAfter: Math.max(0, finance.safeToSpend - opt.price),
        monthlyBurden: opt.emiMonths > 0 ? Math.round(opt.price / opt.emiMonths) : opt.price,
      }
    })
  }, [matrixOptions, intelligence, finance])

  // Gift Advisor State
  const [giftRecipient, setGiftRecipient] = useState<string>('Partner / Spouse')
  const [giftOccasion, setGiftOccasion] = useState<string>('Birthday')
  const [giftInterest, setGiftInterest] = useState<string>('Tech & Gadgets')
  const [giftStyle, setGiftStyle] = useState<string>('Useful & Practical')
  const [giftBudget, setGiftBudget] = useState<number>(4500)
  const [giftUrgency, setGiftUrgency] = useState<string>('Next 2 Weeks')

  // Dynamic Curated Recommendations Engine
  const giftRecommendations = useMemo(() => {
    return generateCuratedGiftRecommendations(giftRecipient, giftOccasion, giftInterest, giftStyle, giftBudget, intelligence, finance)
  }, [giftRecipient, giftOccasion, giftInterest, giftStyle, giftBudget, intelligence, finance])

  // Event Mode State
  const [eventTitle, setEventTitle] = useState('Home Appliance Replacement')
  const [eventAmount, setEventAmount] = useState(15000)
  const [eventFundingPlan, setEventFundingPlan] = useState<'liquid' | 'emi' | 'buffer'>('buffer')
  const eventStatus = evaluatePurchaseDecision({ price: eventAmount }, intelligence, finance)

  // Quick Action Handlers
  const handleApplyPreset = (preset: typeof PRESET_PURCHASES[0]) => {
    setPurchaseName(preset.name)
    setPrice(preset.price)
    setCategory(preset.category)
    setPriority(preset.priority as any)
    setEmiMonths(preset.emiMonths)
    setDownPayment(preset.downPayment)
    setPaymentMode(preset.emiMonths > 0 ? 'emi' : 'upfront')
    showToast(`Loaded "${preset.name}" into Purchase Designer.`, 'info')
  }

  const handleCommitAsObligation = () => {
    const commitmentName = paymentMode === 'emi' ? `${purchaseName} (EMI: ${emiMonths} mo)` : `Planned: ${purchaseName}`
    const amt = paymentMode === 'emi' ? calculatedMonthlyEmi : price
    addCommitment({
      id: `com-purchase-${Date.now()}`,
      name: commitmentName,
      amount: amt,
      date: purchaseDate || 'Day 10',
      type: paymentMode === 'emi' ? 'Debt' : 'Discretionary',
    })
    showToast(`Added "${commitmentName}" to monthly cash-flow commitments!`, 'success')
  }

  const handleExecuteTransaction = () => {
    const txAmt = paymentMode === 'emi' ? (downPayment > 0 ? downPayment : calculatedMonthlyEmi) : price
    addTransaction({
      id: `tx-purchase-${Date.now()}`,
      name: purchaseName || 'Smart Purchase',
      category: category,
      amount: txAmt,
      date: new Date().toISOString().split('T')[0],
    })
    showToast(`Transaction of ${formatINR(txAmt)} recorded and reflected in your financial state.`, 'success')
  }

  const handleLoadGiftIntoDesigner = (giftItem: { title: string; price: number; category: string }) => {
    setPurchaseName(giftItem.title)
    setPrice(giftItem.price)
    setCategory('Fashion & Lifestyle')
    setPaymentMode('upfront')
    setDownPayment(0)
    setEmiMonths(0)
    setActiveTab('designer')
    showToast(`Loaded "${giftItem.title}" into Smart Purchase Designer.`, 'info')
  }

  return (
    <div className="workspace-page smart-purchases-page">
      {/* Toast notification */}
      {actionFeedback && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: actionFeedback.type === 'success' ? '#06281e' : '#081c33',
            border: `1px solid ${actionFeedback.type === 'success' ? '#D72638' : '#D72638'}`,
            color: actionFeedback.type === 'success' ? '#a7f3d0' : '#bae6fd',
            padding: '12px 18px',
            borderRadius: '8px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 500,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {actionFeedback.type === 'success' ? <PackageCheck className="w-4 h-4 text-[#D72638]" /> : <Sparkles className="w-4 h-4 text-[#D72638]" />}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow">SMART PURCHASES / DECISION ENGINE</span>
          <h1>
            Smart Purchase Designer<br />
            <em>and Gift Advisor.</em>
          </h1>
          <p>
            Evaluate any purchase, installment, or gift against your liquid cash, category limits, and goal timelines before you commit.
          </p>
        </div>
        <span className="demo-badge">FINOVA 3.0 REAL-TIME ENGINE</span>
      </div>

      {/* Real-time Financial Signal Stats Bar */}
      <div className="purchase-intelligence">
        <div className="purchase-stat">
          <span>SAFE TO SPEND<i>LIVE</i></span>
          <strong>{formatINR(finance.safeToSpend)}</strong>
          <small>Current uncommitted surplus</small>
        </div>
        <div className="purchase-stat">
          <span>LIQUID BALANCE<i>LIVE</i></span>
          <strong>{formatINR(finance.balance)}</strong>
          <small>Available in savings</small>
        </div>
        <div className="purchase-stat">
          <span>MONTHLY COMMITMENTS<i>LIVE</i></span>
          <strong>{formatINR(finance.commitments.reduce((sum, c) => sum + c.amount, 0))}</strong>
          <small>{finance.commitments.length} active recurring obligations</small>
        </div>
        <div className="purchase-stat">
          <span>FINANCIAL HEALTH<i>LIVE</i></span>
          <strong>{finance.financialHealth} / 100</strong>
          <small>Resilience score</small>
        </div>
      </div>

      {/* Workspace Tab Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          margin: '20px 0 24px 0',
          background: '#F8F4EC',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid var(--os-line)',
          overflowX: 'auto',
          boxShadow: '0 2px 10px rgba(63, 13, 18, 0.02)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('marketplace')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeTab === 'marketplace' ? '1px solid #98111E' : '1px solid transparent',
            background: activeTab === 'marketplace' ? '#FFFDF8' : 'transparent',
            color: activeTab === 'marketplace' ? '#98111E' : '#756A60',
            fontSize: '12px',
            fontWeight: activeTab === 'marketplace' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'marketplace' ? '0 2px 6px rgba(63, 13, 18, 0.05)' : 'none',
          }}
        >
          <Store className="w-4 h-4" />
          <span>Smart Marketplace & Discovery</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('designer')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeTab === 'designer' ? '1px solid #3F0D12' : '1px solid transparent',
            background: activeTab === 'designer' ? '#FFFDF8' : 'transparent',
            color: activeTab === 'designer' ? '#3F0D12' : '#756A60',
            fontSize: '12px',
            fontWeight: activeTab === 'designer' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'designer' ? '0 2px 6px rgba(63, 13, 18, 0.05)' : 'none',
          }}
        >
          <Sliders className="w-4 h-4" />
          <span>Purchase Designer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gifts')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeTab === 'gifts' ? '1px solid #D72638' : '1px solid transparent',
            background: activeTab === 'gifts' ? '#FFFDF8' : 'transparent',
            color: activeTab === 'gifts' ? '#D72638' : '#756A60',
            fontSize: '12px',
            fontWeight: activeTab === 'gifts' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'gifts' ? '0 2px 6px rgba(63, 13, 18, 0.05)' : 'none',
          }}
        >
          <Gift className="w-4 h-4" />
          <span>Smart Gift Advisor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeTab === 'matrix' ? '1px solid #98111E' : '1px solid transparent',
            background: activeTab === 'matrix' ? '#FFFDF8' : 'transparent',
            color: activeTab === 'matrix' ? '#98111E' : '#756A60',
            fontSize: '12px',
            fontWeight: activeTab === 'matrix' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'matrix' ? '0 2px 6px rgba(63, 13, 18, 0.05)' : 'none',
          }}
        >
          <Layers className="w-4 h-4" />
          <span>Option Comparison Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('event')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeTab === 'event' ? '1px solid #b45309' : '1px solid transparent',
            background: activeTab === 'event' ? '#FFFDF8' : 'transparent',
            color: activeTab === 'event' ? '#b45309' : '#756A60',
            fontSize: '12px',
            fontWeight: activeTab === 'event' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease',
            boxShadow: activeTab === 'event' ? '0 2px 6px rgba(63, 13, 18, 0.05)' : 'none',
          }}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Unplanned Event Mode</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: SMART MARKETPLACE & PRODUCT DISCOVERY */}
      {/* ========================================================================= */}
      {activeTab === 'marketplace' && (
        <SmartMarketplace />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SMART PURCHASE DESIGNER */}
      {/* ========================================================================= */}
      {activeTab === 'designer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Presets */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#FBE4E3' }}>
                QUICK DEMO PRESETS
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Click any item to model instantly</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESET_PURCHASES.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    padding: '6px 12px',
                    background: purchaseName === preset.name ? 'rgba(116, 217, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${purchaseName === preset.name ? '#FBE4E3' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '8px',
                    color: purchaseName === preset.name ? '#FBE4E3' : '#cbd5e1',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <Tag className="w-3 h-3 opacity-60" />
                  <span>{preset.name}</span>
                  <b style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#e2e8f0' }}>{formatINR(preset.price)}</b>
                </button>
              ))}
            </div>
          </div>

          {/* Main Interactive Designer Grid */}
          <div className="purchase-planner-layout">
            <PulsatingBorder colors={['#61eaff', '#716dff', '#61eaff']} radius={2} thickness={3} intensity={22} bloom={30} style={{ display: 'block' }}>
              <section className="purchase-planner">
                <div className="card-top">
                  <div>
                    <span className="panel-kicker">PURCHASE DESIGNER / PARAMETERS</span>
                    <h2>Configure Decision Variables</h2>
                  </div>
                  <span className="simulation-tag">DETERMINISTIC ENGINE</span>
                </div>

                <div className="planner-fields">
                  {/* Item Name */}
                  <label>
                    Item / Experience Name
                    <input
                      type="text"
                      value={purchaseName}
                      onChange={e => setPurchaseName(e.target.value)}
                      placeholder="e.g. MacBook Pro M3"
                    />
                  </label>

                  {/* Category */}
                  <label>
                    Expense Category
                    <select value={category} onChange={e => setCategory(e.target.value)}>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Price */}
                  <label>
                    Purchase Price (INR)
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0' }}>
                      <output style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '18px', color: '#FBE4E3', fontWeight: 700 }}>
                        {formatINR(price)}
                      </output>
                      <input
                        type="number"
                        min="500"
                        max="500000"
                        step="500"
                        value={price}
                        onChange={e => setPrice(Math.max(0, Number(e.target.value)))}
                        style={{
                          width: '120px',
                          padding: '4px 8px',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '12px',
                          textAlign: 'right',
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="200000"
                      step="1000"
                      value={Math.min(200000, price)}
                      onChange={e => setPrice(Number(e.target.value))}
                    />
                  </label>

                  {/* Payment Mode (Upfront vs EMI) */}
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      Financing Structure
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('upfront')}
                        style={{
                          padding: '8px 12px',
                          background: paymentMode === 'upfront' ? 'rgba(116, 217, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${paymentMode === 'upfront' ? '#FBE4E3' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '6px',
                          color: paymentMode === 'upfront' ? '#FBE4E3' : '#94a3b8',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Full Upfront Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('emi')}
                        style={{
                          padding: '8px 12px',
                          background: paymentMode === 'emi' ? 'rgba(116, 217, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${paymentMode === 'emi' ? '#FBE4E3' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '6px',
                          color: paymentMode === 'emi' ? '#FBE4E3' : '#94a3b8',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        EMI Installments
                      </button>
                    </div>
                  </div>

                  {/* EMI Specific Controls */}
                  {paymentMode === 'emi' && (
                    <div
                      style={{
                        background: 'rgba(6, 16, 28, 0.6)',
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(116, 217, 255, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                          <span style={{ color: '#94a3b8' }}>Down Payment (Upfront):</span>
                          <strong style={{ color: '#FBE4E3', fontFamily: "'IBM Plex Mono', monospace" }}>
                            {formatINR(downPayment)} ({price > 0 ? Math.round((downPayment / price) * 100) : 0}%)
                          </strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={price}
                          step="1000"
                          value={Math.min(price, downPayment)}
                          onChange={e => setDownPayment(Number(e.target.value))}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Tenure (Months)
                          </label>
                          <select
                            value={emiMonths}
                            onChange={e => setEmiMonths(Number(e.target.value))}
                            style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                          >
                            {[3, 6, 9, 12, 18, 24].map(m => (
                              <option key={m} value={m}>
                                {m} Months
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Interest Plan
                          </label>
                          <select
                            value={isNoCostEmi ? '0' : '14'}
                            onChange={e => {
                              const isZero = e.target.value === '0'
                              setIsNoCostEmi(isZero)
                              setEmiApr(isZero ? 0 : 14)
                            }}
                            style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                          >
                            <option value="0">0% No-Cost EMI</option>
                            <option value="14">Standard EMI (14% APR)</option>
                          </select>
                        </div>
                      </div>

                      <div
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>Monthly Outflow (Burden):</span>
                        <strong style={{ color: '#D72638', fontSize: '14px' }}>{formatINR(effectiveMonthlyBurden)}/mo</strong>
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        <span>Total Financing Cost:</span>
                        <span>{formatINR(totalFinancingCost)} {isNoCostEmi ? '(Zero interest)' : `(+${formatINR(totalFinancingCost - price)} interest)`}</span>
                      </div>
                    </div>
                  )}

                  {/* Date & Purpose */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label>
                      Planned Date
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={e => setPurchaseDate(e.target.value)}
                        style={{ padding: '8px', fontSize: '12px' }}
                      />
                    </label>
                    <label>
                      Purpose & Notes
                      <input
                        type="text"
                        value={purpose}
                        onChange={e => setPurpose(e.target.value)}
                        placeholder="e.g. Work productivity"
                        style={{ padding: '8px', fontSize: '12px' }}
                      />
                    </label>
                  </div>

                  {/* Priority & Necessity */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <label>
                      Priority Level
                      <select value={priority} onChange={e => setPriority(e.target.value as any)}>
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low / Discretionary</option>
                      </select>
                    </label>
                    <label>
                      Necessity Class
                      <select value={necessity} onChange={e => setNecessity(e.target.value as any)}>
                        <option value="Essential">Essential Need</option>
                        <option value="Productive Investment">Productive Investment</option>
                        <option value="Discretionary">Discretionary Luxury</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* Real-time Metric Dials */}
                <div className="planner-results">
                  <Metric
                    label="SAFE-TO-SPEND IMPACT"
                    value={`− ${formatINR(paymentMode === 'emi' ? downPayment + calculatedMonthlyEmi : price)}`}
                  />
                  <Metric label="REMAINING SAFE-TO-SPEND" value={formatINR(purchaseDecision.remainingSafe)} />
                  <Metric label="GOAL TIMELINE IMPACT" value={purchaseDecision.goalImpactText} />
                  <Metric label="HEALTH SCORE IMPACT" value={purchaseDecision.healthImpactText} />
                </div>

                {/* Recommendation Banner */}
                <div className="recommendation-row">
                  <div>
                    <span>FINOVA VERDICT</span>
                    <strong className={purchaseDecision.statusTag.toLowerCase()}>{purchaseDecision.statusTag}</strong>
                    <p style={{ marginTop: '4px', lineHeight: 1.4 }}>{purchaseDecision.explanation}</p>
                  </div>
                  <span className="priority-mark">{priority} priority</span>
                </div>

                {/* Direct Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCommitAsObligation}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: 'rgba(116, 217, 255, 0.15)',
                      border: '1px solid #FBE4E3',
                      borderRadius: '8px',
                      color: '#FBE4E3',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Reserve in Cash Flow Plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteTransaction}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #FBE4E3 0%, #D72638 100%)',
                      color: '#06101c',
                      border: 0,
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 text-slate-900" />
                    <span>Record as Completed Purchase</span>
                  </button>
                </div>
              </section>
            </PulsatingBorder>

            {/* Impact Visualization & Orbit Card */}
            <PurchaseImpactVisual
              price={price}
              purchase={purchaseName}
              status={purchaseDecision.statusTag}
              paymentMode={paymentMode}
              monthlyEmi={calculatedMonthlyEmi}
              categoryBudgetStatus={categoryBudgetStatus}
              primaryGoalName={finance.goals[0]?.name || 'Primary Goal'}
              goalDelayDays={purchaseDecision.goalDelayDays}
            />
          </div>

          {/* Deep Financial Reasonings Breakdown & Optimizer */}
          <section className="analysis-panel">
            <div>
              <span className="panel-kicker">DETERMINISTIC REASONING / EXPLANATION</span>
              <h2>Why FINOVA Recommends This</h2>
              <p style={{ margin: '8px 0 14px 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                Every decision is cross-verified against 5 core financial pillars: liquid cushion, recurring obligations, category budget thresholds, emergency reserve, and target goal dates.
              </p>

              <div className="analysis-reasons">
                <span>1. LIQUIDITY BUFFER</span>
                <b>
                  {price <= finance.safeToSpend
                    ? `Purchase fits within current safe-to-spend surplus of ${formatINR(finance.safeToSpend)}.`
                    : `Exceeds uncommitted safe-to-spend by ${formatINR(price - finance.safeToSpend)}.`}
                </b>

                <span>2. CATEGORY BUDGET IMPACT</span>
                <b>{categoryBudgetStatus.text}</b>

                <span>3. GOAL TIMELINE PROTECTION</span>
                <b>
                  {purchaseDecision.goalDelayDays === 0
                    ? `Zero timeline slippage on ${finance.goals[0]?.name || 'active goals'}.`
                    : `May push completion of "${finance.goals[0]?.name || 'Primary Goal'}" out by ~${purchaseDecision.goalDelayDays} days.`}
                </b>

                <span>4. CASH FLOW PRESSURE</span>
                <b>
                  {paymentMode === 'emi'
                    ? `Monthly commitment load increases by ${formatINR(calculatedMonthlyEmi)} for ${emiMonths} months.`
                    : `One-time cash deduction of ${formatINR(price)} from liquid checking.`}
                </b>
              </div>
            </div>

            <div className="analysis-metrics">
              <span className="panel-kicker">DECISION OPTIMIZER</span>
              <h3 style={{ fontSize: '15px', color: '#f8fafc', margin: '0 0 10px 0' }}>Improve Affordability</h3>

              {/* Optimization advice */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: '#cbd5e1',
                  marginBottom: '12px',
                }}
              >
                {purchaseDecision.statusTag === 'SAFE' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#86efac' }}>
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#D72638]" />
                    <span>Purchase is fully optimized and safe under current cash-flow parameters.</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fde047', marginBottom: '6px' }}>
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                      <strong>Recommended Adjustments:</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8' }}>
                      <li>
                        Increase down payment to <strong>{formatINR(safeDownPaymentThreshold)}</strong> to keep monthly burden safe.
                      </li>
                      <li>
                        Extend EMI tenure to <strong>{Math.min(24, (emiMonths || 6) + 6)} months</strong> to lower monthly outflow.
                      </li>
                      <li>Or defer purchase by 30 days into next month's salary cycle.</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="analysis-actions">
                <button
                  type="button"
                  onClick={() => {
                    setDownPayment(safeDownPaymentThreshold)
                    setPaymentMode('emi')
                    showToast(`Applied optimal down payment of ${formatINR(safeDownPaymentThreshold)}.`, 'info')
                  }}
                >
                  Apply Safe Down Payment <span>↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmiMonths(12)
                    setPaymentMode('emi')
                    showToast('Adjusted to 12-Month EMI tenure.', 'info')
                  }}
                >
                  Test 12-Month Split <span>↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('matrix')
                  }}
                >
                  Compare Lower Alternatives <span>↗</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SMART GIFT ADVISOR */}
      {/* ========================================================================= */}
      {activeTab === 'gifts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="gift-advisor-section">
            <div className="gift-advisor-copy">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f472b6', marginBottom: '8px' }}>
                <Gift className="w-4 h-4" />
                <span className="panel-kicker" style={{ margin: 0, color: '#f472b6' }}>
                  GUIDED GIFT INTELLIGENCE
                </span>
              </div>
              <h2>
                Find the thoughtful gift<br />
                <em>without breaking your plan.</em>
              </h2>
              <p>
                Describe the recipient, occasion, and your target budget. FINOVA synthesizes curated suggestions and verifies each one against your safe-to-spend limits.
              </p>

              {/* Guided Questionnaire */}
              <div className="gift-fields">
                <label>
                  Who is the recipient?
                  <select value={giftRecipient} onChange={e => setGiftRecipient(e.target.value)}>
                    {recipients.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  What is the occasion?
                  <select value={giftOccasion} onChange={e => setGiftOccasion(e.target.value)}>
                    {occasions.map(o => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Primary Interest or Hobby
                  <select value={giftInterest} onChange={e => setGiftInterest(e.target.value)}>
                    {interestOptions.map(i => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Gift Style & Tone
                  <select value={giftStyle} onChange={e => setGiftStyle(e.target.value)}>
                    {giftStyles.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Timeline & Urgency
                  <select value={giftUrgency} onChange={e => setGiftUrgency(e.target.value)}>
                    <option value="This Week">This Week (Immediate)</option>
                    <option value="Next 2 Weeks">Next 2 Weeks</option>
                    <option value="Next Month">Next Month (Upcoming cycle)</option>
                    <option value="Future Milestone">Future Milestone (Advance plan)</option>
                  </select>
                </label>

                <label>
                  Maximum Target Budget
                  <output style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#f472b6', fontWeight: 700 }}>
                    {formatINR(giftBudget)}
                  </output>
                  <input
                    type="range"
                    min="500"
                    max="25000"
                    step="500"
                    value={giftBudget}
                    onChange={e => setGiftBudget(Number(e.target.value))}
                  />
                  <small style={{ color: giftBudget <= finance.safeToSpend ? '#86efac' : '#fca5a5', fontSize: '11px' }}>
                    {giftBudget <= finance.safeToSpend
                      ? `✓ Comfortably within safe-to-spend (${formatINR(finance.safeToSpend)})`
                      : `⚠ Exceeds safe-to-spend by ${formatINR(giftBudget - finance.safeToSpend)}`}
                  </small>
                </label>
              </div>
            </div>

            {/* Live Gift Budget Gauge */}
            <div className="gift-results">
              <span className="simulation-tag" style={{ color: '#f472b6', borderColor: 'rgba(244,114,182,0.3)' }}>
                FINOVA GIFT FIT
              </span>
              <h3>
                Recommended Range: <strong>{formatINR(Math.round(giftBudget * 0.6))} – {formatINR(giftBudget)}</strong>
              </h3>
              <strong
                className="gift-status"
                style={{
                  color: giftBudget <= 3500 ? '#86efac' : giftBudget <= 8000 ? '#FBE4E3' : '#fde047',
                }}
              >
                {giftBudget <= 3500 ? '● COMFORTABLE TIER' : giftBudget <= 8000 ? '● BALANCED TIER' : '▲ STRETCH TIER'}
              </strong>

              <div style={{ margin: '14px 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                Matching gift options for a <strong>{giftRecipient}</strong> celebrating a <strong>{giftOccasion}</strong> with passion for <strong>{giftInterest}</strong>.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                  <span>Safe-to-Spend Budget Share:</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {Math.min(100, Math.round((giftBudget / Math.max(1, finance.safeToSpend)) * 100))}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round((giftBudget / Math.max(1, finance.safeToSpend)) * 100))}%`,
                      background: giftBudget <= finance.safeToSpend ? '#f472b6' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Curated Recommendations Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <span className="panel-kicker">CURATED GIFT SUGGESTIONS / REAL PRODUCTS</span>
                <h3 style={{ fontSize: '18px', color: '#f8fafc', margin: '4px 0 0 0' }}>
                  Tailored to {giftRecipient} ({giftInterest})
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>6 personalized options generated</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {giftRecommendations.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(244, 114, 182, 0.15)',
                          color: '#f472b6',
                          fontWeight: 700,
                        }}
                      >
                        {item.retailer}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: "'IBM Plex Mono', monospace",
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: item.evaluation.statusTag === 'SAFE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: item.evaluation.statusTag === 'SAFE' ? '#86efac' : '#fde047',
                          fontWeight: 700,
                        }}
                      >
                        {item.evaluation.statusTag}
                      </span>
                    </div>

                    <strong style={{ fontSize: '14px', color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                      {item.title}
                    </strong>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '16px', color: '#FBE4E3', fontWeight: 700, marginBottom: '8px' }}>
                      {formatINR(item.price)}
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>
                      {item.reason}
                    </p>
                  </div>

                  {/* Financial Impact Bar */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '11px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: '#64748b' }}>Safe-to-Spend:</span>
                    <span style={{ color: item.price <= finance.safeToSpend ? '#86efac' : '#f87171' }}>
                      − {formatINR(item.price)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleLoadGiftIntoDesigner(item)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(116, 217, 255, 0.15)',
                        border: '1px solid #FBE4E3',
                        borderRadius: '6px',
                        color: '#FBE4E3',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Simulate in Designer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addCommitment({
                          id: `com-gift-${Date.now()}`,
                          name: `Gift for ${giftRecipient}: ${item.title}`,
                          amount: item.price,
                          date: 'Day 15',
                          type: 'Discretionary',
                        })
                        showToast(`Saved "${item.title}" to monthly gift commitments!`, 'success')
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#cbd5e1',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                      title="Save as Upcoming Commitment"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MULTI-OPTION COMPARISON MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span className="panel-kicker">SIDE-BY-SIDE MATRIX</span>
            <h2 style={{ fontSize: '20px', color: '#f8fafc', margin: '4px 0 8px 0' }}>
              Compare Multiple Purchase Tiers
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              Test higher and lower tier models against each other to identify the optimal price-to-peace balance.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {activeMatrix.map((opt, idx) => (
              <div
                key={opt.id}
                style={{
                  background: opt.isCurrent ? 'rgba(116, 217, 255, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${opt.isCurrent ? '#FBE4E3' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                }}
              >
                {opt.isCurrent && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      background: '#FBE4E3',
                      color: '#06101c',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    CURRENT DESIGNER TARGET
                  </span>
                )}

                <div>
                  <input
                    type="text"
                    value={opt.name}
                    onChange={e => {
                      const updated = [...matrixOptions]
                      updated[idx].name = e.target.value
                      setMatrixOptions(updated)
                    }}
                    style={{
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px dashed rgba(255,255,255,0.2)',
                      color: '#f8fafc',
                      fontSize: '16px',
                      fontWeight: 700,
                      width: '100%',
                      padding: '4px 0',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <span style={{ color: '#FBE4E3', fontFamily: "'IBM Plex Mono', monospace", fontSize: '20px', fontWeight: 700 }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      value={opt.price}
                      onChange={e => {
                        const updated = [...matrixOptions]
                        updated[idx].price = Math.max(0, Number(e.target.value))
                        setMatrixOptions(updated)
                      }}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#FBE4E3',
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '18px',
                        fontWeight: 700,
                        width: '140px',
                        padding: '4px 8px',
                      }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#94a3b8' }}>Remaining Safe:</span>
                    <strong style={{ color: opt.safeAfter > 0 ? '#86efac' : '#f87171' }}>{formatINR(opt.safeAfter)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#94a3b8' }}>Goal Delay:</span>
                    <span style={{ color: opt.evaluation.goalDelayDays === 0 ? '#86efac' : '#fde047' }}>
                      {opt.evaluation.goalDelayDays === 0 ? 'None' : `+ ${opt.evaluation.goalDelayDays} days`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#94a3b8' }}>Affordability:</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          opt.evaluation.statusTag === 'SAFE'
                            ? '#86efac'
                            : opt.evaluation.statusTag === 'CONSIDER'
                            ? '#fde047'
                            : '#f87171',
                      }}
                    >
                      {opt.evaluation.statusTag}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPurchaseName(opt.name)
                    setPrice(opt.price)
                    setActiveTab('designer')
                    showToast(`Loaded "${opt.name}" into Purchase Designer.`, 'info')
                  }}
                  style={{
                    padding: '8px',
                    background: opt.isCurrent ? 'rgba(116, 217, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${opt.isCurrent ? '#FBE4E3' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '6px',
                    color: opt.isCurrent ? '#FBE4E3' : '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {opt.isCurrent ? 'Currently Active' : 'Load Into Designer ↗'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: UNPLANNED EVENT MODE */}
      {/* ========================================================================= */}
      {activeTab === 'event' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section className="event-mode-action" style={{ display: 'block' }}>
            <div style={{ maxWidth: '640px', marginBottom: '20px' }}>
              <span className="panel-kicker">SUDDEN EXPENSE / EVENT SIMULATION</span>
              <h2>Life Does Not Follow a Fixed Budget</h2>
              <p>
                Model unexpected repairs, sudden medical costs, or sudden life milestones against your financial twin to determine whether to fund from emergency reserves, cash flow, or a short-term installment plan.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'rgba(6, 16, 28, 0.8)', padding: '18px', borderRadius: '10px', border: '1px solid rgba(251, 146, 60, 0.3)' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  What type of event occurred?
                </label>
                <select
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#0c1322', color: '#fff', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '14px' }}
                >
                  <option value="Home Appliance Breakdown">Home Appliance Breakdown (AC / Fridge)</option>
                  <option value="Vehicle Major Repair">Vehicle Major Repair & Service</option>
                  <option value="Medical Out-of-Pocket">Medical Out-of-Pocket Prescription</option>
                  <option value="Urgent Family Travel">Urgent Family Flight / Transit</option>
                  <option value="Gadget Replacement">Essential Work Laptop / Phone Repair</option>
                </select>

                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  Funding Strategy Preference
                </label>
                <select
                  value={eventFundingPlan}
                  onChange={e => setEventFundingPlan(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', background: '#0c1322', color: '#fff', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '14px' }}
                >
                  <option value="buffer">Draw from Emergency Reserve Buffer</option>
                  <option value="liquid">Absorb from Current Safe-to-Spend</option>
                  <option value="emi">Spread Across 6-Month Installments</option>
                </select>

                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  Expected Amount (INR)
                </label>
                <output style={{ display: 'block', fontSize: '20px', fontFamily: "'IBM Plex Mono', monospace", color: '#fb923c', fontWeight: 700, marginBottom: '6px' }}>
                  {formatINR(eventAmount)}
                </output>
                <input
                  type="range"
                  min="2000"
                  max="75000"
                  step="1000"
                  value={eventAmount}
                  onChange={e => setEventAmount(Number(e.target.value))}
                />
              </div>

              {/* Resolution Strategy */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span className="panel-kicker">RECOMMENDED FUNDING ROUTE</span>
                  <h3 style={{ fontSize: '16px', color: '#f8fafc', margin: '4px 0 8px 0' }}>
                    {eventAmount <= finance.safeToSpend
                      ? 'Fund Entirely From Current Safe-to-Spend'
                      : eventAmount <= finance.balance
                      ? 'Fund From Emergency Reserve & Replenish in 3 Months'
                      : 'Split Into Low-Cost 6-Month Installments'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                    {eventStatus.explanation}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      addTransaction({
                        id: `tx-event-${Date.now()}`,
                        name: `[Event] ${eventTitle}`,
                        category: 'Emergency',
                        amount: eventAmount,
                        date: new Date().toISOString().split('T')[0],
                      })
                      showToast(`Recorded ${formatINR(eventAmount)} event expense.`, 'success')
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'rgba(251, 146, 60, 0.2)',
                      border: '1px solid #fb923c',
                      borderRadius: '6px',
                      color: '#fb923c',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Absorb & Record Event
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="purchase-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PurchaseImpactVisual({
  price,
  purchase,
  status,
  paymentMode,
  monthlyEmi,
  categoryBudgetStatus,
  primaryGoalName,
  goalDelayDays,
}: {
  price: number
  purchase: string
  status: 'SAFE' | 'CONSIDER' | 'AVOID'
  paymentMode: 'upfront' | 'emi'
  monthlyEmi: number
  categoryBudgetStatus: { text: string; isOver: boolean; pct: number }
  primaryGoalName: string
  goalDelayDays: number
}) {
  return (
    <section className="purchase-impact">
      <div className="impact-visual">
        <div className="impact-orbit orbit-a" />
        <div className="impact-orbit orbit-b" />
        <div className="impact-core">
          <PlasmaRing
            background="rgba(0,0,0,0)"
            colors={
              status === 'SAFE'
                ? ['#D72638', '#D72638', '#98111E']
                : status === 'CONSIDER'
                ? ['#fbbf24', '#f97316', '#a855f7']
                : ['#f87171', '#ef4444', '#7f1d1d']
            }
            density={40}
            speed={24}
            centerOpacity={8}
            scale={30}
            style={{ width: '100%', height: '100%' }}
          />
          <span>
            {paymentMode === 'emi' ? `₹${Math.round(monthlyEmi / 1000)}k` : `₹${Math.round(price / 1000)}k`}
            <small>{paymentMode === 'emi' ? '/ MONTH' : 'PURCHASE'}</small>
          </span>
        </div>
        <span className="impact-label impact-label-one">CURRENT LIQUIDITY</span>
        <span className="impact-label impact-label-two">MONTHLY CASH FLOW</span>
        <span className="impact-label impact-label-three">GOAL PROTECTION</span>
        <span className="impact-label impact-label-four">FUTURE TWIN</span>
      </div>

      <div className="impact-copy">
        <span className="panel-kicker">HOLISTIC IMPACT EVALUATION</span>
        <h2>
          {purchase || 'Your purchase'}<br />
          <em>in context.</em>
        </h2>

        <div className="impact-path">
          LIQUID CASH <b>↓</b> CATEGORY BUDGET <b>↓</b> {primaryGoalName.toUpperCase()}
        </div>

        <strong className={`impact-status ${status.toLowerCase()}`}>
          {status} · {paymentMode === 'emi' ? `EMI PLAN (${formatINR(monthlyEmi)}/mo)` : 'UPFRONT'}
        </strong>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0', fontSize: '12px', color: '#94a3b8' }}>
          <div>
            <strong>Goal Timeline:</strong>{' '}
            <span style={{ color: goalDelayDays === 0 ? '#86efac' : '#fde047' }}>
              {goalDelayDays === 0 ? 'Zero delay' : `+${goalDelayDays} days shift on ${primaryGoalName}`}
            </span>
          </div>
          <div>
            <strong>Category Limit:</strong>{' '}
            <span style={{ color: categoryBudgetStatus.isOver ? '#fca5a5' : '#cbd5e1' }}>
              {categoryBudgetStatus.text}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
          Every impact shown is dynamically derived from your active financial state without mutating your data until you confirm.
        </p>
      </div>
    </section>
  )
}

function generateCuratedGiftRecommendations(
  recipient: string,
  occasion: string,
  interest: string,
  style: string,
  budget: number,
  intelligence: FinancialIntelligence,
  finance: DemoFinancialState
) {
  const recommendationsPool = [
    {
      title: 'Kindle Paperwhite (16 GB, Glare-Free)',
      price: 13999,
      retailer: 'Amazon India',
      category: 'Books & Productivity',
      interest: 'Books & Productivity',
      reason: 'Perfect for avid readers; lightweight with adjustable warm light for comfortable night reading.',
    },
    {
      title: 'Aeropress Coffee & Espresso Maker Set',
      price: 4499,
      retailer: 'Blue Tokai',
      category: 'Coffee & Culinary',
      interest: 'Coffee & Culinary',
      reason: 'Artisanal immersion brewing system favored by coffee connoisseurs worldwide.',
    },
    {
      title: 'Sony WH-CH720N Noise Canceling Headphones',
      price: 9990,
      retailer: 'Croma',
      category: 'Tech & Gadgets',
      interest: 'Tech & Gadgets',
      reason: 'Crisp audio with Dual Noise Sensor technology and 35-hour battery life for daily work & travel.',
    },
    {
      title: 'Logitech MX Master 3S Wireless Mouse',
      price: 8995,
      retailer: 'Amazon India',
      category: 'Tech & Gadgets',
      interest: 'Books & Productivity',
      reason: 'Industry-standard ergonomic productivity mouse with MagSpeed electromagnetic scrolling.',
    },
    {
      title: 'Razer Kishi V2 Mobile Gaming Controller',
      price: 7999,
      retailer: 'Tata CLiQ',
      category: 'Gaming & Esports',
      interest: 'Gaming & Esports',
      reason: 'Console-quality mobile gaming controller with microswitch buttons for iOS & Android.',
    },
    {
      title: 'Titan Edge Ceramic Ultra-Slim Watch',
      price: 16995,
      retailer: 'Titan World',
      category: 'Fashion & Styling',
      interest: 'Fashion & Styling',
      reason: 'World’s slimmest ceramic timepiece combining minimalist elegance with scratch-resistant durability.',
    },
    {
      title: 'Personalized Top-Grain Leather Desk Mat',
      price: 2899,
      retailer: 'The Gusto',
      category: 'Home Decor & Plants',
      interest: 'Books & Productivity',
      reason: 'Custom monogrammed executive desk pad crafted from cruelty-free vegan saddle leather.',
    },
    {
      title: 'Bose SoundLink Micro Bluetooth Speaker',
      price: 10900,
      retailer: 'Apple Store',
      category: 'Music & Audio',
      interest: 'Music & Audio',
      reason: 'Rugged IP67 waterproof wireless speaker delivering unexpectedly powerful bass on the go.',
    },
  ]

  // Scale prices to be relevant to the user's chosen budget slider
  return recommendationsPool.slice(0, 6).map(item => {
    const adjustedPrice = Math.min(budget, Math.max(1000, Math.round((item.price / 14000) * budget)))
    const evalRes = evaluatePurchaseDecision({ price: adjustedPrice }, intelligence, finance)
    return {
      ...item,
      price: adjustedPrice,
      evaluation: evalRes,
    }
  })
}
