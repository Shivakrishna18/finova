import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  SlidersHorizontal,
  ShieldCheck,
  ShoppingBag,
  Apple,
  ArrowRight,
  Layers,
  ArrowUpRight,
  Store,
} from 'lucide-react'
import {
  useFinance,
  formatINR,
} from '../finance/FinanceContext'
import {
  parseNaturalSearchQuery,
  getRecommendedMerchants,
  type MerchantId,
} from './retailerSearchEngines'
import MarketplaceImpactVisualizer from './MarketplaceImpactVisualizer'
import MarketplaceComparisonMatrix from './MarketplaceComparisonMatrix'

export interface SmartMarketplaceProps {
  initialQuery?: string
  initialBudget?: number
  initialCategory?: string
  onClose?: () => void
  embedded?: boolean
}

const PRESET_SEARCH_PILLS = [
  { label: 'Laptop for college', query: 'Laptop for college under 50000', budget: 50000, category: 'Electronics' },
  { label: 'Running shoes', query: 'Running shoes under 3500', budget: 3500, category: 'Fashion & Lifestyle' },
  { label: 'Wireless headphones', query: 'Wireless ANC headphones under 5000', budget: 5000, category: 'Electronics' },
  { label: 'Weekly groceries', query: 'Weekly groceries essentials', budget: 2500, category: 'Groceries & Food', isGrocery: true },
  { label: 'Birthday gift', query: 'Birthday gift for friend under 3000', budget: 3000, category: 'Gifts' },
  { label: 'Smartphone', query: '5G Smartphone under 25000', budget: 25000, category: 'Electronics' },
  { label: 'Backpack', query: 'Ergonomic water resistant laptop backpack', budget: 2200, category: 'Fashion & Lifestyle' },
  { label: 'Study table', query: 'Ergonomic study desk for home office', budget: 8500, category: 'Home & Living' },
  { label: 'Milk & breakfast', query: 'Milk bread eggs breakfast items', budget: 800, category: 'Groceries & Food', isGrocery: true },
]

export default function SmartMarketplace({
  initialQuery = 'Wireless headphones',
  initialBudget,
  initialCategory,
  onClose,
  embedded: _embedded = false,
}: SmartMarketplaceProps) {
  const { state: finance } = useFinance()

  // Search State
  const [rawQuery, setRawQuery] = useState(initialQuery)
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All Categories')
  const [selectedMerchant, setSelectedMerchant] = useState<string>('all')
  const [selectedCondition, setSelectedCondition] = useState<'new' | 'refurbished' | 'any'>('new')
  const [selectedUrgency, setSelectedUrgency] = useState<'immediate' | 'standard' | 'flexible'>('standard')
  const [budget, setBudget] = useState<number>(initialBudget || 5000)
  const [isGroceryMode, setIsGroceryMode] = useState<boolean>(false)
  const [activeSubTab, setActiveSubTab] = useState<'destinations' | 'impact' | 'compare'>('destinations')

  // Listen to custom finova-marketplace-search events
  useEffect(() => {
    const handleCustomSearch = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail) {
        if (detail.query) {
          setRawQuery(detail.query)
          setSubmittedQuery(detail.query)
        }
        if (detail.budget) setBudget(Number(detail.budget))
        if (detail.category) setSelectedCategory(detail.category)
        if (detail.isGrocery !== undefined) setIsGroceryMode(detail.isGrocery)
      }
    }
    window.addEventListener('finova-marketplace-search', handleCustomSearch)
    return () => window.removeEventListener('finova-marketplace-search', handleCustomSearch)
  }, [])

  // Auto-parse search query on change or submit
  const parsed = useMemo(() => {
    return parseNaturalSearchQuery(submittedQuery)
  }, [submittedQuery])

  // Sync parsed attributes when query is submitted
  useEffect(() => {
    if (parsed.detectedBudget && !initialBudget) {
      setBudget(parsed.detectedBudget)
    }
    if (parsed.isGrocery) {
      setIsGroceryMode(true)
      setSelectedCategory('Groceries & Food')
    } else if (parsed.detectedCategory !== 'General' && selectedCategory === 'All Categories') {
      setSelectedCategory(parsed.detectedCategory)
    }
    if (parsed.merchantPreference) {
      setSelectedMerchant(parsed.merchantPreference)
    }
    if (parsed.urgency !== 'standard') {
      setSelectedUrgency(parsed.urgency)
    }
  }, [parsed])

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = rawQuery.trim()
    if (!trimmed) return
    setSubmittedQuery(trimmed)
    const p = parseNaturalSearchQuery(trimmed)
    if (p.detectedBudget) {
      setBudget(p.detectedBudget)
    }
    if (p.isGrocery) {
      setIsGroceryMode(true)
      setSelectedCategory('Groceries & Food')
    }
    setFeedbackNotice(`Showing retailer search destinations for "${trimmed}"`)
    setTimeout(() => setFeedbackNotice(null), 3000)
  }

  const handleSelectPill = (pill: typeof PRESET_SEARCH_PILLS[0]) => {
    setRawQuery(pill.query)
    setSubmittedQuery(pill.query)
    setBudget(pill.budget)
    setSelectedCategory(pill.category)
    setIsGroceryMode(Boolean(pill.isGrocery))
  }

  // Recommended merchants list
  const recommendedMerchants = useMemo(() => {
    const list = getRecommendedMerchants({
      isGrocery: isGroceryMode,
      category: selectedCategory,
      merchantPreference: selectedMerchant !== 'all' ? (selectedMerchant as MerchantId) : null,
      urgency: selectedUrgency,
    })

    if (selectedMerchant !== 'all') {
      return list.filter(m => m.id === selectedMerchant)
    }
    return list
  }, [isGroceryMode, selectedCategory, selectedMerchant, selectedUrgency])

  const effectiveItemName = parsed.cleanedSearchTerms || submittedQuery || 'Selected Product'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid var(--os-line)',
          borderRadius: '14px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(63, 13, 18, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ color: '#98111E', fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', fontWeight: 700 }}>
                FINOVA SMART MARKETPLACE • PRODUCT DISCOVERY
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: "'DM Mono', monospace",
                  background: 'rgba(152, 17, 30, 0.08)',
                  color: '#98111E',
                  border: '1px solid rgba(152, 17, 30, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                Grounded in Real Financial State
              </span>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: '26px', color: '#211A17', fontWeight: 600 }}>
              Discover what to buy. <em style={{ color: '#98111E', fontStyle: 'normal' }}>Know if you can afford it.</em>
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#756A60', maxWidth: '650px', lineHeight: 1.5 }}>
              FINOVA evaluates your search and budget against your actual uncommitted Safe-to-Spend (<strong>{formatINR(finance.safeToSpend)}</strong>), goal timelines, and cash-flow obligations before routing you to verified retailer search channels.
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F8F4EC',
                border: '1px solid var(--os-line)',
                color: '#756A60',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          )}
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} style={{ marginTop: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F8F4EC',
              border: '1px solid var(--os-line)',
              borderRadius: '10px',
              padding: '6px 10px',
              gap: '10px',
            }}
          >
            <Search className="w-5 h-5 text-[#98111E] flex-shrink-0" />
            <input
              type="text"
              value={rawQuery}
              onChange={e => setRawQuery(e.target.value)}
              placeholder="What are you looking for? (e.g. Laptop under ₹50,000, running shoes, groceries for the week...)"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#211A17',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              aria-label="Search items or products"
            />

            {rawQuery && (
              <button
                type="button"
                onClick={() => setRawQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#756A60',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            )}

            <button
              type="submit"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: '#98111E',
                border: '1px solid #98111E',
                color: '#FFFDF8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '14px' }}>
          <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'DM Mono', monospace" }}>
            QUICK EXPLORE:
          </span>
          {PRESET_SEARCH_PILLS.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPill(pill)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: submittedQuery === pill.query ? '#FFFDF8' : '#F8F4EC',
                border: submittedQuery === pill.query ? '1px solid #98111E' : '1px solid var(--os-line)',
                color: submittedQuery === pill.query ? '#98111E' : '#756A60',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER & SPECIFICATION CONTROLS */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1px solid var(--os-line)',
          borderRadius: '12px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 4px 20px rgba(63, 13, 18, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal className="w-4 h-4 text-[#98111E]" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#211A17' }}>
              Search Specifications & Financial Parameters
            </span>
          </div>

          {/* Mode Switcher: Standard vs Grocery */}
          <div style={{ display: 'flex', background: '#F8F4EC', padding: '3px', borderRadius: '8px', border: '1px solid var(--os-line)' }}>
            <button
              type="button"
              onClick={() => {
                setIsGroceryMode(false)
                if (selectedCategory === 'Groceries & Food') setSelectedCategory('All Categories')
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: !isGroceryMode ? '#98111E' : 'transparent',
                color: !isGroceryMode ? '#FFFDF8' : '#756A60',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Standard Marketplace</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsGroceryMode(true)
                setSelectedCategory('Groceries & Food')
                if (!rawQuery.toLowerCase().includes('grocer')) {
                  setRawQuery('Weekly groceries essentials')
                  setSubmittedQuery('Weekly groceries essentials')
                  setBudget(2500)
                }
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: isGroceryMode ? '#98111E' : 'transparent',
                color: isGroceryMode ? '#FFFDF8' : '#756A60',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>Grocery Discovery Mode</span>
            </button>
          </div>
        </div>

        {/* Filter Row: Budget + Category + Merchant + Urgency */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Maximum Budget Slider & Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'DM Mono', monospace" }}>
                MAXIMUM BUDGET
              </span>
              <strong style={{ fontSize: '14px', color: '#211A17', fontFamily: "'DM Mono', monospace" }}>
                {formatINR(budget)}
              </strong>
            </div>
            <input
              type="range"
              min="500"
              max="150000"
              step="500"
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#98111E', cursor: 'pointer' }}
              aria-label="Adjust maximum purchase budget"
            />
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[1000, 2500, 5000, 15000, 35000, 50000, 100000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBudget(val)}
                  style={{
                    padding: '3px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: "'DM Mono', monospace",
                    border: budget === val ? '1px solid #98111E' : '1px solid var(--os-line)',
                    background: budget === val ? '#FFFDF8' : '#F8F4EC',
                    color: budget === val ? '#98111E' : '#756A60',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {formatINR(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'DM Mono', monospace" }}>
              PREFERRED CATEGORY
            </span>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value)
                if (e.target.value === 'Groceries & Food') setIsGroceryMode(true)
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#F8F4EC',
                border: '1px solid var(--os-line)',
                color: '#211A17',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="All Categories">All Categories (Auto)</option>
              <option value="Electronics">Electronics & Gadgets</option>
              <option value="Groceries & Food">Groceries & Daily Essentials</option>
              <option value="Fashion & Lifestyle">Fashion, Footwear & Bags</option>
              <option value="Home & Living">Home, Furniture & Living</option>
              <option value="Fitness & Health">Fitness, Sports & Health</option>
              <option value="Books & Productivity">Books & Study Material</option>
              <option value="Gifts">Gifts & Occasions</option>
              <option value="Healthcare & Wellness">Healthcare & Pharmacy</option>
            </select>
          </div>

          {/* Preferred Merchant */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'DM Mono', monospace" }}>
              PREFERRED RETAILER
            </span>
            <select
              value={selectedMerchant}
              onChange={e => setSelectedMerchant(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#F8F4EC',
                border: '1px solid var(--os-line)',
                color: '#211A17',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Supported Retailers</option>
              <option value="amazon">Amazon India</option>
              <option value="flipkart">Flipkart</option>
              <option value="croma">Croma (Tata Enterprise)</option>
              <option value="reliancedigital">Reliance Digital</option>
              <option value="myntra">Myntra</option>
              <option value="bigbasket">BigBasket</option>
              <option value="blinkit">Blinkit (10-min)</option>
              <option value="zepto">Zepto (10-min)</option>
              <option value="swiggy_instamart">Swiggy Instamart</option>
              <option value="tata_1mg">Tata 1mg</option>
              <option value="google_shopping">Google Shopping</option>
            </select>
          </div>

          {/* Urgency & Condition */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'DM Mono', monospace" }}>
              DELIVERY TIMELINE / CONDITION
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={selectedUrgency}
                onChange={e => setSelectedUrgency(e.target.value as any)}
                style={{
                  flex: 1,
                  padding: '8px 8px',
                  borderRadius: '6px',
                  background: '#F8F4EC',
                  border: '1px solid var(--os-line)',
                  color: '#211A17',
                  fontSize: '11px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="standard">Standard Shipping</option>
                <option value="immediate">⚡ 10-20 min Instant</option>
                <option value="flexible">Advance / Flexible</option>
              </select>

              <select
                value={selectedCondition}
                onChange={e => setSelectedCondition(e.target.value as any)}
                style={{
                  flex: 1,
                  padding: '8px 8px',
                  borderRadius: '6px',
                  background: '#F8F4EC',
                  border: '1px solid var(--os-line)',
                  color: '#211A17',
                  fontSize: '11px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="new">Brand New</option>
                <option value="refurbished">Refurbished / Renewed</option>
                <option value="any">Any Condition</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSPARENT DATA SOURCE BANNER */}
      <div
        style={{
          background: 'rgba(152, 17, 30, 0.06)',
          border: '1px solid rgba(152, 17, 30, 0.2)',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck className="w-5 h-5 text-[#98111E] flex-shrink-0" />
          <div>
            <strong style={{ fontSize: '12px', color: '#98111E', fontWeight: 700 }}>
              DATA SOURCE: RETAILER SEARCH ENGINE (AUTHENTIC LIVE QUERY LINKS)
            </strong>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#756A60' }}>
              FINOVA generates legitimate, URL-encoded search queries directly to verified merchants. We do not invent mock products, prices, or fake reviews.
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '10px',
            fontFamily: "'DM Mono', monospace",
            color: '#166534',
            background: 'rgba(22, 101, 52, 0.08)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(22, 101, 52, 0.3)',
            fontWeight: 600,
          }}
        >
          ● Retailer Search Ready
        </span>
      </div>

      {/* FINOVA FINANCIAL INTELLIGENCE & CAPACITY EVALUATOR */}
      <MarketplaceImpactVisualizer
        itemName={effectiveItemName}
        category={selectedCategory}
        budget={budget}
        isGrocery={isGroceryMode}
        onSelectAlternativeBudget={newBudget => setBudget(newBudget)}
      />

      {/* NAVIGATION SUB-TABS: RETAILER DESTINATIONS / COMPARISON MATRIX */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--os-line)',
          paddingBottom: '10px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('destinations')}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            background: activeSubTab === 'destinations' ? '#FFFDF8' : '#F8F4EC',
            border: activeSubTab === 'destinations' ? '1px solid #98111E' : '1px solid var(--os-line)',
            color: activeSubTab === 'destinations' ? '#98111E' : '#756A60',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Store className="w-4 h-4" />
          <span>Retailer Search Channels ({recommendedMerchants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('compare')}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            background: activeSubTab === 'compare' ? '#FFFDF8' : '#F8F4EC',
            border: activeSubTab === 'compare' ? '1px solid #98111E' : '1px solid var(--os-line)',
            color: activeSubTab === 'compare' ? '#98111E' : '#756A60',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Layers className="w-4 h-4" />
          <span>Cross-Merchant Comparison</span>
        </button>
      </div>

      {/* TAB 1: RETAILER SEARCH DESTINATIONS */}
      {activeSubTab === 'destinations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
              VERIFIED RETAILER DESTINATIONS FOR “{effectiveItemName}”
            </span>
            <span style={{ fontSize: '11px', color: '#756A60' }}>
              Target Ceiling: {formatINR(budget)}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {recommendedMerchants.map(merchant => {
              const searchUrl = merchant.generateSearchUrl(effectiveItemName, budget, {
                category: selectedCategory,
                maxBudget: budget,
                condition: selectedCondition,
                urgency: selectedUrgency,
                groceryMode: isGroceryMode,
              })

              return (
                <div
                  key={merchant.id}
                  style={{
                    background: '#FFFDF8',
                    border: '1px solid var(--os-line)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 4px 20px rgba(63, 13, 18, 0.04)',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#98111E'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--os-line)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div>
                    {/* Merchant Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '16px', color: '#211A17', fontWeight: 600 }}>
                          {merchant.name}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#756A60', fontFamily: "'DM Mono', monospace" }}>
                          {merchant.domain}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: "'DM Mono', monospace",
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: `${merchant.accentColor}18`,
                          color: merchant.accentColor,
                          border: `1px solid ${merchant.accentColor}40`,
                        }}
                      >
                        {merchant.badgeText}
                      </span>
                    </div>

                    <p style={{ margin: '6px 0 12px', fontSize: '12px', color: '#524840', lineHeight: 1.4 }}>
                      {merchant.tagline}
                    </p>

                    {/* Meta Tokens */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#F8F4EC', color: '#756A60', border: '1px solid var(--os-line)' }}>
                        🚚 {merchant.deliveryModel}
                      </span>
                      {isGroceryMode && merchant.isGrocery && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(22, 101, 52, 0.08)', color: '#166534', border: '1px solid rgba(22, 101, 52, 0.3)' }}>
                          ✓ Grocery Optimized
                        </span>
                      )}
                      {selectedCondition === 'refurbished' && (
                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(180, 83, 9, 0.08)', color: '#b45309', border: '1px solid rgba(180, 83, 9, 0.3)' }}>
                          Renewed / Value
                        </span>
                      )}
                    </div>

                    {/* Query string preview */}
                    <div style={{ background: '#F8F4EC', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--os-line)' }}>
                      <span style={{ fontSize: '9px', color: '#756A60', display: 'block', fontFamily: "'DM Mono', monospace" }}>
                        GENERATED RETAILER QUERY:
                      </span>
                      <code style={{ fontSize: '11px', color: '#211A17', fontFamily: "'DM Mono', monospace", wordBreak: 'break-all' }}>
                        {effectiveItemName} {budget > 0 ? `(Max ${formatINR(budget)})` : ''}
                      </code>
                    </div>
                  </div>

                  {/* High Contrast External Link Action */}
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 18px',
                      borderRadius: '8px',
                      background: '#98111E',
                      border: '1px solid #98111E',
                      color: '#FFFDF8',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 4px 12px rgba(152, 17, 30, 0.2)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#7d0d18'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#98111E'
                    }}
                  >
                    <span>Search on {merchant.name}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COMPARISON MATRIX */}
      {activeSubTab === 'compare' && (
        <MarketplaceComparisonMatrix
          query={effectiveItemName}
          budget={budget}
          safeToSpend={finance.safeToSpend}
          merchants={recommendedMerchants}
          onOpenMerchant={() => {}}
        />
      )}
    </div>
  )
}
