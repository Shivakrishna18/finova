import { useState } from 'react'
import PlasmaRing from './components/originkit/ui/plasma-ring'
import { useFinance, formatINR, calculateBudgetMetric, type IncomeRecord, type Commitment } from './finance/FinanceContext'
import AnimatedNumber from './components/AnimatedNumber'
import ScrollReveal from './components/ScrollReveal'

const forecastDays = [30, 60, 90]

export default function CashFlowIntelligence() {
  const { state: finance, addIncomeRecord, updateIncomeRecord, addCommitment, updateCommitment, deleteCommitment } = useFinance()
  const [forecastPeriod, setForecastPeriod] = useState(30)
  const [incomeModal, setIncomeModal] = useState(false)
  const [delayModal, setDelayModal] = useState(false)
  const [commitment, setCommitment] = useState<Commitment | null>(null)
  const [addCommitmentModal, setAddCommitmentModal] = useState(false)
  const [commitmentForm, setCommitmentForm] = useState({ name: 'Rent', amount: 15000, date: '2026-09-01', type: 'Recurring payment' })
  const [discretionary, setDiscretionary] = useState(0)
  const [scenario, setScenario] = useState('')
  const [incomeForm, setIncomeForm] = useState({ source: 'Freelance', amount: 10000, date: '2026-09-18', frequency: 'Monthly', status: 'EXPECTED' as IncomeRecord['status'] })
  const [delayDays, setDelayDays] = useState(10)
  const [delayingRecordId, setDelayingRecordId] = useState<string | null>(null)
  const currentCommitments = finance.commitments.reduce((sum, item) => sum + item.amount, 0)
  const goalAllocation = finance.commitments.find(item => item.type === 'Goal allocation')?.amount ?? 0
  const trueAvailable = Math.max(0, finance.balance - currentCommitments)
  const safeToSpend = Math.max(0, trueAvailable - goalAllocation - discretionary)
  const projectedBalance = trueAvailable + finance.incomeRecords.filter(item => item.status === 'EXPECTED').reduce((sum, item) => sum + item.amount, 0) - finance.monthlySpending
  const forecast = buildForecast(forecastPeriod, projectedBalance, finance.monthlySpending, currentCommitments, goalAllocation)
  const velocity = finance.monthlySpending / Math.max(1, finance.income) * 100
  const incomeTotal = finance.incomeRecords.reduce((sum, item) => sum + item.amount, 0)
  const addIncome = () => {
    if (!incomeForm.source || incomeForm.amount <= 0) return
    const item: IncomeRecord = { id: `income-${Date.now()}`, source: incomeForm.source, amount: incomeForm.amount, expectedDate: incomeForm.date, frequency: incomeForm.frequency, status: incomeForm.status }
    addIncomeRecord(item)
    setIncomeModal(false)
  }
  const handleAddCommitment = () => {
    if (!commitmentForm.name.trim() || commitmentForm.amount <= 0) return
    addCommitment({
      id: `commitment-${Date.now()}`,
      name: commitmentForm.name.trim(),
      amount: commitmentForm.amount,
      date: commitmentForm.date,
      type: commitmentForm.type,
    })
    setAddCommitmentModal(false)
    setCommitmentForm({ name: '', amount: 0, date: '2026-09-15', type: 'Recurring payment' })
  }
  const delayIncome = (id: string, newExpectedDate?: string) => {
    updateIncomeRecord(id, {
      status: 'DELAYED',
      ...(newExpectedDate ? { expectedDate: newExpectedDate } : {})
    })
    setDelayModal(false)
    setDelayingRecordId(null)
  }
  const navigate = (view: string) => window.dispatchEvent(new CustomEvent('finova-navigate', { detail: view }))
  return <div className="workspace-page cash-flow-page"><div className="page-intro"><div><span className="eyebrow">CASH FLOW / COMMAND CENTER</span><h1>Know what your money<br /><em>will do next.</em></h1><p>FINOVA looks beyond today's balance to understand the money coming in, going out, and what remains available.</p></div><span className="demo-badge">DEMO FINANCIAL STATE</span></div>      <div className="cash-snapshot">
        {[
          ['CURRENT BALANCE', finance.balance],
          ['MONTHLY INCOME', finance.income],
          ['MONTHLY EXPENSES', finance.monthlySpending],
          ['COMMITTED EXPENSES', currentCommitments],
          ['CURRENT SAVINGS', finance.income - finance.monthlySpending],
          ['SAFE TO SPEND', safeToSpend],
          ['PROJECTED MONTH-END', projectedBalance],
        ].map(([label, val], idx) => (
          <ScrollReveal key={label as string} staggerIndex={idx} staggerDelay={30}>
            <div>
              <span>
                {label as string}
                <i>DEMO</i>
              </span>
              <strong>
                <AnimatedNumber value={val as number} format="currency" />
              </strong>
              <small>Derived locally</small>
            </div>
          </ScrollReveal>
        ))}
      </div><div className="cash-command-grid"><section className="income-timeline"><div className="card-top"><div><span className="panel-kicker">INCOME TIMELINE <i className="demo-dot" /> SIMULATED</span><h2>Money coming in</h2></div><button className="soft-button" onClick={() => setIncomeModal(true)}>＋ Add income source</button></div><div className="income-total">{formatINR(incomeTotal)} <small>expected and received in demo records</small></div>{finance.incomeRecords.map(item => <div className="income-record" key={item.id}><div className={`income-status ${item.status.toLowerCase().replace(' ', '-')}`}><i />{item.status}</div><div><strong>{item.source}</strong><small>{item.frequency} · Expected {item.expectedDate}{item.actualDate ? ` · Received ${item.actualDate}` : ''}</small></div><b>{formatINR(item.amount)}</b>{item.status === 'EXPECTED' && <button onClick={() => { setDelayingRecordId(item.id); setDelayModal(true); }}>Delay</button>}</div>)}</section><section className="cash-core-panel"><div className="cash-core-scene"><div className="cash-orbit orbit-a" /><div className="cash-orbit orbit-b" /><div className="cash-core"><PlasmaRing background="rgba(0,0,0,0)" colors={['#73eaff', '#6677ff', '#b55dff']} density={42} speed={25} centerOpacity={8} scale={30} style={{ width: '100%', height: '100%' }} /><span>CASH<br /><small>FLOW CORE</small></span></div><span className="core-signal signal-income">INCOME</span><span className="core-signal signal-commitments">COMMITMENTS</span><span className="core-signal signal-goals">GOALS</span><span className="core-signal signal-safe">SAFE-TO-SPEND</span></div><div className="cash-core-label"><span>FINOVA FINANCIAL RADAR</span><strong>One state. Many signals.</strong></div></section></div><section className="forecast-panel"><div className="card-top"><div><span className="panel-kicker">CASH-FLOW FORECAST <i className="demo-dot" /> SIMULATION</span><h2>Projected balance path</h2></div><div className="forecast-tabs">{forecastDays.map(day => <button className={forecastPeriod === day ? 'active' : ''} onClick={() => setForecastPeriod(day)} key={day}>{day} DAYS</button>)}</div></div><div className="forecast-chart"><div className="forecast-axis"><span>₹{Math.round(forecast[0] / 1000)}k</span><span>₹{Math.round(forecast[Math.floor(forecast.length / 2)] / 1000)}k</span><span>₹{Math.round(forecast[forecast.length - 1] / 1000)}k</span></div><svg viewBox="0 0 700 220" preserveAspectRatio="none" role="img" aria-label={`Demo ${forecastPeriod} day cash flow forecast`}><polyline points={forecast.map((value, index) => `${index * (700 / (forecast.length - 1))},${210 - Math.min(180, Math.max(10, value / Math.max(projectedBalance, finance.balance) * 180))}`).join(' ')} /></svg></div><div className="forecast-legend"><span><i /> Income: {formatINR(finance.incomeRecords.filter(item => item.status !== 'DELAYED').reduce((sum, item) => sum + item.amount, 0))}</span><span><i /> Commitments: {formatINR(currentCommitments)}</span><span><i /> Goal allocation: {formatINR(goalAllocation)}</span></div></section><div className="commitment-grid"><section className="commitments-panel"><div className="card-top"><div><span className="panel-kicker">UPCOMING MONEY</span><h2>Committed money</h2></div><button className="soft-button" onClick={() => setAddCommitmentModal(true)}>＋ Add commitment</button></div><p className="panel-explanation">Money that appears available but is already needed for upcoming commitments.</p>{finance.commitments.map(item => <button className="commitment-row" key={item.id} onClick={() => setCommitment(item)}><span className="commitment-dot" /><div><strong>{item.name}</strong><small>{item.type} · {item.date}</small></div><b>{formatINR(item.amount)}</b><span>↗</span></button>)}<div className="true-available"><span>ACCOUNT BALANCE</span><strong>{formatINR(finance.balance)}</strong><span>TRUE AVAILABLE</span><strong>{formatINR(trueAvailable)}</strong></div></section><section className="safe-flow-panel"><span className="panel-kicker">SAFE-TO-SPEND / DEMO ENGINE</span><h2>{formatINR(safeToSpend)}</h2><p>Current available funds minus commitments, goal allocation and discretionary adjustment.</p><div className="safe-formula"><span>Balance <b>{formatINR(finance.balance)}</b></span><span>Committed <b>− {formatINR(currentCommitments)}</b></span><span>Goal allocation <b>− {formatINR(goalAllocation)}</b></span><span>Discretionary <b>− {formatINR(discretionary)}</b></span></div><label>Adjust discretionary spending<output>{formatINR(discretionary)}</output><input aria-label="Adjust discretionary spending" type="range" min="0" max="15000" step="500" value={discretionary} onChange={event => setDiscretionary(Number(event.target.value))} /></label><strong className={safeToSpend > 10000 ? 'safe-state' : safeToSpend > 4000 ? 'caution-state' : 'avoid-state'}>{safeToSpend > 10000 ? 'SAFE' : safeToSpend > 4000 ? 'CONSIDER' : 'CAUTION'}</strong></section></div><div className="cash-lower-grid"><BudgetPlanner /><section className="velocity-panel"><span className="panel-kicker">SPENDING VELOCITY / SIMULATED</span><h2>How quickly capacity is moving</h2><div className="velocity-meter"><i style={{ width: `${Math.min(100, velocity)}%` }} /></div><div className="velocity-values"><span>Current pace <b>{Math.round(velocity)}%</b></span><span>Normal pace <b>45%</b></span><span>Projected month-end <b>{formatINR(finance.monthlySpending + discretionary)}</b></span></div><strong className={velocity < 50 ? 'safe-state' : 'caution-state'}>{velocity < 50 ? 'BELOW NORMAL' : 'NORMAL'}</strong><div className="runway"><span>FINANCIAL RUNWAY / DEMO</span><b>{Math.max(1, Math.floor(trueAvailable / Math.max(1, finance.monthlySpending / 30)))} days</b><small>If no new income arrives, illustrative available funds support current commitments at this pace.</small></div></section></div><section className="cash-signals"><div className="card-top"><div><span className="panel-kicker">FINOVA THINKING / SIMULATED AI EXPLANATION</span><h2>The state, explained simply.</h2></div></div><p>Your account balance is {formatINR(finance.balance)}, but {formatINR(currentCommitments)} is already committed to upcoming expenses. Your true available balance is therefore {formatINR(trueAvailable)}.</p><div className="cash-signal-actions"><button onClick={() => setScenario('Income decrease 10%')}>What if income decreases 10%?</button><button onClick={() => setScenario('Expenses increase 15%')}>What if expenses increase 15%?</button><button onClick={() => setScenario('₹20,000 emergency expense')}>What if an emergency expense happens?</button><button onClick={() => navigate('What-If')}>Explore existing What-If ↗</button></div>{scenario && <div className="scenario-feedback">{scenario} · This would be evaluated through the existing demo scenario system.</div>}</section>{commitment && <CommitmentModal item={commitment} onUpdate={updateCommitment} onDelete={deleteCommitment} close={() => setCommitment(null)} />}{addCommitmentModal && <AddCommitmentModal form={commitmentForm} setForm={setCommitmentForm} submit={handleAddCommitment} close={() => setAddCommitmentModal(false)} />}{incomeModal && <IncomeModal form={incomeForm} setForm={setIncomeForm} submit={addIncome} close={() => setIncomeModal(false)} />}{delayModal && <DelayModal recordId={delayingRecordId} records={finance.incomeRecords} days={delayDays} setDays={setDelayDays} confirm={delayIncome} close={() => { setDelayModal(false); setDelayingRecordId(null); }} />}</div>
}

function buildForecast(days: number, start: number, monthlyExpenses: number, commitments: number, goals: number) { const points = Math.max(3, Math.round(days / 15)); return Array.from({ length: points }, (_, index) => Math.max(0, start - index * ((monthlyExpenses + commitments + goals) / 4))) }
function BudgetPlanner() {
  const { state: finance, addBudget, updateBudget, deleteBudget } = useFinance()
  const [addModal, setAddModal] = useState(false)
  const [manageCategory, setManageCategory] = useState<string | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatAmount, setNewCatAmount] = useState(5000)

  const categories = Object.keys(finance.budgets)

  const handleAddBudget = () => {
    if (!newCatName.trim() || newCatAmount < 0) return
    addBudget(newCatName.trim(), newCatAmount)
    setNewCatName('')
    setNewCatAmount(5000)
    setAddModal(false)
  }

  return (
    <section className="budget-planner">
      <div className="card-top">
        <div>
          <span className="panel-kicker">MONTHLY BUDGET INTELLIGENCE</span>
          <h2>Limits with context</h2>
        </div>
        <button className="soft-button" onClick={() => setAddModal(true)}>＋ Add category</button>
      </div>
      {categories.map(category => {
        const budget = finance.budgets[category]
        const metric = calculateBudgetMetric(category, budget, finance.transactions)
        return (
          <div className="budget-row" key={category}>
            <span
              style={{ cursor: 'pointer' }}
              title="Click to manage category limit"
              onClick={() => setManageCategory(category)}
            >
              {category}
            </span>
            <input
              aria-label={`${category} budget`}
              type="number"
              value={budget}
              onChange={event => updateBudget(category, Number(event.target.value))}
            />
            <b>{formatINR(metric.actual)}</b>
            <strong className={metric.status === 'OVER BUDGET' ? 'over' : metric.status === 'WATCH' ? 'watch' : ''}>
              {metric.status}
            </strong>
            <i><b style={{ width: `${Math.min(100, metric.utilization)}%` }} /></i>
          </div>
        )
      })}
      {addModal && (
        <div className="modal-backdrop" onClick={() => setAddModal(false)}>
          <section className="modal cash-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAddModal(false)} aria-label="Close add budget modal">×</button>
            <span className="panel-kicker">ADD BUDGET / MONTHLY LIMIT</span>
            <h2>Add budget category</h2>
            <label>Category name
              <input
                placeholder="e.g. Health, Groceries, Fitness"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
              />
            </label>
            <label>Monthly limit
              <input
                type="number"
                placeholder="e.g. 5000"
                value={newCatAmount || ''}
                onChange={e => setNewCatAmount(Number(e.target.value))}
              />
            </label>
            <button className="soft-button" style={{ marginTop: '16px' }} onClick={handleAddBudget}>Add budget category ↗</button>
          </section>
        </div>
      )}
      {manageCategory && (
        <ManageBudgetModal
          category={manageCategory}
          budget={finance.budgets[manageCategory] || 0}
          onUpdate={updateBudget}
          onDelete={deleteBudget}
          close={() => setManageCategory(null)}
        />
      )}
    </section>
  )
}

function ManageBudgetModal({
  category,
  budget,
  onUpdate,
  onDelete,
  close,
}: {
  category: string
  budget: number
  onUpdate: (category: string, amount: number, newCategoryName?: string) => void
  onDelete: (category: string) => void
  close: () => void
}) {
  const { state: finance } = useFinance()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(category)
  const [amount, setAmount] = useState(budget)

  const metric = calculateBudgetMetric(category, budget, finance.transactions)

  const handleSave = () => {
    if (!name.trim() || amount < 0) return
    onUpdate(category, amount, name.trim())
    close()
  }

  const handleDelete = () => {
    onDelete(category)
    close()
  }

  return (
    <div className="modal-backdrop" onClick={close}>
      <section className="modal cash-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="Close category modal">×</button>
        <span className="panel-kicker">BUDGET CATEGORY / CONTEXT</span>
        <h2>{isEditing ? 'Edit category' : category}</h2>
        {isEditing ? (
          <>
            <label>Category name
              <input value={name} onChange={e => setName(e.target.value)} />
            </label>
            <label>Monthly limit
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="soft-button" type="button" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="soft-button" type="button" onClick={handleSave}>Save changes ↗</button>
            </div>
          </>
        ) : (
          <>
            <p>Limit: {formatINR(budget)} · Actual spent: {formatINR(metric.actual)} ({Math.round(metric.utilization)}% utilized)</p>
            <p>{metric.isOverBudget ? `Overspent by ${formatINR(metric.actual - metric.budget)}.` : `Remaining capacity: ${formatINR(metric.remaining)}.`}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
              <button className="soft-button" type="button" onClick={() => setIsEditing(true)}>Edit category ↗</button>
              <button className="soft-button" type="button" style={{ borderColor: 'rgba(153, 27, 27, 0.3)', color: '#991b1b', background: 'rgba(153, 27, 27, 0.08)' }} onClick={handleDelete}>Delete category ✕</button>
              <button className="soft-button" type="button" onClick={close} style={{ marginLeft: 'auto' }}>Close</button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
function IncomeModal({ form, setForm, submit, close }: { form: { source: string; amount: number; date: string; frequency: string; status: IncomeRecord['status'] }; setForm: (value: { source: string; amount: number; date: string; frequency: string; status: IncomeRecord['status'] }) => void; submit: () => void; close: () => void }) { return <div className="modal-backdrop" onClick={close}><section className="modal cash-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={close} aria-label="Close income modal">×</button><span className="panel-kicker">ADD INCOME / DEMO DATA</span><h2>Add income source.</h2><label>Source name<input value={form.source} onChange={event => setForm({ ...form, source: event.target.value })} /></label><label>Amount<input type="number" value={form.amount} onChange={event => setForm({ ...form, amount: Number(event.target.value) })} /></label><label>Expected date<input type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label><label>Frequency<select value={form.frequency} onChange={event => setForm({ ...form, frequency: event.target.value })}><option>Monthly</option><option>Variable</option><option>One-time</option></select></label><label>Status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value as IncomeRecord['status'] })}><option>EXPECTED</option><option>RECEIVED</option><option>DELAYED</option><option>NOT RECEIVED</option></select></label><button className="soft-button" onClick={submit}>Add income source ↗</button></section></div> }
function DelayModal({ recordId, records, days, setDays, confirm, close }: { recordId: string | null; records: IncomeRecord[]; days: number; setDays: (value: number) => void; confirm: (id: string, newDate?: string) => void; close: () => void }) {
  const { state: finance } = useFinance();
  const income = (recordId ? records.find(item => item.id === recordId) : null) || records.find(item => item.status === 'EXPECTED');
  const [newDate, setNewDate] = useState('2026-09-25');
  return <div className="modal-backdrop" onClick={close}><section className="modal cash-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={close} aria-label="Close delay mode">×</button><span className="panel-kicker">INCOME DELAY MODE / SIMULATED FINANCIAL ANALYSIS</span><h2>Income delayed?</h2><p>Delaying {income ? `"${income.source}"` : 'this expected income'} reduces short-term safe-to-spend and may change the goal trajectory.</p><label>New expected date<input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></label><label>Delay days<output>{days}</output><input type="range" min="1" max="30" value={days} onChange={event => setDays(Number(event.target.value))} /></label><div className="delay-impact"><span>BEFORE DELAY</span><strong>{formatINR(finance.safeToSpend)}</strong><span>AFTER DELAY</span><strong>{formatINR(Math.max(0, finance.safeToSpend - 3000))}</strong></div><button className="soft-button" onClick={() => income && confirm(income.id, newDate)}>Apply simulated delay ↗</button></section></div>
}
function CommitmentModal({ item, onUpdate, onDelete, close }: { item: Commitment; onUpdate: (id: string, updated: Partial<Commitment>) => void; onDelete: (id: string) => void; close: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: item.name,
    amount: item.amount,
    date: item.date,
    type: item.type,
  });

  const handleSave = () => {
    if (!form.name.trim() || form.amount <= 0) return;
    onUpdate(item.id, {
      name: form.name.trim(),
      amount: form.amount,
      date: form.date,
      type: form.type,
    });
    close();
  };

  const handleDelete = () => {
    onDelete(item.id);
    close();
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <section className="modal cash-modal" onClick={event => event.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="Close commitment modal">×</button>
        <span className="panel-kicker">UPCOMING MONEY / DEMO DATA</span>
        <h2>{isEditing ? 'Edit commitment' : item.name}</h2>
        {isEditing ? (
          <>
            <label>Commitment name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
            <label>Amount<input type="number" value={form.amount} onChange={event => setForm({ ...form, amount: Number(event.target.value) })} /></label>
            <label>Due date<input type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label>
            <label>Type
              <select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}>
                <option value="Recurring payment">Recurring payment</option>
                <option value="Bill">Bill</option>
                <option value="Known expense">Known expense</option>
                <option value="Goal allocation">Goal allocation</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="soft-button" type="button" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="soft-button" type="button" onClick={handleSave}>Save changes ↗</button>
            </div>
          </>
        ) : (
          <>
            <p>{formatINR(item.amount)} · {item.type} · due {item.date}</p>
            <p>Committed money is reserved in the illustrative cash-flow model so the true available balance stays visible.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
              <button className="soft-button" type="button" onClick={() => setIsEditing(true)}>Edit commitment ↗</button>
              <button className="soft-button" type="button" style={{ borderColor: 'rgba(153, 27, 27, 0.3)', color: '#991b1b', background: 'rgba(153, 27, 27, 0.08)' }} onClick={handleDelete}>Delete commitment ✕</button>
              <button className="soft-button" type="button" onClick={close} style={{ marginLeft: 'auto' }}>Close</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function AddCommitmentModal({ form, setForm, submit, close }: { form: { name: string; amount: number; date: string; type: string }; setForm: (value: { name: string; amount: number; date: string; type: string }) => void; submit: () => void; close: () => void }) {
  return (
    <div className="modal-backdrop" onClick={close}>
      <section className="modal cash-modal" onClick={event => event.stopPropagation()}>
        <button className="modal-close" onClick={close} aria-label="Close add commitment modal">×</button>
        <span className="panel-kicker">ADD COMMITMENT / FUTURE OBLIGATION</span>
        <h2>Add upcoming commitment</h2>
        <label>Commitment name<input placeholder="e.g. Rent, College Fee, Insurance" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label>Amount<input type="number" placeholder="e.g. 5000" value={form.amount || ''} onChange={event => setForm({ ...form, amount: Number(event.target.value) })} /></label>
        <label>Due date<input type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label>
        <label>Type
          <select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}>
            <option value="Recurring payment">Recurring payment</option>
            <option value="Bill">Bill</option>
            <option value="Known expense">Known expense</option>
            <option value="Goal allocation">Goal allocation</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <button className="soft-button" style={{ marginTop: '16px' }} onClick={submit}>Add commitment ↗</button>
      </section>
    </div>
  );
}

