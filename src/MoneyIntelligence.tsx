import { useMemo, useState } from 'react'
import PlasmaRing from './components/originkit/ui/plasma-ring'
import { useFinance, formatINR, type Transaction as ContextTransaction } from './finance/FinanceContext'
import SmartTransactionCaptureModal from './scanner/SmartTransactionCaptureModal'

type Transaction = { id: string; name: string; category: string; amount: number; date: string; type: 'Income' | 'Expense' | 'Transfer'; status: string; impact: string }
type Focus = 'overview' | 'transactions'
const categories = ['All', 'Food', 'Transport', 'Shopping', 'Education', 'Entertainment', 'Bills', 'Health', 'Travel', 'Salary', 'Other']
const recurring = [{ merchant: 'Internet Bill', amount: 899, frequency: 'Monthly', next: 'In 3 days' }, { merchant: 'Cloud Storage', amount: 149, frequency: 'Monthly', next: 'In 8 days' }, { merchant: 'Insurance', amount: 2800, frequency: 'Monthly', next: 'In 17 days' }, { merchant: 'Education', amount: 4500, frequency: 'Termly', next: 'Next month' }]

export default function MoneyIntelligence({ focus }: { focus: Focus }) {
  const { state: finance, updateTransaction: updateFinanceTransaction, deleteTransaction: deleteFinanceTransaction } = useFinance()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [range, setRange] = useState('30D')
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [modal, setModal] = useState<'add' | 'edit' | 'recurring' | null>(null)
  const [discretionary, setDiscretionary] = useState(0)
  const [editForm, setEditForm] = useState({ id: '', type: 'Expense', name: '', amount: 0, category: 'Food', date: '2026-08-27', notes: '' })
  
  const transactions: Transaction[] = useMemo(() => {
    return finance.transactions.map((item: ContextTransaction, index: number) => ({
      id: item.id || `demo-${index}`,
      name: item.name,
      category: item.category === 'Food & Dining' ? 'Food' : item.category,
      amount: item.amount,
      date: item.date,
      type: item.category === 'Income' ? 'Income' : 'Expense',
      status: 'Cleared',
      impact: item.category === 'Income' ? 'Positive' : item.amount > finance.safeToSpend ? 'Potential overspend' : 'Normal spending'
    }))
  }, [finance.transactions, finance.safeToSpend])

  const expenseTotal = finance.monthlySpending
  const incomeTotal = finance.income
  const safeToSpend = Math.max(0, finance.safeToSpend - discretionary)
  const health = Math.max(0, finance.financialHealth - Math.min(8, Math.floor(discretionary / 1500)))
  const filtered = useMemo(() => transactions.filter(item => item.name.toLowerCase().includes(search.toLowerCase()) && (typeFilter === 'All' || item.type === typeFilter || (typeFilter === 'Expenses' && item.type === 'Expense')) && (categoryFilter === 'All' || item.category === categoryFilter)).sort((a, b) => sort === 'Highest amount' ? b.amount - a.amount : sort === 'Lowest amount' ? a.amount - b.amount : sort === 'Oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)), [transactions, search, typeFilter, categoryFilter, sort])
  
  const handleOpenEdit = (item: Transaction) => {
    setEditForm({
      id: item.id,
      type: item.type,
      name: item.name,
      amount: item.amount,
      category: item.category,
      date: item.date,
      notes: ''
    })
    setModal('edit')
  }

  const handleUpdateTransaction = () => {
    if (!editForm.id || !editForm.name.trim() || editForm.amount <= 0 || Number.isNaN(Number(editForm.amount))) return
    updateFinanceTransaction(editForm.id, {
      name: editForm.name.trim(),
      category: editForm.type === 'Income' ? 'Income' : editForm.category,
      amount: Number(editForm.amount),
      date: editForm.date
    })
    setSelected(null)
    setModal(null)
  }
  
  const removeTransaction = (id: string) => {
    deleteFinanceTransaction(id)
    if (selected?.id === id) {
      setSelected(null)
    }
  }

  return <div className="workspace-page money-page"><div className="page-intro"><div><span className="eyebrow">{focus === 'overview' ? 'MONEY / INTELLIGENCE LAYER' : 'TRANSACTIONS / SIGNAL CENTER'}</span><h1>{focus === 'overview' ? <>Your Money.<br /><em>Every signal matters.</em></> : <>Transaction<br /><em>signal center.</em></>}</h1><p>{focus === 'overview' ? 'Every transaction becomes a signal. FINOVA turns movement into context, using clearly labeled demo financial data.' : 'Search, filter, and inspect simulated transactions in one focused workspace.'}</p></div><span className="demo-badge">DEMO FINANCIAL DATA</span></div><MoneySnapshot expenseTotal={expenseTotal} incomeTotal={incomeTotal} safeToSpend={safeToSpend} health={health} /><div className="money-toolbar"><div className="money-tabs"><button className={focus === 'overview' ? 'active' : ''} onClick={() => dispatchNav('Money')}>Money overview</button><button className={focus === 'transactions' ? 'active' : ''} onClick={() => dispatchNav('Transactions')}>Transactions</button></div><button className="add-transaction" onClick={() => setModal('add')}>＋ Add Transaction</button></div>{focus === 'overview' ? <><div className="money-main-grid"><SpendingAnalytics range={range} setRange={setRange} transactions={transactions} /><SafeSpend value={safeToSpend} discretionary={discretionary} setDiscretionary={setDiscretionary} /></div><div className="money-lower-grid"><CategoryIntelligence transactions={transactions} filter={categoryFilter} setFilter={setCategoryFilter} /><RecurringSignals open={() => setModal('recurring')} /></div><Signals /></> : <><TransactionControls search={search} setSearch={setSearch} typeFilter={typeFilter} setTypeFilter={setTypeFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} sort={sort} setSort={setSort} /><TransactionTimeline transactions={filtered} select={setSelected} remove={removeTransaction} /></>}{selected && <TransactionDetail item={selected} close={() => setSelected(null)} onEdit={handleOpenEdit} onDelete={removeTransaction} />}{modal === 'add' && <SmartTransactionCaptureModal close={() => setModal(null)} onSuccessNavigate={dispatchNav} />}{modal === 'edit' && <EditTransaction form={editForm} setForm={setEditForm} submit={handleUpdateTransaction} close={() => setModal(null)} />}{modal === 'recurring' && <SimpleModal title="Recurring signal management" text="Recurring transaction management will be connected to live user data in a later integration stage." close={() => setModal(null)} />}</div>
}

function dispatchNav(view: string) { window.dispatchEvent(new CustomEvent('finova-navigate', { detail: view })) }
function MoneySnapshot({ expenseTotal, incomeTotal, safeToSpend, health }: { expenseTotal: number; incomeTotal: number; safeToSpend: number; health: number }) { const { state: finance } = useFinance(); const items = [['CURRENT BALANCE', formatINR(finance.balance)], ['MONTHLY INCOME', formatINR(incomeTotal)], ['MONTHLY SPENDING', formatINR(expenseTotal)], ['SAFE-TO-SPEND', formatINR(safeToSpend)], ['FINANCIAL HEALTH', `${health} / 100`]]; return <div className="money-snapshot">{items.map(([label, value]) => <div key={label}><span>{label}<i>DEMO</i></span><strong>{value}</strong><small>Illustrative signal</small></div>)}</div> }
function SpendingAnalytics({ range, setRange, transactions }: { range: string; setRange: (value: string) => void; transactions: Transaction[] }) { const bars = range === '7D' ? [30, 46, 34, 58, 43, 62, 48] : range === '90D' ? [38, 52, 46, 68, 55, 61, 50, 72, 59] : [48, 61, 52, 68, 57, 73]; return <section className="spending-analytics"><div className="card-top"><div><span className="panel-kicker">SPENDING ANALYTICS <i className="demo-dot" /> DEMO DATA</span><h2>Movement over time</h2></div><div className="range-tabs">{['7D', '30D', '90D'].map(item => <button className={range === item ? 'active' : ''} onClick={() => setRange(item)} key={item}>{item}</button>)}</div></div><div className="analytics-chart">{bars.map((height, index) => <div className="analytics-bar" key={index}><i style={{ height: `${height}%` }} title={`Demo spending signal ${index + 1}`} /><span>{index + 1}</span></div>)}</div><div className="analytics-legend"><span><i /> Spending</span><span><i /> Income</span><small>{transactions.length} demo signals observed</small></div></section> }
function SafeSpend({ value, discretionary, setDiscretionary }: { value: number; discretionary: number; setDiscretionary: (value: number) => void }) { return <section className="safe-spend-engine"><div className="safe-core"><PlasmaRing background="rgba(0,0,0,0)" colors={['#73eaff', '#6677ff', '#b55dff']} density={34} speed={25} centerOpacity={8} scale={30} style={{ width: '100%', height: '100%' }} /><span>SAFE<br /><small>DEMO ENGINE</small></span></div><span className="panel-kicker">SAFE-TO-SPEND / FINOVA SIMULATION</span><h2>{formatINR(value)}</h2><p>Available after demo commitments and current spending.</p><label>Adjust discretionary spending<output>+ {formatINR(discretionary)}</output><input aria-label="Adjust discretionary spending" type="range" min="0" max="10000" step="500" value={discretionary} onChange={event => setDiscretionary(Number(event.target.value))} /></label><strong className={value > 10000 ? 'safe-state' : value > 4000 ? 'caution-state' : 'avoid-state'}>{value > 10000 ? 'SAFE' : value > 4000 ? 'CONSIDER' : 'AVOID'}</strong></section> }
function CategoryIntelligence({ transactions, filter, setFilter }: { transactions: Transaction[]; filter: string; setFilter: (value: string) => void }) {
  const { state: finance } = useFinance()
  const budgetKeys = Object.keys(finance.budgets)
  const names = budgetKeys.length > 0 ? budgetKeys : ['Food', 'Transport', 'Shopping', 'Education', 'Bills', 'Travel']
  const total = transactions.filter(item => item.type === 'Expense').reduce((sum, item) => sum + item.amount, 0) || 1
  return (
    <section className="category-intelligence">
      <div className="card-top">
        <div>
          <span className="panel-kicker">CATEGORY INTELLIGENCE</span>
          <h2>Where signals collect</h2>
        </div>
      </div>
      <div className="category-list">
        {names.map(name => {
          const normName = name.trim().toLowerCase()
          const amount = transactions
            .filter(item => {
              if (item.type !== 'Expense') return false
              const itemCat = item.category.trim().toLowerCase()
              return itemCat === normName || itemCat.includes(normName) || normName.includes(itemCat)
            })
            .reduce((sum, item) => sum + item.amount, 0)
          const budget = finance.budgets[name]
          const budgetLabel = budget !== undefined ? (amount > budget ? ` · Over limit (${formatINR(budget)})` : ` · ${formatINR(budget - amount)} left`) : ''
          return (
            <button
              className={filter === name ? 'active' : ''}
              key={name}
              onClick={() => setFilter(filter === name ? 'All' : name)}
            >
              <span>{name}</span>
              <strong>{formatINR(amount)}</strong>
              <small>{Math.round((amount / total) * 100)}% of demo spending{budgetLabel}</small>
              <i>
                <b style={{ width: `${Math.min(100, budget ? (amount / budget) * 100 : (amount / total) * 100)}%` }} />
              </i>
            </button>
          )
        })}
      </div>
    </section>
  )
}
function RecurringSignals({ open }: { open: () => void }) { return <section className="recurring-signals"><div className="card-top"><div><span className="panel-kicker">RECURRING SIGNALS <i className="demo-dot" /> SIMULATED</span><h2>Expected patterns</h2></div></div>{recurring.map(item => <div className="recurring-row" key={item.merchant}><div><strong>{item.merchant}</strong><small>{item.frequency} · next {item.next}</small></div><b>{formatINR(item.amount)}</b><button onClick={open}>Manage</button></div>)}</section> }
function Signals() { return <section className="money-signals"><div className="card-top"><div><span className="panel-kicker">FINOVA SIGNALS</span><h2>What the pattern suggests</h2></div></div><div className="signal-grid"><button onClick={() => dispatchNav('Smart Purchases')}><span>SHOPPING PATTERN</span><p>Shopping is higher than its usual demo pattern. Compare the next purchase before committing.</p><b>Open Smart Purchases ↗</b></button><button onClick={() => dispatchNav('Financial Twin')}><span>FINANCIAL TWIN</span><p>Your demo signals are being organized into a clearer view of cash flow and goals.</p><b>View Financial Twin ↗</b></button><button onClick={() => dispatchNav('AI Advisor')}><span>ASK FINOVA</span><p>Ask how current spending may affect the Travel Goal in the illustrative model.</p><b>Open AI Advisor ↗</b></button></div></section> }
function TransactionControls({ search, setSearch, typeFilter, setTypeFilter, categoryFilter, setCategoryFilter, sort, setSort }: { search: string; setSearch: (value: string) => void; typeFilter: string; setTypeFilter: (value: string) => void; categoryFilter: string; setCategoryFilter: (value: string) => void; sort: string; setSort: (value: string) => void }) { return <div className="transaction-controls"><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" /><select value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option>All</option><option>Income</option><option>Expenses</option><option>Transfer</option></select><select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select><select value={sort} onChange={event => setSort(event.target.value)}><option>Newest</option><option>Oldest</option><option>Highest amount</option><option>Lowest amount</option></select></div> }
function TransactionTimeline({ transactions, select, remove }: { transactions: Transaction[]; select: (item: Transaction) => void; remove: (id: string) => void }) { return <section className="transaction-timeline"><div className="timeline-header"><span>TRANSACTION TIMELINE</span><small>{transactions.length} demo results</small></div>{transactions.map(item => <article key={item.id} onClick={() => select(item)}><span className="timeline-date">{item.date}</span><div className="timeline-dot" /><div className="timeline-detail"><strong>{item.name}</strong><small>{item.category} · {item.type} · {item.status}</small></div><b className={item.type === 'Income' ? 'income-text' : ''}>{item.type === 'Income' ? '+' : '−'} {formatINR(item.amount)}</b><button aria-label={`Remove ${item.name}`} onClick={event => { event.stopPropagation(); remove(item.id) }}>×</button></article>)}</section> }
function TransactionDetail({ item, close, onEdit, onDelete }: { item: Transaction; close: () => void; onEdit: (item: Transaction) => void; onDelete: (id: string) => void }) { return <aside className="transaction-detail"><button onClick={close} aria-label="Close transaction detail">×</button><span className="panel-kicker">SIMULATED AI INSIGHT</span><h2>{item.name}</h2><strong className={item.type === 'Income' ? 'income-text' : ''}>{item.type === 'Income' ? '+' : '−'} {formatINR(item.amount)}</strong><div><span>Category</span><b>{item.category}</b></div><div><span>Date</span><b>{item.date}</b></div><div><span>Type</span><b>{item.type}</b></div><div className="signal-result"><span>FINOVA SIGNAL</span><b>{item.impact}</b><p>FINOVA noticed this because it is part of the current illustrative transaction pattern.</p></div><div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}><button className="soft-button" style={{ flex: 1 }} onClick={() => onEdit(item)}>Edit Signal ✎</button><button style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(153, 27, 27, 0.3)', background: 'rgba(153, 27, 27, 0.08)', color: '#991b1b', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }} onClick={() => onDelete(item.id)}>Delete</button></div></aside> }
function EditTransaction({ form, setForm, submit, close }: { form: { id: string; type: string; name: string; amount: number; category: string; date: string; notes: string }; setForm: (form: { id: string; type: string; name: string; amount: number; category: string; date: string; notes: string }) => void; submit: () => void; close: () => void }) { return <div className="modal-backdrop" onClick={close}><section className="modal transaction-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={close} aria-label="Close edit transaction">×</button><span className="panel-kicker">EDIT TRANSACTION / FINANCIAL OS</span><h2>Update signal details.</h2><label>Transaction type<select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><option>Expense</option><option>Income</option><option>Transfer</option></select></label><label>Merchant<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Merchant or source" /></label><label>Amount<input type="number" min="0" value={form.amount || ''} onChange={event => setForm({ ...form, amount: Number(event.target.value) })} placeholder="0" /></label><label>Category<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{categories.slice(1).map(item => <option key={item}>{item}</option>)}</select></label><label>Date<input type="date" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label><div className="modal-actions"><button onClick={close}>Cancel</button><button className="soft-button" onClick={submit}>Save Changes ↗</button></div></section></div> }
function SimpleModal({ title, text, close }: { title: string; text: string; close: () => void }) { return <div className="modal-backdrop" onClick={close}><section className="modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={close} aria-label="Close modal">×</button><span className="panel-kicker">FINOVA / DEMO</span><h2>{title}</h2><p>{text}</p><button className="soft-button" onClick={close}>Close ↗</button></section></div> }

