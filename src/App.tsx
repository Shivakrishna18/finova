import { useEffect, useRef, useState } from 'react'
import LiquidCarveButton from './components/originkit/ui/liquid-carve-button'
import PlasmaRing from './components/originkit/ui/plasma-ring'
import InteractiveHeroCanvas from './components/originkit/ui/wave-arcs'
import ShaderGroupSwitcher from './components/originkit/ui/reflect-shader'
import LineMaskSplit from './components/originkit/ui/scroll-text-reveal'
import MagicCursor from './components/originkit/ui/spin-cursor'
import PulsatingBorder from './components/originkit/ui/pulsating-border-custom-style'
import AppExperience from './AppExperience'
import { FinanceProvider } from './finance/FinanceContext'
import { AuthProvider } from './auth/AuthContext'
import './App.css'

const stages = [
  ['OBSERVE', 'Income / Transactions / Bills / User inputs'],
  ['UNDERSTAND', 'Behavior / Patterns / Goals / Cash flow'],
  ['PREDICT', 'Forecast / Timelines / What-if simulations'],
  ['PLAN', 'Budget / Saving plan / Recovery plan'],
  ['PROTECT', 'Warnings / Goal impact / Emergency mode'],
  ['OPTIMIZE', 'Surplus / Recommendations / Better choices'],
]
const brainNodes = ['Income', 'Transactions', 'Bills', 'Goals', 'Spending', 'Purchases', 'Savings', 'Events', 'Location', 'Behavior']
const giftOptions = [['BEST OVERALL', 'Gaming accessory', '₹2,499', 'Goal impact: Minimal'], ['MOST MEANINGFUL', 'Personalized desk item', '₹1,999', 'Goal impact: None'], ['PREMIUM', 'Gaming bundle', '₹3,499', 'Goal impact: Moderate']]

function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [activeStage, setActiveStage] = useState(2)
  const [spend, setSpend] = useState(20000)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isTouch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onCtaClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const button = target.closest('[role="button"]')
      const label = button?.textContent ?? ''
      if (
        label.includes('Start Your Financial Journey') ||
        label.includes('Start With FINOVA') ||
        label.includes('Get Started') ||
        label.includes('Launch OS')
      ) {
        onLaunch()
      }
    }
    const onMove = (event: PointerEvent) => {
      if (!shellRef.current) return
      shellRef.current.style.setProperty('--pointer-x', `${(event.clientX / window.innerWidth - 0.5) * 18}px`)
      shellRef.current.style.setProperty('--pointer-y', `${(event.clientY / window.innerHeight - 0.5) * 12}px`)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('click', onCtaClick)
    return () => { window.removeEventListener('pointermove', onMove); document.removeEventListener('click', onCtaClick) }
  }, [onLaunch])
  const go = (id: string) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }

  return <main ref={shellRef} className="site-shell">
    {!isTouch && <MagicCursor fillColor="#C49A5A" cursorSize={27} enableGlow glowColor="rgba(196, 154, 90, 0.4)" glowIntensity={20} label={false} />}
    <div className="grain" aria-hidden="true" />
    <header className="nav-wrap"><a className="wordmark" href="#overview" onClick={(e) => { e.preventDefault(); go('overview') }}>FINOVA<span className="wordmark-dot">.</span></a><button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '×' : '☰'}</button><nav className={menuOpen ? 'nav-links open' : 'nav-links'}><a href="#overview" onClick={(e) => { e.preventDefault(); go('overview') }}>Overview</a><a href="#how-it-works" onClick={(e) => { e.preventDefault(); go('how-it-works') }}>How it Works</a><a href="#intelligence" onClick={(e) => { e.preventDefault(); go('intelligence') }}>Intelligence</a><a href="#features" onClick={(e) => { e.preventDefault(); go('features') }}>Features</a><a href="#security" onClick={(e) => { e.preventDefault(); go('security') }}>Security</a></nav><div className="nav-actions"><button onClick={onLaunch}>Launch OS</button><button className="nav-cta" onClick={onLaunch}>Get Started <span>↗</span></button></div></header>

    <section id="overview" className="hero-section"><div className="hero-drafting-curves" aria-hidden="true"><svg viewBox="0 0 1400 900" fill="none" xmlns="http://www.w3.org/2000/svg" className="drafting-svg"><ellipse cx="700" cy="450" rx="660" ry="380" stroke="rgba(196, 154, 90, 0.07)" strokeWidth="0.8" /><ellipse cx="740" cy="420" rx="510" ry="300" stroke="rgba(196, 154, 90, 0.05)" strokeWidth="0.6" strokeDasharray="4 8" /><path d="M 120 780 C 450 780 920 620 1220 220" stroke="rgba(210, 180, 119, 0.08)" strokeWidth="0.8" /><path d="M 1320 680 C 980 760 550 750 180 820" stroke="rgba(196, 154, 90, 0.05)" strokeWidth="0.6" strokeDasharray="3 6" /></svg></div><div className="hero-atmosphere hero-atmosphere-left" aria-hidden="true"><InteractiveHeroCanvas backgroundColor="rgba(23, 19, 16, 0)" lineColor="rgba(196, 154, 90, .14)" lineCount={38} speed={1.6} glow={12} /></div><div className="hero-atmosphere hero-atmosphere-right" aria-hidden="true"><ShaderGroupSwitcher background="#171310" tint="#C49A5A" brightness={24} speed={18} hover={20} style={{ minWidth: 0, minHeight: 0 }} /></div><div className="hero-copy"><p className="eyebrow">FINOVA <span>/// AI PERSONAL FINANCIAL OPERATING SYSTEM</span></p><h1>Your Personal<br /><em>Financial OS.</em></h1><p>FINOVA doesn't just track your money. It understands your financial life, predicts what happens next, protects your goals and helps you make smarter decisions.</p><div className="hero-actions"><LiquidCarveButton label="Start Your Financial Journey" colors={{ fill: '#C49A5A', textColor: '#171310' }} blob={{ color: '#D2B477', size: 100, smoothness: 50 }} padding="15px 30px" rounded={9999} font={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: 13 }} /><button className="hero-secondary-btn" onClick={onLaunch}>Launch FINOVA OS <span>↗</span></button></div></div><div className="core-stage"><div className="core-label"><i /> FINOVA INTELLIGENCE CORE</div><div className="core-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><PlasmaRing background="rgba(0,0,0,0)" colors={['#D2B477', '#C49A5A', '#B88A44']} density={75} speed={36} waveHeight={10} centerOpacity={14} scale={30} style={{ width: '100%', height: '100%' }} /></div><FloatingSignal className="signal-balance" title="CURRENT BALANCE" value="₹1,24,850" /><FloatingSignal className="signal-spend" title="MONTHLY SPEND" value="₹38,420" /><FloatingSignal className="signal-goal" title="GOAL PROGRESS" value="72%" /><FloatingSignal className="signal-safe" title="SAFE TO SPEND" value="₹14,800" /></div><div className="scroll-cue">Scroll to enter the system <span className="scroll-arrow">↓</span></div></section>

    <section id="how-it-works" className="problem-section content-width"><p className="section-index">01 / THE PROBLEM</p><LineMaskSplit text="Your money is more than a number." tag="h2" splitMode="lines" font={{ fontFamily: 'Manrope', fontSize: 'clamp(2.6rem, 6vw, 6rem)', fontWeight: 400, lineHeight: 1, textAlign: 'left' }} color="#F5EDE2" /><p className="lead-copy">Traditional finance apps show you what happened.<br /><em>FINOVA helps you understand what happens next.</em></p><div className="concept-grid"><Concept number="01" title="TRACK" text="Understand where your money goes." /><Concept number="02" title="UNDERSTAND" text="Discover your financial behavior." /><Concept number="03" title="PREDICT" text="See the consequences before you spend." /></div></section>

    <section id="intelligence" className="brain-section content-width"><div className="section-heading"><div><p className="section-index">02 / THE FINANCIAL BRAIN</p><h2>One intelligence.<br /><em>Your entire financial life.</em></h2></div><p>FINOVA continuously brings your financial signals together to build a living understanding of your financial situation.</p></div><div className="brain-visual"><div className="brain-atmosphere"><InteractiveHeroCanvas backgroundColor="rgba(0,0,0,0)" lineColor="rgba(196, 154, 90, .12)" lineCount={28} speed={1.2} glow={14} /></div><div className="brain-core"><PlasmaRing background="rgba(0,0,0,0)" colors={['#D2B477', '#C49A5A', '#B88A44']} density={60} speed={28} centerOpacity={12} scale={30} style={{ width: '100%', height: '100%' }} /><span>FINOVA<br /><small>INTELLIGENCE</small></span></div>{brainNodes.map((node, index) => <span key={node} className={`brain-node brain-node-${index}`}>{node}</span>)}</div></section>

    <section id="features" className="stages-section content-width"><p className="section-index">03 / THE OPERATING LOOP</p><div className="stage-layout"><div><h2>From signal<br /><em>to action.</em></h2><p className="muted-copy">A continuous loop that turns real financial context into clearer decisions.</p></div><div className="stage-list">{stages.map(([name, detail], index) => <button key={name} className={activeStage === index ? 'stage-item active' : 'stage-item'} onClick={() => setActiveStage(index)}><span>0{index + 1}</span><strong>{name}</strong><small>{detail}</small><i>↗</i></button>)}</div></div></section>

    <section id="twin" className="twin-section content-width"><div className="twin-visual"><div className="twin-grid" /><div className="twin-center">∿</div><div className="twin-flow"><span>INCOME</span><b>↓</b><span>SPENDING</span><b>↓</b><span>BILLS</span><b>↓</b><span>GOALS</span><b>↓</b><span>SAVINGS</span><b>↓</b><span>FUTURE</span></div><small className="demo-label">ILLUSTRATIVE MODEL</small></div><div className="twin-copy"><p className="section-index">04 / FINANCIAL TWIN</p><h2>Meet your<br /><em>Financial Twin.</em></h2><p>FINOVA creates a continuously updated representation of your financial life. It grows more useful as your actual context changes.</p><div className="insight"><span>EXAMPLE / SIMULATION</span><p>“At your current spending rate, your emergency fund will reach ₹1,00,000 in approximately 4 months.”</p></div></div></section>

    <section id="goal-protection" className="protection-section content-width"><p className="section-index">05 / GOAL PROTECTION</p><div className="protection-heading"><h2>Your goals don't just exist.<br /><em>FINOVA protects them.</em></h2><p>Every purchase is evaluated in the context of what you are building next.</p></div><div className="protection-grid"><DemoGoal /><div className="impact-column"><ImpactCard amount="₹18,000" days="+ 0 days" copy="No meaningful impact" safe /><ImpactCard amount="₹45,000" days="+ 21 days" copy="Your goal shifts" /></div></div><button className="outline-action" onClick={onLaunch}>Simulate a Purchase <span>↗</span></button></section>

    <section id="purchases" className="advisor-section content-width"><div className="advisor-copy"><p className="section-index">06 / AI PURCHASE ADVISOR</p><h2>Before you buy,<br /><em>ask FINOVA.</em></h2><p>FINOVA does not decide for you. It shows the financial consequences so <strong>you</strong> can decide.</p><div className="conversation"><span>USER</span><p>“I need a laptop for college.”</p><span>FINOVA</span><p>“What matters most — performance, battery life, portability or price?”</p></div></div><div className="advisor-panel"><span className="panel-kicker">FINOVA EVALUATES</span>{['Budget', 'Current cash flow', 'Existing goals', 'Upcoming bills', 'Purchase necessity'].map((item, index) => <div className="check-row" key={item}><i>0{index + 1}</i>{item}<b>+</b></div>)}<div className="recommendations"><span>RECOMMENDATION</span><b>WITHIN PLAN</b><small>Example interface. Your context comes first.</small></div></div></section>

    <section className="gift-section content-width"><div><p className="section-index">07 / AI GIFT ADVISOR</p><h2>The perfect gift.<br /><em>Without breaking<br />your plan.</em></h2><p className="muted-copy">“My friend's birthday is next week. He loves gaming. My budget is ₹3,000.”</p><button className="outline-action" onClick={onLaunch}>Find the Best Gift <span>↗</span></button></div><div className="gift-panel"><span className="panel-kicker">ILLUSTRATIVE / NOT LIVE RESULTS</span><h3>Recommended range <strong>₹1,800 — ₹3,000</strong></h3>{giftOptions.map(([label, item, price, impact]) => <div className="gift-option" key={label}><span>{label}</span><b>{item}</b><strong>{price}</strong><small>{impact}</small></div>)}</div></section>

    <section className="event-section content-width"><div className="event-ring"><div>EVENT<br /><strong>MODE</strong></div></div><div><p className="section-index">08 / SUDDEN EXPENSE MODE</p><h2>Life doesn't follow<br /><em>your budget.</em></h2><p className="muted-copy">Birthday. Travel. Medical emergency. Repair. Family event. College expense.</p><div className="event-prompt"><span>“I have a birthday tomorrow.”</span><small>FINOVA asks: Who is it for? What's the occasion? What's your maximum budget?</small></div></div></section>

    <section id="simulator" className="simulator-section content-width"><p className="section-index">09 / WHAT-IF SIMULATOR</p><div className="simulator-heading"><h2>See the future<br /><em>before you decide.</em></h2><p>Change one decision. Watch the path respond. <span>ILLUSTRATIVE PREVIEW</span></p></div><PulsatingBorder colors={['#C49A5A', '#D2B477', '#B88A44']} radius={24} thickness={2} intensity={16} bloom={20} style={{ display: 'block' }}><div className="simulator-panel"><div className="simulator-top"><span>If I spend <strong>₹{spend.toLocaleString('en-IN')}</strong> today...</span><span>SIMULATION MODE</span></div><input aria-label="Illustrative purchase amount" type="range" min="5000" max="50000" step="5000" value={spend} onChange={event => setSpend(Number(event.target.value))} /><div className="simulator-values"><Metric label="CURRENT BALANCE" value="₹1,24,850" /><Metric label="FUTURE BALANCE" value={`₹${(124850 - spend).toLocaleString('en-IN')}`} /><Metric label="GOAL TIMELINE" value={spend > 30000 ? '+ 21 days' : '+ 0 days'} /><Metric label="SAFE TO SPEND" value={spend > 30000 ? 'Reconsider' : 'Within range'} /></div></div></PulsatingBorder></section>

    <section className="reports-section content-width"><p className="section-index">10 / INTELLIGENT REPORTS</p><h2>Your finances,<br /><em>explained simply.</em></h2><div className="report-grid"><Report label="DAILY" title="Important financial signals" /><Report label="WEEKLY" title="Spending behavior and recommendations" /><Report label="MONTHLY" title="Financial health report" /></div></section>

    <section id="security" className="security-section content-width"><div><p className="section-index">11 / SECURITY</p><h2>Your financial intelligence<br /><em>should remain yours.</em></h2></div><div className="security-list">{['Privacy-first architecture', 'Secure authentication', 'Encrypted sensitive data', 'Permission-based integrations', 'Transparent AI decisions', 'No fabricated financial information'].map(item => <div key={item}><i>+</i>{item}</div>)}</div></section>

    <section id="final-cta" className="final-section content-width"><div className="final-core"><PlasmaRing background="rgba(0,0,0,0)" colors={['#D2B477', '#C49A5A', '#B88A44']} density={65} speed={28} centerOpacity={10} scale={30} style={{ width: '100%', height: '100%' }} /></div><p className="section-index">12 / THE NEXT STEP</p><h2>Don't just manage money.<br /><em>Understand it.</em></h2><p>Build a financial system that thinks with you.</p><div className="hero-actions"><LiquidCarveButton label="Start With FINOVA" colors={{ fill: '#C49A5A', textColor: '#171310' }} blob={{ color: '#D2B477', size: 100 }} padding="15px 30px" rounded={9999} font={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: 13 }} /><button className="hero-secondary-btn" onClick={onLaunch}>Enter FINOVA OS <span>↗</span></button></div></section>
    <footer><span className="wordmark">FINOVA<span>.</span></span><span>AI PERSONAL FINANCIAL OPERATING SYSTEM</span><div><a href="#features">Product</a><a href="#intelligence">Intelligence</a><a href="#security">Security</a><a href="#security">Privacy</a><a href="#security">Terms</a><a href="#overview">Contact</a></div></footer>
  </main>
}

function FloatingSignal({ title, value, className }: { title: string; value: string; className: string }) { return <div className={`floating-signal ${className}`}><span>{title}</span><strong>{value}</strong></div> }
function Concept({ number, title, text }: { number: string; title: string; text: string }) { return <article className="concept"><span>{number}</span><h3>{title}</h3><p>{text}</p></article> }
function DemoGoal() { return <div className="demo-goal"><span>ILLUSTRATIVE GOAL</span><h3>MacBook Pro</h3><div className="goal-row"><small>Target</small><strong>₹1,50,000</strong></div><div className="goal-row"><small>Saved</small><strong>₹92,000</strong></div><div className="goal-progress"><i /></div><div className="goal-row"><small>Progress</small><strong>61%</strong></div></div> }
function ImpactCard({ amount, days, copy, safe = false }: { amount: string; days: string; copy: string; safe?: boolean }) { return <div className={`impact-card ${safe ? 'safe' : ''}`}><span>PURCHASE REQUEST</span><strong>{amount}</strong><small>IMPACT ON GOAL</small><b>{days}</b><p>{copy}</p></div> }
function Metric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div> }
function Report({ label, title }: { label: string; title: string }) { return <article className="report"><span>{label}</span><h3>{title}</h3><i>Example report preview</i><b>↗</b></article> }

export default function App() {
  const [inApp, setInApp] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith('/app') || window.location.search.includes('app=true')
    }
    return false
  })

  return inApp ? (
    <AuthProvider>
      <FinanceProvider>
        <AppExperience onExit={() => setInApp(false)} />
      </FinanceProvider>
    </AuthProvider>
  ) : (
    <LandingPage onLaunch={() => setInApp(true)} />
  )
}

