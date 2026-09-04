import { ShieldCheck, Clock, ArrowUpRight } from 'lucide-react'
import { formatINR } from '../finance/FinanceContext'
import type { MerchantDefinition } from './retailerSearchEngines'

export interface MarketplaceComparisonMatrixProps {
  query: string
  budget: number
  safeToSpend: number
  merchants: MerchantDefinition[]
  onOpenMerchant: (merchant: MerchantDefinition) => void
}

export default function MarketplaceComparisonMatrix({
  query,
  budget,
  safeToSpend,
  merchants,
  onOpenMerchant,
}: MarketplaceComparisonMatrixProps) {
  const isComfortable = budget <= safeToSpend
  const primaryMerchants = merchants.slice(0, 4)

  return (
    <div
      style={{
        background: '#FFFDF8',
        border: '1px solid var(--os-line)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(63, 13, 18, 0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '10px', fontFamily: "'DM Mono', monospace", color: '#98111E', letterSpacing: '0.08em', fontWeight: 600 }}>
            CROSS-RETAILER DESTINATION MATRIX
          </span>
          <h4 style={{ margin: '2px 0 0', fontSize: '15px', color: '#211A17', fontWeight: 600 }}>
            Compare Merchant Search Channels for “{query}”
          </h4>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontFamily: "'DM Mono', monospace",
            padding: '4px 10px',
            borderRadius: '6px',
            background: isComfortable ? 'rgba(22, 101, 52, 0.08)' : 'rgba(153, 27, 27, 0.08)',
            border: isComfortable ? '1px solid rgba(22, 101, 52, 0.3)' : '1px solid rgba(153, 27, 27, 0.3)',
            color: isComfortable ? '#166534' : '#991b1b',
            fontWeight: 600,
          }}
        >
          Target: {formatINR(budget)} {isComfortable ? '✓ Fits Safe-to-Spend' : '▲ Exceeds Safe-to-Spend'}
        </span>
      </div>

      {/* Comparison Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {primaryMerchants.map(merchant => {
          const searchUrl = merchant.generateSearchUrl(query, budget)
          return (
            <div
              key={merchant.id}
              style={{
                background: '#F8F4EC',
                border: '1px solid var(--os-line)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#211A17', fontWeight: 600 }}>
                    {merchant.name}
                  </strong>
                  <span
                    style={{
                      fontSize: '9px',
                      fontFamily: "'DM Mono', monospace",
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: '#FFFDF8',
                      color: merchant.accentColor,
                      border: `1px solid ${merchant.accentColor}40`,
                      fontWeight: 600,
                    }}
                  >
                    {merchant.domain}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#756A60' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock className="w-3.5 h-3.5 text-[#756A60]" />
                    <span>{merchant.deliveryModel}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
                    <span>{merchant.badgeText}</span>
                  </div>
                </div>

                <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#524840', lineHeight: 1.4 }}>
                  {merchant.tagline}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--os-line)', paddingTop: '10px' }}>
                <a
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOpenMerchant(merchant)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#FFFDF8',
                    border: '1px solid var(--os-line)',
                    color: '#211A17',
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#98111E'
                    e.currentTarget.style.borderColor = '#98111E'
                    e.currentTarget.style.color = '#FFFDF8'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FFFDF8'
                    e.currentTarget.style.borderColor = 'var(--os-line)'
                    e.currentTarget.style.color = '#211A17'
                  }}
                >
                  <span>Search on {merchant.name}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
