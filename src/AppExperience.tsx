import { useEffect, useState, useMemo } from 'react'
import PlasmaRing from './components/originkit/ui/plasma-ring'
import PulsatingBorder from './components/originkit/ui/pulsating-border-custom-style'
import { useFinance, formatINR, type Goal } from './finance/FinanceContext'
import { getDynamicBudgetSuggestions } from './finance/dynamicSuggestions'
import { useAuth } from './auth/AuthContext'
import AuthScreen from './auth/AuthScreen'
import OnboardingWizard from './onboarding/OnboardingWizard'
import ActionCenter from './ActionCenter'
import SmartPurchases from './SmartPurchases'
import MoneyIntelligence from './MoneyIntelligence'
import CashFlowIntelligence from './CashFlowIntelligence'
import FinancialHealth from './FinancialHealth'
import AnimatedNumber from './components/AnimatedNumber'
import ScrollReveal from './components/ScrollReveal'
import SmartTransactionCaptureModal from './scanner/SmartTransactionCaptureModal'
import SmartMarketplace from './marketplace/SmartMarketplace'
import FinanceController from './controller/FinanceController'
import AuditTrail from './audit/AuditTrail'
import ReportsCenter from './reports/ReportsCenter'
import SignalsCenter from './signals/SignalsCenter'
import WhatIfSimulatorNew from './simulator/WhatIfSimulator'
import './AppExperience.css'

type View =
  | 'Overview'
  | 'Finance Controller'
  | 'Action Center'
  | 'Money'
  | 'Transactions'
  | 'Goals'
  | 'Financial Health'
  | 'Cash Flow'
  | 'What-If'
  | 'Reports'
  | 'Audit Trail'
  | 'Signals'
  | 'Smart Purchases'
  | 'Financial Twin'
  | 'AI Advisor'
  | 'Gift Advisor'
  | 'Purchase Advisor'

const views: View[] = [
  'Overview',
  'Finance Controller',
  'Action Center',
  'Money',
  'Transactions',
  'Goals',
  'Financial Health',
  'Cash Flow',
  'What-If',
  'Reports',
  'Audit Trail',
  'Signals',
  'Smart Purchases',
  'Financial Twin',
  'AI Advisor',
  'Gift Advisor',
  'Purchase Advisor',
]

export default function AppExperience({ onExit }: { onExit?: () => void }) {
  const { state: finance } = useFinance()
  const { user, syncStatus } = useAuth()
  const [view, setView] = useState<View>('Overview')
  const [drawer, setDrawer] = useState(false)
  const [modal, setModal] = useState<string | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const navigate = (next: View) => {
    setView(next)
    setDrawer(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const onNavigate = (event: Event) => navigate((event as CustomEvent<View>).detail)
    const onModal = (event: Event) => setModal((event as CustomEvent<string>).detail)
    window.addEventListener('finova-navigate', onNavigate)
    window.addEventListener('finova-modal', onModal)
    return () => {
      window.removeEventListener('finova-navigate', onNavigate)
      window.removeEventListener('finova-modal', onModal)
    }
  }, [])

  // If not authenticated, render the dedicated FINOVA Auth experience
  if (!user) {
    return <AuthScreen onExit={onExit} />
  }

  // If custom user hasn't finished onboarding, route to Onboarding wizard
  if (!user.isDemo && !user.hasCompletedOnboarding) {
    return <OnboardingWizard onExit={onExit} />
  }

  const initials = user?.avatarInitials || 'AS'
  const userName = user?.name || 'Alex Sharma'
  const userRole = user?.role || (user?.isDemo ? 'Demo profile' : 'Personal OS')

  return (
    <div className="os-shell">
      <div className="os-ambient" aria-hidden="true" />
      <aside className={drawer ? 'os-sidebar open' : 'os-sidebar'}>
        <div
          className="os-brand"
          style={{ cursor: onExit ? 'pointer' : 'default' }}
          onClick={onExit}
          title={onExit ? 'Click to return to landing overview' : undefined}
        >
          <span>FINOVA</span>
          <small>FINANCIAL OS {onExit && ' ⇦'}</small>
        </div>
        <button
          className="close-drawer"
          onClick={() => setDrawer(false)}
          aria-label="Close navigation"
        >
          ×
        </button>
        <nav className="os-nav" aria-label="Application navigation">
          {views.map(item => (
            <button
              className={view === item ? 'active' : ''}
              key={item}
              onClick={() => navigate(item)}
            >
              <NavIcon name={item} />
              {item}
            </button>
          ))}
        </nav>
        <div className="os-nav-bottom">
          <button onClick={() => setModal('Notifications')}>
            <NavIcon name="Notifications" />
            Notifications <b>3</b>
          </button>
          <button onClick={() => setModal('Settings')}>
            <NavIcon name="Settings" />
            Settings
          </button>
          <button className="profile-mini" onClick={() => setModal('Profile')}>
            <span>{initials}</span>
            <div>
              {userName}
              <small>{userRole}</small>
            </div>
          </button>
        </div>
      </aside>
      <div className="os-main">
        <header className="os-topbar">
          <button
            className="drawer-trigger"
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
          >
            ☰
          </button>
          <div>
            <span className="greeting">Good morning, {userName.split(' ')[0]}</span>
            <span className="ai-status">
              <i /> FINOVA AI · {syncStatus === 'syncing' ? 'SYNCING...' : 'ONLINE'}
            </span>
          </div>
          <div className="top-actions">
            <span className="health">
              Financial Health <strong>{finance.financialHealth} / 100</strong>
            </span>
            <button aria-label="Search" onClick={() => setModal('Search')}>
              ⌕
            </button>
            <button aria-label="Notifications" onClick={() => setModal('Notifications')}>
              ◌<b>3</b>
            </button>
            <button className="avatar" onClick={() => setModal('Profile')}>
              {initials}
            </button>
          </div>
        </header>
        <main className="os-content">
          <ViewContent
            view={view}
            navigate={navigate}
            openModal={setModal}
            selectGoal={setSelectedGoal}
            selectedGoal={selectedGoal}
          />
          <QuickActions openModal={setModal} navigate={navigate} />
        </main>
      </div>
      {modal && <Modal type={modal} close={() => setModal(null)} navigate={navigate} onExit={onExit} />}
    </div>
  )
}

function ViewContent({
  view,
  navigate,
  openModal,
  selectGoal,
  selectedGoal,
}: {
  view: View
  navigate: (view: View) => void
  openModal: (value: string) => void
  selectGoal: (goal: Goal) => void
  selectedGoal: Goal | null
}) {
  return (
    <div key={view} className="view-transition-container">
      {(() => {
        if (view === 'Overview')
          return (
            <Overview
              navigate={navigate}
              openModal={openModal}
              selectGoal={g => {
                selectGoal(g)
                navigate('Goals')
              }}
            />
          )
        if (view === 'Finance Controller') return <FinanceController />
        if (view === 'Action Center') return <ActionCenter navigate={navigate as any} openModal={openModal} />
        if (view === 'Goals') return <Goals initialGoalId={selectedGoal?.id} />
        if (view === 'What-If') return <WhatIfSimulatorNew />
        if (view === 'Reports') return <ReportsCenter />
        if (view === 'Audit Trail') return <AuditTrail />
        if (view === 'Signals') return <SignalsCenter onNavigate={navigate} />
        if (view === 'AI Advisor') return <Advisor />
        if (view === 'Gift Advisor') return <GiftAdvisor openModal={openModal} />
        if (view === 'Purchase Advisor') return <PurchaseAdvisor />
        if (view === 'Smart Purchases') return <SmartPurchases />
        if (view === 'Cash Flow') return <CashFlowIntelligence />
        if (view === 'Financial Health') return <FinancialHealth />
        if (view === 'Money') return <MoneyIntelligence focus="overview" />
        if (view === 'Transactions') return <MoneyIntelligence focus="transactions" />
        if (view === 'Financial Twin') return <Twin />
        return <ListView view={view} selectedGoal={selectedGoal} />
      })()}
    </div>
  )
}

function Overview({ navigate, openModal, selectGoal }: { navigate: (view: View) => void; openModal: (value: string) => void; selectGoal: (goal: Goal) => void }) {
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">OVERVIEW / SIMULATION SPACE</span>
          <h1>
            Your financial life.<br />
            <em>Under control.</em>
          </h1>
          <p>FINOVA continuously understands your money, your goals and your upcoming decisions.</p>
        </div>
        <div className="date-chip">AUG 27, 2026 <span>LIVE ENGINE</span></div>
      </div>
      <Snapshot />
      <div className="overview-grid">
        <ScrollReveal delay={50}>
          <Insight openModal={openModal} />
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <CashFlow />
        </ScrollReveal>
      </div>
      <div className="lower-grid">
        <ScrollReveal delay={150}>
          <Upcoming />
        </ScrollReveal>
        <ScrollReveal delay={200}>
          <GoalOverview selectGoal={selectGoal} />
        </ScrollReveal>
      </div>
      <div className="section-title">
        <span>YOUR INTELLIGENCE LAYER</span>
        <button onClick={() => navigate('Financial Twin')}>Open Financial Twin ↗</button>
      </div>
      <ScrollReveal delay={250}>
        <TwinPreview />
      </ScrollReveal>
    </>
  )
}

function Snapshot() {
  const { state: finance } = useFinance();
  const averageGoalProgress = Math.round(
    finance.goals.reduce((sum, goal) => sum + (goal.target > 0 ? (goal.saved / goal.target) * 100 : 0), 0) /
    Math.max(1, finance.goals.length)
  );

  return (
    <div className="snapshot-grid">
      <ScrollReveal staggerIndex={0} staggerDelay={40}>
        <article className="snapshot-card balance">
          <span>TOTAL BALANCE<i>ACTIVE</i></span>
          <strong>
            <AnimatedNumber value={finance.balance} format="currency" />
          </strong>
          <small>+ 4.2%</small>
          <div className="sparkline" />
        </article>
      </ScrollReveal>
      <ScrollReveal staggerIndex={1} staggerDelay={40}>
        <article className="snapshot-card spend">
          <span>MONTHLY SPENDING<i>ACTIVE</i></span>
          <strong>
            <AnimatedNumber value={finance.monthlySpending} format="currency" />
          </strong>
          <small>− 8.0%</small>
          <div className="sparkline" />
        </article>
      </ScrollReveal>
      <ScrollReveal staggerIndex={2} staggerDelay={40}>
        <article className="snapshot-card safe">
          <span>SAFE TO SPEND<i>ACTIVE</i></span>
          <strong>
            <AnimatedNumber value={finance.safeToSpend} format="currency" />
          </strong>
          <small>within range</small>
          <div className="sparkline" />
        </article>
      </ScrollReveal>
      <ScrollReveal staggerIndex={3} staggerDelay={40}>
        <article className="snapshot-card goal">
          <span>GOAL PROGRESS<i>ACTIVE</i></span>
          <strong>
            <AnimatedNumber value={averageGoalProgress} format="percent" />
          </strong>
          <small>+ 6.4%</small>
          <div className="sparkline" />
        </article>
      </ScrollReveal>
    </div>
  )
}
function Insight({ openModal }: { openModal: (value: string) => void }) { return <section className="insight-card"><div className="card-top"><span className="panel-kicker">FINOVA INSIGHT <i /> SIMULATED</span><span className="card-orb">∿</span></div><h2>Your financial signals<br /><em>are moving well.</em></h2><p>Your spending is currently <strong>8% lower</strong> than your average monthly pattern.</p><p>At your current pace, you are on track to reach your emergency fund goal <strong>18 days earlier.</strong></p><button className="soft-button" onClick={() => openModal('Insight')}>Explore Insight <span>↗</span></button></section> }
function CashFlow() { const { state: finance } = useFinance(); const [range, setRange] = useState('30D'); const points = finance.cashFlow[range] ?? []; return <section className="cash-card"><div className="card-top"><div><span className="panel-kicker">CASH FLOW</span><h3>Movement over time</h3></div><div className="range-tabs">{['7D', '30D', '90D', '1Y'].map(item => <button className={range === item ? 'active' : ''} onClick={() => setRange(item)} key={item}>{item}</button>)}</div></div><div className="chart"><div className="chart-grid" /> <svg viewBox="0 0 600 190" role="img" aria-label="Demo cash flow chart"><polyline points={points.map((point, index) => `${index * (600 / Math.max(1, points.length - 1))},${170 - point.income / 600}`).join(' ')} /><polyline className="expense-line" points={points.map((point, index) => `${index * (600 / Math.max(1, points.length - 1))},${170 - point.expenses / 280}`).join(' ')} />{points.map((point, index) => <circle key={index} cx={index * (600 / Math.max(1, points.length - 1))} cy={170 - point.expenses / 280} r="4"><title>{`Demo expenses: ${formatINR(point.expenses)}`}</title></circle>)}</svg></div><div className="chart-legend"><span><i /> Income</span><span><i /> Expenses</span><span><i /> Savings</span><small>Illustrative demo data</small></div></section> }
function Upcoming() { const { state: finance } = useFinance(); return <section className="plain-section"><div className="card-top"><div><span className="panel-kicker">UPCOMING</span><h3>What is next</h3></div><button className="link-button">View all ↗</button></div>{finance.upcoming.map(item => <div className="upcoming-row" key={item.name}><span className="list-icon">○</span><div><strong>{item.name}</strong><small>{item.due} · Demo</small></div><b>{formatINR(item.amount)}</b></div>)}</section> }
function GoalOverview({ selectGoal }: { selectGoal: (goal: Goal) => void }) { const { state: finance } = useFinance(); return <section className="plain-section"><div className="card-top"><div><span className="panel-kicker">GOALS</span><h3>Building what matters</h3></div></div>{finance.goals.map(goal => <button className="goal-row" key={goal.id} onClick={() => selectGoal(goal)}><span className="goal-mark" /><div><strong>{goal.name}</strong><small>{formatINR(goal.saved)} / {formatINR(goal.target)}</small></div><div className="mini-progress"><i style={{ width: `${goal.saved / goal.target * 100}%` }} /></div><b>{Math.round(goal.saved / goal.target * 100)}%</b></button>)}</section> }
function TwinPreview() { return <section className="twin-preview"><div className="twin-mini"><div className="twin-mini-lines" /><PlasmaRing background="rgba(0,0,0,0)" colors={['#73eaff', '#6677ff', '#b55dff']} density={42} speed={30} centerOpacity={10} scale={30} style={{ width: '100%', height: '100%' }} /><span>FINOVA<br /><small>TWIN</small></span></div><div><span className="panel-kicker">YOUR FINANCIAL TWIN</span><h2>A living view of your<br /><em>financial context.</em></h2><p>Your Financial Twin is continuously learning your financial patterns. <small>Frontend simulation architecture.</small></p></div></section> }

function Goals({ initialGoalId }: { initialGoalId?: string }) { return <GoalSimulator initialGoalId={initialGoalId} /> }

function GoalSimulator({ initialGoalId }: { initialGoalId?: string }) {
  const {
    state: finance,
    addGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
    withdrawFromGoal,
  } = useFinance()

  const [selectedId, setSelectedId] = useState(
    initialGoalId || finance.goals[0]?.id || 'new'
  )

  const selectedGoal = finance.goals.find(goal => goal.id === selectedId)
  const isNew = selectedId === 'new' || !selectedGoal

  const [goalName, setGoalName] = useState(selectedGoal?.name ?? 'New Goal')
  const [target, setTarget] = useState(selectedGoal?.target ?? 150000)
  const [current, setCurrent] = useState(selectedGoal?.saved ?? 0)
  const [contribution, setContribution] = useState(selectedGoal?.monthlyContribution ?? 12000)
  const [monthlyExpense, setMonthlyExpense] = useState(finance.monthlySpending)
  const [targetDate, setTargetDate] = useState(selectedGoal?.targetDate ?? '2027-12-01')
  const [priority, setPriority] = useState(selectedGoal?.priority ?? 'High')
  const [extraSave, setExtraSave] = useState(3000)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [transferModal, setTransferModal] = useState<'contribute' | 'withdraw' | null>(null)
  const [transferAmount, setTransferAmount] = useState<number>(5000)

  // Keep state synchronized with selected goal
  useEffect(() => {
    if (selectedGoal) {
      setGoalName(selectedGoal.name)
      setTarget(selectedGoal.target)
      setCurrent(selectedGoal.saved)
      if (selectedGoal.monthlyContribution) {
        setContribution(selectedGoal.monthlyContribution)
      }
      if (selectedGoal.targetDate) {
        setTargetDate(selectedGoal.targetDate)
      }
      if (selectedGoal.priority) {
        setPriority(selectedGoal.priority)
      }
    }
  }, [selectedGoal])

  const selectGoal = (goal: Goal) => {
    setSelectedId(goal.id)
    setGoalName(goal.name)
    setTarget(goal.target)
    setCurrent(goal.saved)
    setContribution(goal.monthlyContribution ?? 12000)
    setPriority(goal.priority ?? 'Medium')
    if (goal.targetDate) setTargetDate(goal.targetDate)
  }

  const handleCreateNew = () => {
    setSelectedId('new')
    setGoalName('New Goal')
    setTarget(100000)
    setCurrent(0)
    setContribution(10000)
    setTargetDate('2028-01-01')
    setPriority('Medium')
  }

  const remaining = Math.max(0, target - current)
  const today = new Date()
  const deadline = new Date(`${targetDate}T00:00:00`)
  const monthsToTarget = Math.max(
    1,
    (deadline.getFullYear() - today.getFullYear()) * 12 + deadline.getMonth() - today.getMonth()
  )
  const required = Math.ceil(remaining / monthsToTarget)
  const projectedMonths = remaining === 0 ? 0 : Math.ceil(remaining / Math.max(contribution, 1))
  const optimizedMonths = remaining === 0 ? 0 : Math.ceil(remaining / Math.max(contribution + extraSave, 1))
  const projectedDate = addMonths(today, projectedMonths)
  const optimizedDate = addMonths(today, optimizedMonths)
  const onTrack = contribution >= required
  const health = remaining === 0 || onTrack ? 'ON TRACK' : contribution >= required * 0.7 ? 'AT RISK' : 'NEEDS ADJUSTMENT'
  const healthCopy =
    health === 'ON TRACK'
      ? 'Your current contribution is sufficient to reach this goal within the selected target date.'
      : health === 'AT RISK'
      ? 'A small contribution increase could keep this goal within its selected target date.'
      : 'Your current contribution needs adjustment to reach this goal within the selected target date.'

  const safeToSpend = Math.max(
    0,
    finance.safeToSpend - Math.max(0, contribution - 5000) - Math.max(0, monthlyExpense - finance.monthlySpending)
  )

  const handleSaveGoal = () => {
    const trimmed = goalName.trim()
    if (!trimmed) return
    const targetAmt = Math.max(1, Number(target) || 1)
    const savedAmt = Math.max(0, Number(current) || 0)
    const monthlyAmt = Math.max(0, Number(contribution) || 0)

    if (!isNew && selectedGoal) {
      updateGoal(selectedGoal.id, {
        name: trimmed,
        target: targetAmt,
        saved: savedAmt,
        monthlyContribution: monthlyAmt,
        priority: priority as 'High' | 'Medium' | 'Low',
        targetDate,
        completion: formatDate(projectedDate),
      })
      setFeedback(`Goal "${trimmed}" updated successfully.`)
    } else {
      const newId = `goal-${Date.now()}`
      addGoal({
        id: newId,
        name: trimmed,
        target: targetAmt,
        saved: savedAmt,
        monthlyContribution: monthlyAmt,
        priority: priority as 'High' | 'Medium' | 'Low',
        targetDate,
        completion: formatDate(projectedDate),
      })
      setSelectedId(newId)
      setFeedback(`Goal "${trimmed}" created successfully.`)
    }
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleDeleteGoal = () => {
    if (isNew || !selectedGoal) {
      handleCreateNew()
      return
    }
    const name = selectedGoal.name
    deleteGoal(selectedGoal.id)
    const remainingGoals = finance.goals.filter(g => g.id !== selectedGoal.id)
    if (remainingGoals.length > 0) {
      selectGoal(remainingGoals[0])
    } else {
      handleCreateNew()
    }
    setFeedback(`Goal "${name}" deleted.`)
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleExecuteTransfer = () => {
    const amount = Number(transferAmount)
    if (!amount || amount <= 0 || !selectedGoal) return

    if (transferModal === 'contribute') {
      contributeToGoal(selectedGoal.id, amount)
      setFeedback(`Allocated ${formatINR(amount)} to ${selectedGoal.name}.`)
    } else if (transferModal === 'withdraw') {
      const withdrawAmt = Math.min(amount, selectedGoal.saved)
      withdrawFromGoal(selectedGoal.id, withdrawAmt)
      setFeedback(`Returned ${formatINR(withdrawAmt)} from ${selectedGoal.name} to available balance.`)
    }
    setTransferModal(null)
    setTimeout(() => setFeedback(null), 3500)
  }

  const chartPoints = projectionPoints(remaining, contribution, 7)
  const optimizedPoints = projectionPoints(remaining, contribution + extraSave, 7)

  return (
    <PageHeader
      kicker="GOALS / PLAN / SIMULATION"
      title="Your goals.<br /><em>Made predictable.</em>"
      copy="FINOVA simulates how today's decisions can change the path toward your goals. All values below are connected to your active financial context."
    >
      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            border: '1px solid #166534',
            background: 'rgba(22, 101, 52, 0.08)',
            color: '#166534',
            font: "11px 'DM Mono', monospace",
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '8px',
          }}
        >
          <span>✦ {feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 0, color: '#166534', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="simulator-goal-picker">
        {finance.goals.map(goal => (
          <button
            className={goal.id === selectedId ? 'active' : ''}
            key={goal.id}
            onClick={() => selectGoal(goal)}
          >
            <span>{goal.name}</span>
            <strong>{Math.round((goal.saved / Math.max(goal.target, 1)) * 100)}%</strong>
            <small>
              {formatINR(goal.saved)} / {formatINR(goal.target)}
            </small>
            <i>
              <b style={{ width: `${Math.min(100, (goal.saved / Math.max(goal.target, 1)) * 100)}%` }} />
            </i>
          </button>
        ))}
        <button
          className={`new-goal-button ${selectedId === 'new' ? 'active' : ''}`}
          onClick={handleCreateNew}
        >
          ＋ Create new goal
        </button>
      </div>

      <div className="simulator-layout">
        <section className="goal-input-panel">
          <div className="card-top">
            <span className="panel-kicker">
              {isNew ? 'CREATE GOAL' : 'CONFIGURE GOAL'} <i className="demo-dot" /> REACTIVE STATE
            </span>
            <span className={`health-badge ${health.toLowerCase().replace(' ', '-')}`}>{health}</span>
          </div>

          <label>
            Goal name
            <input value={goalName} onChange={event => setGoalName(event.target.value)} />
          </label>

          <div className="input-pair">
            <label>
              Target amount
              <input
                type="number"
                min="1"
                value={target}
                onChange={event => setTarget(Number(event.target.value))}
              />
            </label>
            <label>
              Current savings
              <input
                type="number"
                min="0"
                value={current}
                onChange={event => setCurrent(Number(event.target.value))}
              />
            </label>
          </div>

          <label>
            Monthly contribution <output>{formatINR(contribution)}</output>
            <input
              type="range"
              min="0"
              max="50000"
              step="500"
              value={contribution}
              onChange={event => setContribution(Number(event.target.value))}
            />
          </label>

          <label>
            Monthly expense <output>{formatINR(monthlyExpense)}</output>
            <input
              type="range"
              min="10000"
              max="100000"
              step="1000"
              value={monthlyExpense}
              onChange={event => setMonthlyExpense(Number(event.target.value))}
            />
          </label>

          <div className="input-pair">
            <label>
              Target date
              <input
                type="date"
                value={targetDate}
                onChange={event => setTargetDate(event.target.value)}
              />
            </label>
            <label>
              Priority
              <select
                value={priority}
                onChange={event => setPriority(event.target.value as 'High' | 'Medium' | 'Low')}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px', margin: '14px 0 8px' }}>
            <button
              className="soft-button"
              type="button"
              style={{ flex: 1 }}
              onClick={handleSaveGoal}
            >
              {isNew ? 'Create goal ↗' : 'Save goal to plan ↗'}
            </button>
            {!isNew && selectedGoal && (
              <button
                className="soft-button"
                type="button"
                style={{
                  border: '1px solid rgba(153, 27, 27, 0.3)',
                  color: '#991b1b',
                  background: 'rgba(153, 27, 27, 0.08)',
                }}
                onClick={handleDeleteGoal}
                title="Delete this goal"
              >
                Delete
              </button>
            )}
          </div>

          {!isNew && selectedGoal && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '12px',
                padding: '10px',
                border: '1px solid var(--os-line)',
                background: '#F8F4EC',
                borderRadius: '8px',
              }}
            >
              <button
                type="button"
                className="soft-button"
                style={{ fontSize: '10px', padding: '8px', margin: 0 }}
                onClick={() => {
                  setTransferAmount(5000)
                  setTransferModal('contribute')
                }}
              >
                ＋ Deposit Funds
              </button>
              <button
                type="button"
                className="soft-button"
                style={{ fontSize: '10px', padding: '8px', margin: 0 }}
                onClick={() => {
                  setTransferAmount(Math.min(5000, selectedGoal.saved))
                  setTransferModal('withdraw')
                }}
                disabled={selectedGoal.saved <= 0}
              >
                − Withdraw Funds
              </button>
            </div>
          )}

          <div className="goal-health-readout">
            <span>GOAL HEALTH</span>
            <strong>{health}</strong>
            <p>{healthCopy}</p>
          </div>
        </section>

        <section className="goal-core-panel">
          <div className="goal-core-scene">
            <div className="goal-orbit goal-orbit-a" />
            <div className="goal-orbit goal-orbit-b" />
            <div className="goal-core-ring">
              <PlasmaRing
                background="rgba(0,0,0,0)"
                colors={['#73eaff', '#6677ff', '#b55dff']}
                density={45}
                speed={28}
                centerOpacity={8}
                scale={30}
                style={{ width: '100%', height: '100%' }}
              />
              <span>
                {Math.round((current / Math.max(target, 1)) * 100)}
                <small>% FUNDED</small>
              </span>
            </div>
            <span className="goal-scene-label scene-label-a">CURRENT PATH</span>
            <span className="goal-scene-label scene-label-b">OPTIMIZED PATH</span>
          </div>
          <div className="goal-core-footer">
            <span>FINOVA GOAL CORE</span>
            <strong>{goalName}</strong>
            <small>Priority: {priority} · Reactive model</small>
          </div>
        </section>
      </div>

      <div className="goal-result-grid">
        <Metric label="AMOUNT REMAINING" value={formatINR(remaining)} />
        <Metric label="REQUIRED MONTHLY" value={formatINR(required)} />
        <Metric label="CURRENT CONTRIBUTION" value={formatINR(contribution)} />
        <Metric label="EST. COMPLETION" value={formatDate(projectedDate)} />
        <Metric label="TARGET DATE" value={formatDate(deadline)} />
      </div>

      <section className="projection-panel">
        <div className="card-top">
          <div>
            <span className="panel-kicker">
              GOAL PROJECTION <i className="demo-dot" /> LIVE CALCULATION
            </span>
            <h3>Two possible paths forward</h3>
          </div>
          <span className={onTrack ? 'projection-status on-track' : 'projection-status'}>
            {onTrack ? 'ON TRACK' : 'ADJUST CONTRIBUTION'}
          </span>
        </div>
        <div className="projection-chart">
          <div className="target-line">
            <span>TARGET</span>
          </div>
          <svg viewBox="0 0 700 210" preserveAspectRatio="none" role="img" aria-label="Goal projection paths">
            <polyline className="projection-current" points={chartPoints} />
            <polyline className="projection-optimized" points={optimizedPoints} />
            <circle cx="690" cy={chartY(remaining, contribution, 7)} r="4" />
            <circle
              className="optimized-dot"
              cx="690"
              cy={chartY(remaining, contribution + extraSave, 7)}
              r="4"
            />
          </svg>
          <div className="projection-legend">
            <span>
              <i className="current-dot" /> Current path · {formatDate(projectedDate)}
            </span>
            <span>
              <i className="optimized-dot" /> Optimized path · {formatDate(optimizedDate)}
            </span>
          </div>
        </div>
      </section>

      <section className="what-if-goal">
        <div>
          <span className="panel-kicker">WHAT IF? / SCENARIO BUILDER</span>
          <h2>
            What if you save <em>{formatINR(extraSave)}</em> more every month?
          </h2>
          <p>Adjust the scenario to see how a small change reshapes the illustrative projection.</p>
        </div>
        <div className="what-if-control">
          <strong>{formatINR(extraSave)}</strong>
          <input
            aria-label="Additional monthly saving"
            type="range"
            min="0"
            max="15000"
            step="500"
            value={extraSave}
            onChange={event => setExtraSave(Number(event.target.value))}
          />
          <div>
            <span>
              Current contribution <b>{formatINR(contribution)}</b>
            </span>
            <span>
              New contribution <b>{formatINR(contribution + extraSave)}</b>
            </span>
          </div>
        </div>
      </section>

      <section className="twin-impact-panel">
        <div>
          <span className="panel-kicker">IMPACT ON YOUR FINANCIAL TWIN</span>
          <h3>One goal contribution changes the whole picture.</h3>
        </div>
        <div className="twin-impact-grid">
          <Metric label="SAFE-TO-SPEND" value={formatINR(safeToSpend)} />
          <Metric
            label="MONTHLY SAVINGS"
            value={formatINR(adjustedSavings(contribution, monthlyExpense, finance.income))}
          />
          <Metric
            label="CASH FLOW"
            value={contribution + monthlyExpense > finance.income ? 'Tight' : 'Balanced'}
          />
          <Metric
            label="HEALTH SCORE"
            value={`${Math.max(
              0,
              finance.financialHealth - (contribution + monthlyExpense > finance.income ? 4 : 0)
            )} / 100`}
          />
        </div>
        <small>Connected to active financial state. Real-time conservation preserved.</small>
      </section>

      {transferModal && selectedGoal && (
        <div className="modal-backdrop" onClick={() => setTransferModal(null)}>
          <section className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setTransferModal(null)}>
              ×
            </button>
            <span className="panel-kicker">
              FINOVA / {transferModal === 'contribute' ? 'ALLOCATE SAVINGS' : 'REALLOCATE TO BALANCE'}
            </span>
            <h2>
              {transferModal === 'contribute'
                ? `Deposit to ${selectedGoal.name}`
                : `Withdraw from ${selectedGoal.name}`}
            </h2>
            <p>
              {transferModal === 'contribute'
                ? `Transfers funds from your liquid safe-to-spend balance (${formatINR(
                    finance.safeToSpend
                  )}) directly into this goal.`
                : `Returns allocated funds from this goal (${formatINR(
                    selectedGoal.saved
                  )}) back to your available liquid balance.`}
            </p>

            <div style={{ margin: '20px 0' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#756A60', font: "9px 'DM Mono', monospace" }}>
                TRANSFER AMOUNT (INR)
              </label>
              <input
                className="modal-input"
                type="number"
                min="100"
                max={transferModal === 'contribute' ? finance.balance : selectedGoal.saved}
                step="500"
                value={transferAmount}
                onChange={e => setTransferAmount(Number(e.target.value))}
                style={{
                  width: '100%',
                  border: '1px solid var(--os-line)',
                  padding: '12px',
                  background: '#F8F4EC',
                  color: '#211A17',
                  borderRadius: '6px',
                }}
              />
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                {[1000, 5000, 10000, 25000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    className="soft-button"
                    style={{ fontSize: '9px', padding: '6px 8px', margin: 0 }}
                    onClick={() => setTransferAmount(amt)}
                  >
                    +{formatINR(amt)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                style={{ border: 0, background: 'none', color: '#756A60', fontSize: '11px', cursor: 'pointer' }}
                onClick={() => setTransferModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="soft-button"
                style={{ margin: 0 }}
                onClick={handleExecuteTransfer}
              >
                Confirm Transfer ↗
              </button>
            </div>
          </section>
        </div>
      )}
    </PageHeader>
  )
}

function addMonths(date: Date, months: number) { const result = new Date(date); result.setMonth(result.getMonth() + months); return result }
function formatDate(date: Date) { return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) }
function adjustedSavings(contribution: number, expense: number, income: number) { return Math.max(0, income - expense - contribution) }
function chartY(remaining: number, monthly: number, months: number) { return 190 - Math.min(170, (remaining / Math.max(remaining, monthly * months, 1)) * 160) }
function projectionPoints(remaining: number, monthly: number, months: number) { return Array.from({ length: months + 1 }, (_, index) => `${index * (700 / months)},${chartY(Math.max(0, remaining - monthly * index), monthly, months)}`).join(' ') }
function WhatIf() { const { state: finance } = useFinance(); const [amount, setAmount] = useState(20000); const future = finance.balance - amount; const delay = amount > 30000 ? 21 : amount > 15000 ? 9 : 0; return <PageHeader kicker="WHAT-IF / SIMULATION" title="See the future<br /><em>before you decide.</em>" copy="Adjust a decision and watch the illustrative path respond."><PulsatingBorder colors={['#61eaff', '#716dff', '#61eaff']} radius={2} thickness={3} intensity={24} bloom={35} style={{ display: 'block' }}><div className="whatif-card"><div className="whatif-question">If I spend <strong>{formatINR(amount)}</strong> today...</div><input aria-label="Simulated purchase amount" type="range" min="5000" max="50000" step="5000" value={amount} onChange={event => setAmount(Number(event.target.value))} /><div className="result-grid"><Metric label="CURRENT BALANCE" value={formatINR(finance.balance)} /><Metric label="FUTURE BALANCE" value={formatINR(future)} /><Metric label="GOAL COMPLETION" value={delay ? `+ ${delay} days` : 'On track'} /><Metric label="SAVINGS RATE" value={`${Math.max(0, Math.round((finance.income - finance.monthlySpending - amount) / Math.max(1, finance.income) * 100))}%`} /><Metric label="SAFE-TO-SPEND" value={amount <= finance.safeToSpend ? 'Within range' : 'Reconsider'} /></div><span className={amount > 30000 ? 'risk-pill high' : amount > 15000 ? 'risk-pill caution' : 'risk-pill'}>{amount > 30000 ? '● Significant impact' : amount > 15000 ? '● Caution' : '● Within plan'}</span></div></PulsatingBorder></PageHeader> }
function Advisor() {
  const { state: finance, intelligence, topDecisions, askAdvisorAsync, evaluatePurchase } = useFinance();
  const [messages, setMessages] = useState<Array<{ from: string; text: string; time: string; model?: string; grounded?: boolean }>>([
    {
      from: 'FINOVA',
      text: 'Hello! I am your AI Financial Advisor powered by Gemini and grounded directly in your deterministic financial twin. How can I assist you with your money, goals, or upcoming purchases today?',
      time: 'Now',
      model: 'Gemini 3.7 Flash',
      grounded: true,
    },
  ]);
  const [question, setQuestion] = useState('');
  const [thinking, setThinking] = useState(false);
  const [decisionMode, setDecisionMode] = useState(false);
  const [decisionAmount, setDecisionAmount] = useState(20000);
  const [voiceDemo, setVoiceDemo] = useState(false);
  const avgGoalProgress = intelligence.goals.aggregateProgress;
  const suggestions = [
    'Can I afford a ₹25,000 purchase today?',
    'Why did I overspend in Dining this month?',
    'How am I tracking towards my emergency fund?',
    'How can I reach my MacBook Pro goal faster?',
    'What subscriptions should I consider trimming?',
    'Show my safe-to-spend breakdown',
    'What happens if I save ₹5,000 more every month?',
    'Help me plan an unexpected expense of ₹15,000',
  ];

  const ask = async (prompt: string) => {
    if (!prompt.trim() || thinking) return;
    const userText = prompt.trim();
    setQuestion('');
    setMessages(prev => [...prev, { from: 'YOU', text: userText, time: 'Just now' }]);
    setThinking(true);

    try {
      const res = await askAdvisorAsync(userText);
      setMessages(prev => [
        ...prev,
        {
          from: 'FINOVA',
          text: res.answer,
          time: 'Just now',
          model: res.model || 'Gemini 3.7 Flash',
          grounded: res.grounded !== false,
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          from: 'FINOVA',
          text: 'I encountered a temporary connection issue. Your deterministic safe-to-spend balance is ' + formatINR(finance.safeToSpend) + '. Please try asking again.',
          time: 'Just now',
          grounded: true,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const clear = () =>
    setMessages([
      {
        from: 'FINOVA',
        text: 'Conversation reset. I am ready to evaluate your financial state and answer any questions.',
        time: 'Now',
        model: 'Gemini 3.7 Flash',
        grounded: true,
      },
    ]);

  const purchaseEvaluation = evaluatePurchase({ price: decisionAmount });
  const decisionImpact = purchaseEvaluation.remainingSafe;
  const decisionStatus = purchaseEvaluation.statusTag;

  return (
    <PageHeader
      kicker="AI ADVISOR / INTELLIGENCE LAYER"
      title="Your financial intelligence.<br /><em>Always thinking ahead.</em>"
      copy="Ask FINOVA about your money, goals, spending, and upcoming decisions. Powered by Gemini 3.7 Flash and strictly grounded in your active financial state."
    >
      <div className="advisor-layout">
        <section className="advisor-workspace">
          <div className="advisor-toolbar">
            <span className="panel-kicker">
              <i className="advisor-live-dot" /> FINOVA GEMINI AI · DUAL ENGINE ACTIVE
            </span>
            <button onClick={clear}>Clear conversation</button>
          </div>
          <div className="conversation-feed" aria-live="polite">
            {messages.map((message, index) => (
              <div
                className={message.from === 'FINOVA' ? 'conversation-message finova' : 'conversation-message user'}
                key={`${message.time}-${index}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span>{message.from}</span>
                  {message.model && (
                    <span style={{ fontSize: '9px', color: '#98111E', letterSpacing: '0.04em', background: 'rgba(152, 17, 30, 0.08)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(152, 17, 30, 0.2)', fontWeight: 600 }}>
                      ✦ {message.model}
                    </span>
                  )}
                </div>
                <p style={{ whiteSpace: 'pre-line' }}>{message.text}</p>
                <small>{message.time}</small>
              </div>
            ))}
            {thinking && (
              <div className="thinking-message">
                <i />
                <i />
                <i /> FINOVA & Gemini are analyzing your financial state...
              </div>
            )}
          </div>
          <div className="advisor-suggestions">
            <span className="panel-kicker">SUGGESTED QUESTIONS</span>
            <div>
              {suggestions.map(prompt => (
                <button key={prompt} onClick={() => ask(prompt)}>
                  {prompt} <span>↗</span>
                </button>
              ))}
            </div>
          </div>
          <form
            className="advisor-input"
            onSubmit={event => {
              event.preventDefault();
              if (question.trim()) ask(question.trim());
            }}
          >
            <input
              value={question}
              onChange={event => setQuestion(event.target.value)}
              placeholder="Ask anything about your money, goals, or budgets..."
              aria-label="Ask FINOVA about your money"
              disabled={thinking}
            />
            <button type="button" aria-label="Voice mode demo" onClick={() => setVoiceDemo(!voiceDemo)}>
              ◉
            </button>
            <button type="submit" disabled={thinking || !question.trim()}>
              {thinking ? 'Analyzing...' : 'Ask FINOVA ↗'}
            </button>
          </form>
          {voiceDemo && (
            <div className="voice-demo">
              VOICE MODE DEMO · Speak to FINOVA: "Can I afford to purchase a smartphone for ₹30,000 this weekend?"
            </div>
          )}
        </section>
        <aside className="advisor-context">
          <div className="context-heading">
            <span className="panel-kicker">FINANCIAL CONTEXT</span>
            <b>REAL-TIME TWIN</b>
          </div>
          <ContextMetric label="FINANCIAL HEALTH" value={`${intelligence.health.score} / 100`} tone="cyan" />
          <ContextMetric label="SAFE TO SPEND" value={formatINR(intelligence.liquidity.safeToSpend)} />
          <ContextMetric label="MONTHLY INCOME" value={formatINR(intelligence.cashFlow.monthlyIncome)} />
          <ContextMetric label="MONTHLY EXPENSES" value={formatINR(intelligence.cashFlow.monthlySpending)} />
          <ContextMetric label="SAVINGS" value={formatINR(intelligence.cashFlow.monthlySurplus)} />
          <ContextMetric label="GOAL PROGRESS" value={`${avgGoalProgress}%`} />
          <div className="context-links">
            <button onClick={() => window.dispatchEvent(new CustomEvent('finova-navigate', { detail: 'Financial Twin' }))}>
              Open Financial Twin ↗
            </button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('finova-navigate', { detail: 'What-If' }))}>
              Open What-If Simulator ↗
            </button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('finova-navigate', { detail: 'Action Center' }))}>
              Open Action Center ↗
            </button>
          </div>
        </aside>
      </div>
      <section className="advisor-insights">
        <div className="card-top">
          <div>
            <span className="panel-kicker">AI DIRECTIVES / ACTIVE INTELLIGENCE</span>
            <h3>Signals worth noticing</h3>
          </div>
          <span className="advisor-count">{topDecisions.length > 0 ? `0${Math.min(9, topDecisions.length)}` : '00'}</span>
        </div>
        <div className="insight-cards">
          {topDecisions.slice(0, 3).map(dec => (
            <InsightCard key={dec.id} title={dec.title} text={dec.summary} />
          ))}
          {topDecisions.length === 0 && (
            <InsightCard
              title="Financial Stability"
              text="All liquidity, cash flow, budget, and goal metrics are within target thresholds."
            />
          )}
        </div>
      </section>
      <section className="decision-mode">
        <div>
          <span className="panel-kicker">DECISION MODE / INSTANT PURCHASE EVALUATION</span>
          <h3>Test a decision before it becomes one.</h3>
          <p>Enter an illustrative purchase amount. FINOVA evaluates it against your active state.</p>
        </div>
        <div className="decision-control">
          <label>
            Can I spend <strong>{formatINR(decisionAmount)}</strong>?
          </label>
          <input
            aria-label="Decision amount"
            type="range"
            min="1000"
            max="60000"
            step="1000"
            value={decisionAmount}
            onChange={event => setDecisionAmount(Number(event.target.value))}
          />
          <div className="decision-results">
            <ContextMetric label="PROJECTED BALANCE" value={formatINR(Math.max(0, finance.balance - decisionAmount))} />
            <ContextMetric label="SAFE-TO-SPEND IMPACT" value={formatINR(decisionImpact)} />
            <ContextMetric label="GOAL IMPACT" value={purchaseEvaluation.goalImpactText} />
            <span className={`decision-status ${decisionStatus.toLowerCase()}`}>{decisionStatus}</span>
          </div>
          <button className="decision-toggle" onClick={() => setDecisionMode(!decisionMode)}>
            {decisionMode ? 'Decision details open' : 'Review projected impact'} ↗
          </button>
          {decisionMode && <p className="decision-detail">{purchaseEvaluation.explanation}</p>}
        </div>
      </section>
    </PageHeader>
  );
}
function ContextMetric({ label, value, tone }: { label: string; value: string; tone?: string }) { return <div className={`context-metric ${tone ?? ''}`}><span>{label}</span><strong>{value}</strong></div> }
function InsightCard({ title, text }: { title: string; text: string }) { return <button className="insight-card-item"><span>{title}</span><p>{text}</p><b>↗</b></button> }
function GiftAdvisor({ openModal }: { openModal: (value: string) => void }) {
  const { state: finance } = useFinance();
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(5000);
  const [answers, setAnswers] = useState({
    recipient: 'Close Friend',
    occasion: 'Birthday',
    interest: 'Tech & Gadgets',
    style: 'Useful',
    timeline: 'Next 2 Weeks',
  });

  const questions = [
    'Who is it for?',
    'What is the occasion?',
    'What do they like?',
    "What's your maximum budget?",
    'When do you need it?',
    'What style?',
  ];

  // Dynamic context-aware suggestions calculated deterministically in real-time
  const dynamicSuggestions = useMemo(() => {
    return getDynamicBudgetSuggestions({
      income: finance.income,
      commitments: finance.commitments,
      monthlySpending: finance.monthlySpending,
      safeToSpend: finance.safeToSpend,
      goals: finance.goals,
      maxBudget: budget,
      recipient: answers.recipient,
      occasion: answers.occasion,
      interest: answers.interest,
      selectedPreference: answers.style,
    });
  }, [finance.income, finance.commitments, finance.monthlySpending, finance.safeToSpend, finance.goals, budget, answers.recipient, answers.occasion, answers.interest, answers.style]);

  const currentOptions = useMemo(() => {
    switch (step) {
      case 0:
        return ['Colleague', 'Close Friend', 'Partner / Spouse', 'Family Member', 'Mentor / Boss'];
      case 1:
        return ['Birthday', 'Anniversary', 'Promotion / Career', 'Housewarming', 'Festival / Holiday'];
      case 2:
        return ['Tech & Gadgets', 'Coffee & Culinary', 'Books & Productivity', 'Fitness & Outdoor', 'Art & Lifestyle'];
      case 3:
        // Dynamic suggestions chips for Step 4
        return dynamicSuggestions.map(s => s.label);
      case 4:
        return ['This Week (Immediate)', 'Next 2 Weeks', 'Next Month', 'Flexible / Advance Plan'];
      case 5:
        // Dynamic style archetypes
        return dynamicSuggestions.map(s => s.label);
      default:
        return [];
    }
  }, [step, dynamicSuggestions]);

  const handleSelectOption = (option: string) => {
    if (step === 0) setAnswers(prev => ({ ...prev, recipient: option }));
    else if (step === 1) setAnswers(prev => ({ ...prev, occasion: option }));
    else if (step === 2) setAnswers(prev => ({ ...prev, interest: option }));
    else if (step === 3 || step === 5) setAnswers(prev => ({ ...prev, style: option }));
    else if (step === 4) setAnswers(prev => ({ ...prev, timeline: option }));

    setStep(prev => Math.min(prev + 1, questions.length));
  };

  const isWithinSafe = budget <= (finance.safeToSpend || 14800);

  return (
    <PageHeader
      kicker="GIFT ADVISOR / DEMO"
      title="Find the right gift."
      copy="A context-aware guided flow for thoughtful spending without losing your financial plan."
    >
      <div className="advisor-flow" style={{ maxWidth: '720px' }}>
        <div className="flow-progress">
          <i style={{ width: `${(Math.min(step + 1, questions.length) / questions.length) * 100}%` }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span className="panel-kicker" style={{ margin: 0 }}>
            {step < questions.length ? `STEP 0${step + 1} OF 0${questions.length}` : 'FINOVA RECOMMENDATION'}
          </span>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(prev => Math.max(0, prev - 1))}
              style={{
                background: 'none',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#94a3b8',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          )}
        </div>

        {step < questions.length ? (
          <div>
            <h2 style={{ margin: '16px 0 24px', fontSize: '24px', fontWeight: 600 }}>{questions[step]}</h2>

            {/* STEP 4 (Index 3): Interactive Dynamic Budget & Real-time Suggestions */}
            {step === 3 && (
              <div
                style={{
                  background: '#F8F4EC',
                  border: '1px solid var(--os-line)',
                  borderRadius: '10px',
                  padding: '20px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'DM Mono', monospace" }}>
                      MAXIMUM BUDGET
                    </span>
                    <strong style={{ display: 'block', fontSize: '22px', color: '#211A17', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                      {formatINR(budget)}
                    </strong>
                  </div>
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: "'DM Mono', monospace",
                      border: isWithinSafe ? '1px solid rgba(22, 101, 52, 0.3)' : '1px solid rgba(180, 83, 9, 0.3)',
                      background: isWithinSafe ? 'rgba(22, 101, 52, 0.08)' : 'rgba(180, 83, 9, 0.08)',
                      color: isWithinSafe ? '#166534' : '#b45309',
                      fontWeight: 500,
                    }}
                  >
                    {isWithinSafe
                      ? `✓ Comfortably safe (Capacity: ${formatINR(finance.safeToSpend || 14800)})`
                      : `▲ Stretches safe-to-spend by ${formatINR(budget - (finance.safeToSpend || 14800))}`}
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#98111E', cursor: 'pointer' }}
                  aria-label="Adjust maximum gift budget"
                />

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[2500, 5000, 10000, 25000, 50000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBudget(val)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: "'DM Mono', monospace",
                        border: budget === val ? '1px solid #98111E' : '1px solid var(--os-line)',
                        background: budget === val ? '#FFFDF8' : 'transparent',
                        color: budget === val ? '#98111E' : '#756A60',
                        fontWeight: budget === val ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {formatINR(val)}
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>
                    FINANCIAL CONTEXT SUGGESTIONS (ADAPTIVE TIER)
                  </span>
                </div>
              </div>
            )}

            {/* Suggestion Chips */}
            <div className="option-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', margin: '16px 0 24px' }}>
              {step === 3 || step === 5
                ? dynamicSuggestions.map(suggestion => {
                    const isSelected = answers.style === suggestion.label;
                    return (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleSelectOption(suggestion.label)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: isSelected
                            ? '1px solid #98111E'
                            : suggestion.isFeatured
                            ? '1px solid rgba(180, 83, 9, 0.4)'
                            : '1px solid var(--os-line)',
                          background: isSelected
                            ? '#FFFDF8'
                            : suggestion.isFeatured
                            ? 'rgba(180, 83, 9, 0.06)'
                            : '#F8F4EC',
                          color: isSelected ? '#98111E' : suggestion.isFeatured ? '#b45309' : '#211A17',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <strong style={{ fontSize: '12px', fontWeight: 600 }}>{suggestion.label}</strong>
                          {suggestion.isFeatured && (
                            <span style={{ fontSize: '8px', fontFamily: "'DM Mono', monospace", color: '#b45309', border: '1px solid rgba(180,83,9,0.3)', padding: '1px 4px', borderRadius: '3px' }}>
                              KEY FIT
                            </span>
                          )}
                        </div>
                        <small style={{ fontSize: '10px', color: '#756A60', marginTop: '4px', lineHeight: 1.3 }}>
                          {suggestion.description}
                        </small>
                      </button>
                    );
                  })
                : currentOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--os-line)',
                        background: '#F8F4EC',
                        color: '#211A17',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {option}
                    </button>
                  ))}
            </div>

            {/* Navigation Skip & Continue */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--os-line)' }}>
              <button
                type="button"
                onClick={() => setStep(prev => Math.min(prev + 1, questions.length))}
                style={{
                  background: 'none',
                  border: 0,
                  color: '#756A60',
                  fontSize: '11px',
                  fontFamily: "'DM Mono', monospace",
                  cursor: 'pointer',
                }}
              >
                Skip Question →
              </button>

              <button
                type="button"
                onClick={() => setStep(prev => Math.min(prev + 1, questions.length))}
                style={{
                  padding: '8px 18px',
                  background: '#98111E',
                  color: '#FFFDF8',
                  border: '1px solid #98111E',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        ) : (
          /* STEP 6: Synthesized Recommendations View */
          <div className="recommendation-box" style={{ background: '#FFFDF8', border: '1px solid var(--os-line)', borderRadius: '10px', padding: '24px', boxShadow: '0 4px 20px rgba(63, 13, 18, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#98111E', fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', fontWeight: 600 }}>
                FINOVA SYNTHESIS / CURATED FIT
              </span>
              <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'DM Mono', monospace" }}>
                {answers.recipient} · {answers.occasion}
              </span>
            </div>

            <strong style={{ display: 'block', margin: '14px 0 6px', fontSize: '26px', color: '#211A17', fontFamily: "'DM Mono', monospace" }}>
              {formatINR(Math.round(budget * 0.7))} – {formatINR(budget)}
            </strong>

            <p style={{ color: '#524840', fontSize: '12px', margin: '0 0 16px', lineHeight: 1.6 }}>
              Optimized for <strong>{answers.style}</strong> archetype matching <strong>{answers.interest}</strong> within your safe-to-spend plan.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '18px 0', borderTop: '1px solid var(--os-line)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F8F4EC', borderRadius: '8px', border: '1px solid var(--os-line)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '12px', color: '#211A17' }}>
                    {answers.interest.includes('Tech') ? 'Top-Grain Leather Desk Mat & Organizer' : `${answers.interest} Artisan Edition`}
                  </strong>
                  <small style={{ color: '#756A60', fontSize: '10px' }}>Goal impact: None · 100% Within Plan</small>
                </div>
                <b style={{ color: '#98111E', fontFamily: "'DM Mono', monospace", fontSize: '13px' }}>
                  {formatINR(Math.round(budget * 0.65))}
                </b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#F8F4EC', borderRadius: '8px', border: '1px solid var(--os-line)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '12px', color: '#211A17' }}>
                    {answers.interest.includes('Coffee') ? 'Specialty Roast Tasting & Ceramic Dripper' : `Curated ${answers.style} Gift Box`}
                  </strong>
                  <small style={{ color: '#756A60', fontSize: '10px' }}>Goal impact: Minimal · Buffer protected</small>
                </div>
                <b style={{ color: '#98111E', fontFamily: "'DM Mono', monospace", fontSize: '13px' }}>
                  {formatINR(Math.round(budget * 0.9))}
                </b>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                className="soft-button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('finova-marketplace-search', {
                      detail: {
                        query: `${answers.occasion || 'Gift'} ${answers.recipient || 'friend'} ${answers.interest || ''}`.trim(),
                        budget: budget,
                        category: 'Gifts',
                      },
                    })
                  );
                  openModal('Live products');
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#98111E',
                  color: '#FFFDF8',
                  border: '1px solid #98111E',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Find Actual Products ↗
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setBudget(5000);
                }}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: '#756A60',
                  border: '1px solid var(--os-line)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Restart Flow
              </button>
            </div>
          </div>
        )}
      </div>
    </PageHeader>
  );
}
function PurchaseAdvisor() {
  return (
    <PageHeader
      kicker="PURCHASE ADVISOR / SMART DISCOVERY"
      title="Before you buy,<br /><em>ask FINOVA.</em>"
      copy="Evaluate any purchase decision against your uncommitted budget, cash flow, goals, and upcoming commitments before finding live retailer search options."
    >
      <div style={{ marginTop: '20px' }}>
        <SmartMarketplace initialQuery="Laptop for college" initialBudget={50000} initialCategory="Electronics" />
      </div>
    </PageHeader>
  );
}
function Twin() { const { state: finance } = useFinance(); const [activeFactor, setActiveFactor] = useState('Spending control'); const [extraSpend, setExtraSpend] = useState(0); const [flowStep, setFlowStep] = useState(0); const factors = [['Spending control', 86], ['Savings strength', 78], ['Emergency readiness', 81], ['Debt load', 88], ['Goal progress', 77]] as const; const flow = ['Income', 'Fixed Expenses', 'Variable Expenses', 'Savings', 'Goals / Investments']; const adjustedSafe = Math.max(0, finance.safeToSpend - extraSpend); const adjustedSavings = Math.max(0, finance.income - finance.monthlySpending - extraSpend); return <PageHeader kicker="FINANCIAL TWIN / SIMULATION" title="A living view of<br /><em>your financial life.</em>" copy="A frontend simulation architecture using clearly labeled demo data. It does not claim active machine learning or personalized advice."><div className="twin-command-grid"><section className="twin-health-card"><div className="card-top"><span className="panel-kicker">FINANCIAL HEALTH CORE <i className="demo-dot" /> DEMO DATA</span><span className="twin-refresh">↻</span></div><div className="health-score"><div className="score-ring" style={{ '--score': `${finance.financialHealth * 3.6}deg` } as React.CSSProperties}><strong>{finance.financialHealth}</strong><small>/ 100</small></div><div><span>SIMULATED HEALTH SCORE</span><p>Strong foundations with room to protect more of your future cash flow.</p></div></div><div className="factor-list">{factors.map(([name, score]) => <button className={activeFactor === name ? 'active' : ''} key={name} onClick={() => setActiveFactor(name)}><span>{name}</span><i><b style={{ width: `${score}%` }} /></i><strong>{score}</strong></button>)}</div><div className="factor-detail"><span>SELECTED FACTOR</span><strong>{activeFactor}</strong><p>{activeFactor} is an illustrative lens on the demo financial state.</p></div></section><section className="twin-orbit-card"><div className="twin-orbit-scene"><div className="twin-connection connection-one" /><div className="twin-connection connection-two" /><div className="twin-data data-one">INCOME</div><div className="twin-data data-two">GOALS</div><div className="twin-data data-three">FORECAST</div><div className="twin-data data-four">BEHAVIOR</div><div className="twin-orbit-core"><PlasmaRing background="rgba(0,0,0,0)" colors={['#73eaff', '#6677ff', '#b55dff']} density={48} speed={26} centerOpacity={8} scale={30} style={{ width: '100%', height: '100%' }} /><span>FINOVA<br /><small>TWIN</small></span></div></div><div className="card-top"><span className="panel-kicker">YOUR FINANCIAL TWIN</span><span className="demo-badge">DEMO MODEL</span></div><p className="twin-note">Your Financial Twin is continuously learning your financial patterns.<small>Simulation architecture only. No live learning is occurring.</small></p></section></div><section className="twin-flow-card"><div className="card-top"><div><span className="panel-kicker">FINANCIAL FLOW <i className="demo-dot" /> DEMO DATA</span><h3>How one signal becomes a decision</h3></div><span className="flow-count">0{flowStep + 1} / 05</span></div><div className="flow-track">{flow.map((item, index) => <button className={index <= flowStep ? 'flow-node active' : 'flow-node'} key={item} onClick={() => setFlowStep(index)}><i>{index + 1}</i><strong>{item}</strong>{index < flow.length - 1 && <b>↓</b>}</button>)}</div><p className="flow-readout">{flow[flowStep]} <span>is visible in the Twin's simulated context.</span></p></section><div className="twin-detail-grid"><TwinCashFlow /><section className="safe-spend-card"><div className="card-top"><span className="panel-kicker">SAFE-TO-SPEND <i className="demo-dot" /> DEMO DATA</span><span className="safe-icon">◌</span></div><strong>{formatINR(adjustedSafe)}</strong><p>Comfortable spending range after your demo commitments.</p><label>What if I spend more?</label><input aria-label="Adjust demo spending" type="range" min="0" max="10000" step="1000" value={extraSpend} onChange={event => setExtraSpend(Number(event.target.value))} /><div className="safe-compare"><span>+ {formatINR(extraSpend)} scenario</span><b>{formatINR(adjustedSavings)} projected savings</b></div><small>Local illustrative calculation, not financial advice.</small></section></div><section className="twin-goals-section"><div className="card-top"><div><span className="panel-kicker">GOAL IMPACT</span><h3>Current signals, future direction</h3></div><span className="demo-badge">SIMULATED</span></div><div className="twin-goal-grid">{finance.goals.map(goal => <div className="twin-goal" key={goal.id}><span>{goal.name}</span><strong>{Math.round(goal.saved / goal.target * 100)}%</strong><div><i style={{ width: `${Math.max(5, goal.saved / goal.target * 100 - extraSpend / 1000)}%` }} /></div><small>{formatINR(goal.saved)} / {formatINR(goal.target)} · Est. {goal.completion}</small></div>)}</div></section></PageHeader> }

function TwinCashFlow() { const { state: finance } = useFinance(); const months = [{ name: 'MAR', income: 79000, expenses: 41000, savings: 38000 }, { name: 'APR', income: 82000, expenses: 36000, savings: 46000 }, { name: 'MAY', income: 80000, expenses: 39000, savings: 41000 }, { name: 'JUN', income: 86000, expenses: 35000, savings: 51000 }, { name: 'JUL', income: 84000, expenses: 37000, savings: 47000 }, { name: 'AUG', income: finance.income, expenses: finance.monthlySpending, savings: finance.income - finance.monthlySpending }]; const max = Math.max(...months.map(month => month.income)); return <section className="twin-cash-card"><div className="card-top"><div><span className="panel-kicker">MONTHLY CASH FLOW <i className="demo-dot" /> DEMO DATA</span><h3>Six-month signal history</h3></div><span className="chart-key"><i /> Income <i /> Expenses <i /> Savings</span></div><div className="twin-chart" aria-label="Six month demo cash flow chart">{months.map(month => <div className="month-column" key={month.name}><div className="bars"><i className="income-bar" style={{ height: `${month.income / max * 100}%` }} title={`Income ${formatINR(month.income)}`} /><i className="expense-bar" style={{ height: `${month.expenses / max * 100}%` }} title={`Expenses ${formatINR(month.expenses)}`} /><i className="saving-bar" style={{ height: `${month.savings / max * 100}%` }} title={`Savings ${formatINR(month.savings)}`} /></div><span>{month.name}</span></div>)}</div><small className="chart-note">Hover bars for illustrative values. No connected account data.</small></section> }
function Reports() { return <PageHeader kicker="REPORTS / DEMO" title="Your finances,<br /><em>explained simply.</em>" copy="Clear rhythms for important signals and decisions."><div className="report-cards">{[['DAILY', 'Important financial signals'], ['WEEKLY', 'Spending behavior and recommendations'], ['MONTHLY', 'Financial health report']].map(([label, title]) => <article key={label}><span>{label}</span><h3>{title}</h3><p>Example report preview</p><b>↗</b></article>)}</div></PageHeader> }
function ListView({ view }: { view: View; selectedGoal: Goal | null }) { const { state: finance } = useFinance(); const title = view === 'Transactions' ? 'Your recent money movement.' : view === 'Money' ? 'See every signal together.' : `Your ${view.toLowerCase()} workspace.`; return <PageHeader kicker={`${view.toUpperCase()} / DEMO`} title={title} copy="This workspace is powered by the centralized illustrative financial state."><div className="transaction-list">{finance.transactions.map((item, idx) => <div key={item.id || `${item.name}-${idx}`}><span className="list-icon">○</span><div><strong>{item.name}</strong><small>{item.category} · {item.date}</small></div><b className={item.category === 'Income' ? 'positive' : ''}>{item.category === 'Income' ? '+' : '−'} {formatINR(item.amount)}</b></div>)}</div></PageHeader> }
function PageHeader({ kicker, title, copy, children }: { kicker: string; title: string; copy: string; children: React.ReactNode }) { return <div className="workspace-page"><div className="page-intro"><div><span className="eyebrow">{kicker}</span><h1 dangerouslySetInnerHTML={{ __html: title }} /><p>{copy}</p></div><span className="demo-badge">FINOVA 3.0 OS</span></div>{children}</div> }
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div> }
function QuickActions({ openModal, navigate }: { openModal: (value: string) => void; navigate: (view: View) => void }) {
  const actions = [
    ['⚖', 'Controller & Reconciliation', 'Finance Controller'],
    ['⚡', 'Action Center', 'Action Center'],
    ['＋', 'Add Transaction', 'Add Transaction'],
    ['◎', 'Create Goal', 'Goals'],
    ['◇', 'What If?', 'What-If'],
    ['📄', 'Financial Reports', 'Reports'],
    ['📜', 'Audit Trail', 'Audit Trail'],
    ['✦', 'Find a Gift', 'Gift Advisor'],
    ['▣', 'Plan a Purchase', 'Purchase Advisor'],
  ]
  return (
    <section className="quick-actions">
      <div className="section-title">
        <span>QUICK ACTIONS</span>
      </div>
      <div>
        {actions.map(([icon, label, target]) => (
          <button
            key={label}
            onClick={() =>
              target === 'Event Mode' || target === 'Add Transaction'
                ? openModal(target)
                : navigate(target as View)
            }
          >
            <b>{icon}</b>
            {label}
            <span>↗</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Modal({ type, close, navigate, onExit }: { type: string; close: () => void; navigate: (view: View) => void; onExit?: () => void }) {
  if (type === 'Add Transaction' || type === 'Scan Bill' || type === 'AddTransaction') {
    return <SmartTransactionCaptureModal close={close} onSuccessNavigate={navigate as any} />
  }

  const { state: finance, resetFinancialState } = useFinance();
  const { user, loginAsDemo, login, signup, logout, syncStatus, triggerManualSync, lastSyncedAt } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState(false);

  const emergencyFund = finance.goals.find(g => g.name.toLowerCase().includes('emergency')) ?? finance.goals[1];
  const emergencyPct = emergencyFund ? Math.round((emergencyFund.saved / Math.max(emergencyFund.target, 1)) * 100) : 68;
  const primaryGoal = finance.goals[0];

  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!emailInput.trim()) return;
    setIsAuthSubmitting(true);

    if (authMode === 'signin') {
      const res = await login(emailInput.trim(), passwordInput.trim() || undefined);
      if (!res.success) {
        setAuthError(res.error || 'Unable to sign in');
      } else {
        close();
      }
    } else {
      const res = await signup(nameInput.trim(), emailInput.trim(), passwordInput.trim() || undefined);
      if (!res.success) {
        setAuthError(res.error || 'Unable to create account');
      } else {
        close();
      }
    }
    setIsAuthSubmitting(false);
  };

  const handleCloudSync = async () => {
    await triggerManualSync();
    setSyncSuccessMessage(true);
    setTimeout(() => setSyncSuccessMessage(false), 2500);
  };

  const isMarketplace = type === 'Live products' || type === 'Marketplace' || type === 'Smart Marketplace';

  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        className="modal"
        onClick={event => event.stopPropagation()}
        style={{
          maxWidth: isMarketplace ? '1100px' : '520px',
          width: isMarketplace ? '95vw' : undefined,
          maxHeight: isMarketplace ? '90vh' : undefined,
          overflowY: isMarketplace ? 'auto' : undefined,
          padding: isMarketplace ? '28px' : undefined,
        }}
      >
        <button className="modal-close" onClick={close} aria-label="Close dialog">
          ×
        </button>
        <span className="panel-kicker">FINOVA OS / {type.toUpperCase()}</span>
        <h2>
          {type === 'Notifications'
            ? 'Active signals & alerts'
            : type === 'Event Mode'
            ? 'Life does not follow your budget.'
            : type === 'Settings'
            ? 'System Settings & Cloud Sync'
            : type === 'Profile'
            ? 'User Account & Profiles'
            : isMarketplace
            ? 'Smart Marketplace & Product Discovery'
            : 'Your FINOVA Space'}
        </h2>

        {type === 'Notifications' && (
          <div style={{ marginTop: '14px' }}>
            <SignalsCenter onNavigate={(v) => { close(); navigate(v as any); }} />
          </div>
        )}

        {type === 'Profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8F4EC', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--os-line)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #98111E, #3F0D12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: '#FFFDF8' }}>
                {user?.avatarInitials || 'AS'}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '14px', color: '#211A17' }}>{user?.name}</strong>
                <small style={{ color: '#756A60', fontSize: '11px', display: 'block' }}>{user?.email}</small>
                <small style={{ color: '#98111E', fontSize: '10px', fontFamily: "'DM Mono', monospace" }}>
                  {user?.isDemo ? 'DEMO PROFILE' : 'REGISTERED FINANCIAL OS'} · FOCUS: {user?.financialPreference || 'Balanced Growth'}
                </small>
              </div>
              <span style={{ fontSize: '10px', color: '#166534', background: 'rgba(22, 101, 52, 0.1)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {syncStatus === 'synced' ? '● Synced' : syncStatus === 'syncing' ? '● Syncing' : '○ Local'}
              </span>
            </div>

            <div>
              <span className="panel-kicker" style={{ marginBottom: '8px', display: 'block' }}>SWITCH PRESET DEMO PROFILES</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={user?.id === 'user-demo-alex' ? 'soft-button' : 'stage-item'}
                  style={{ margin: 0, padding: '10px', fontSize: '12px', textAlign: 'left', background: user?.id === 'user-demo-alex' ? '#FFFDF8' : '#F8F4EC', border: '1px solid var(--os-line)', color: '#211A17', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => { loginAsDemo('alex'); close(); }}
                >
                  <strong style={{ color: '#211A17' }}>Alex Sharma</strong>
                  <small style={{ display: 'block', color: '#756A60' }}>Data Architect / Primary Twin</small>
                </button>
                <button
                  type="button"
                  className={user?.id === 'user-demo-priya' ? 'soft-button' : 'stage-item'}
                  style={{ margin: 0, padding: '10px', fontSize: '12px', textAlign: 'left', background: user?.id === 'user-demo-priya' ? '#FFFDF8' : '#F8F4EC', border: '1px solid var(--os-line)', color: '#211A17', borderRadius: '8px', cursor: 'pointer' }}
                  onClick={() => { loginAsDemo('priya'); close(); }}
                >
                  <strong style={{ color: '#211A17' }}>Priya Patel</strong>
                  <small style={{ display: 'block', color: '#756A60' }}>Growth Investor Profile</small>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--os-line)', paddingTop: '14px' }}>
              <span className="panel-kicker">SESSION ACTIONS</span>
              <button
                type="button"
                className="soft-button"
                style={{ width: '100%', margin: 0, background: '#F8F4EC', border: '1px solid var(--os-line)', color: '#211A17' }}
                onClick={() => { logout(); close(); }}
              >
                Sign Out / Switch Account ⇦
              </button>

              {onExit && (
                <button
                  type="button"
                  style={{ border: 0, background: 'transparent', color: '#98111E', fontSize: '12px', cursor: 'pointer', textAlign: 'center', marginTop: '4px', fontWeight: 500 }}
                  onClick={() => { logout(); close(); onExit(); }}
                >
                  Sign out & return to landing overview
                </button>
              )}
            </div>
          </div>
        )}

        {type === 'Settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            <div style={{ background: '#F8F4EC', padding: '14px', borderRadius: '10px', border: '1px solid var(--os-line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#211A17' }}>Local & Cloud Persistence</strong>
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>
                  {syncStatus === 'synced' ? 'Active' : syncStatus === 'syncing' ? 'Syncing...' : 'Local Cache'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#756A60', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                FINOVA state is continuously saved in local storage and synced. Last active: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Just now'}.
              </p>
              <button className="soft-button" style={{ margin: 0, width: '100%', background: '#FFFDF8', border: '1px solid var(--os-line)', color: '#98111E', fontWeight: 600 }} onClick={handleCloudSync} disabled={syncStatus === 'syncing'}>
                {syncSuccessMessage ? '✓ Synced Successfully' : syncStatus === 'syncing' ? 'Syncing...' : 'Force Sync Now ↻'}
              </button>
            </div>

            <div style={{ background: '#F8F4EC', padding: '14px', borderRadius: '10px', border: '1px solid var(--os-line)' }}>
              <strong style={{ fontSize: '13px', color: '#211A17', display: 'block', marginBottom: '6px' }}>AI Engine Grounding</strong>
              <p style={{ fontSize: '12px', color: '#756A60', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                Gemini 3.7 Flash is connected server-side via Node SDK and receives real-time deterministic context vectors (health, safe-to-spend, cash flow, goals) on every prompt.
              </p>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                <span style={{ background: 'rgba(152, 17, 30, 0.08)', color: '#98111E', padding: '3px 8px', borderRadius: '4px', fontWeight: 500 }}>AI: Connected</span>
                <span style={{ background: 'rgba(22, 101, 52, 0.08)', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontWeight: 500 }}>Deterministic Engine: Synced</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--os-line)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="panel-kicker">DATA MANAGEMENT</span>
              <button
                className="stage-item"
                style={{ width: '100%', margin: 0, padding: '10px', fontSize: '12px', background: '#F8F4EC', border: '1px solid var(--os-line)', color: '#211A17', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}
                type="button"
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(finance, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `finova_backup_${new Date().toISOString().split('T')[0]}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
              >
                <span style={{ fontFamily: "'DM Mono', monospace", color: '#98111E', fontWeight: 600 }}>01</span>
                <strong style={{ flex: 1, color: '#211A17' }}>Export Financial Backup (JSON)</strong>
                <small style={{ color: '#756A60' }}>Download offline snapshot</small>
                <i style={{ color: '#98111E', fontStyle: 'normal' }}>↓</i>
              </button>

              <button
                className="soft-button"
                type="button"
                style={{ background: 'rgba(152, 17, 30, 0.06)', color: '#98111E', border: '1px solid rgba(152, 17, 30, 0.25)', borderRadius: '8px', cursor: 'pointer', padding: '10px' }}
                onClick={() => {
                  if (confirm('Are you sure you want to reset all financial data to the initial state?')) {
                    resetFinancialState();
                    close();
                  }
                }}
              >
                Reset to initial state ↺
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--os-line)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="panel-kicker">ACCOUNT & SESSION</span>
              <button
                type="button"
                className="soft-button"
                style={{ width: '100%', margin: 0, background: '#F8F4EC', border: '1px solid var(--os-line)', color: '#211A17', borderRadius: '8px' }}
                onClick={() => { logout(); close(); }}
              >
                Sign Out / Switch Account ⇦
              </button>
            </div>
          </div>
        )}

        {isMarketplace && (
          <div style={{ marginTop: '16px' }}>
            <SmartMarketplace onClose={close} embedded={true} />
          </div>
        )}

        {type === 'Event Mode' && (
          <>
            <p>This mode evaluates an unplanned life event (wedding, medical, gadget breakdown) against your financial twin.</p>
            <input className="modal-input" placeholder="Expected spend, e.g. ₹15,000" />
            <button
              className="soft-button"
              onClick={() => {
                close();
                navigate('What-If');
              }}
            >
              Simulate Event in What-If ↗
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  return (
    <span className="nav-icon" aria-hidden="true">
      {name === 'Overview'
        ? '⌂'
        : name === 'Finance Controller'
        ? '⚖'
        : name === 'Action Center'
        ? '⚡'
        : name === 'Money'
        ? '◈'
        : name === 'Transactions'
        ? '⇆'
        : name === 'Goals'
        ? '◎'
        : name === 'Financial Health'
        ? '♥'
        : name === 'Cash Flow'
        ? '📈'
        : name === 'What-If'
        ? '◇'
        : name === 'Reports'
        ? '📄'
        : name === 'Audit Trail'
        ? '📜'
        : name === 'Signals'
        ? '◌'
        : name === 'Financial Twin'
        ? '∿'
        : name === 'AI Advisor'
        ? '✦'
        : name === 'Gift Advisor'
        ? '🎁'
        : name === 'Purchase Advisor'
        ? '🛒'
        : name === 'Smart Purchases'
        ? '▣'
        : name === 'Notifications'
        ? '◌'
        : name === 'Settings'
        ? '⚙'
        : name === 'Profile'
        ? '◉'
        : name.slice(0, 1)}
    </span>
  );
}

