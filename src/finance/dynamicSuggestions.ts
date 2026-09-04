/**
 * FINOVA Dynamic Financial Suggestion Engine
 * Pure deterministic rule-based suggestion generator for onboarding & advisory flows.
 *
 * Adheres strictly to the FINOVA Modern Heritage Wealth Design System:
 * - 80% Navy / Cream / Slate foundation
 * - 15% Deep Emerald accents
 * - 5% Burned Ochre emphasis
 *
 * No external AI or Gemini calls required.
 */

export interface SuggestionFinancialContext {
  income?: number
  commitments?: number | Array<{ amount: number; frequency?: string }>
  monthlySpending?: number
  safeToSpend?: number
  financialHealth?: number
  goals?: Array<{
    name?: string
    target?: number
    saved?: number
    monthlyContribution?: number
    priority?: string
  }>
  emergencyReserve?: number
  maxBudget?: number
  spendingArchetype?: string
  recipient?: string
  occasion?: string
  interest?: string
  selectedPreference?: string
}

export interface DynamicSuggestion {
  id: string
  label: string
  description: string
  tier: 'essential' | 'balanced' | 'premium' | 'goal' | 'custom'
  isFeatured?: boolean
}

/**
 * Pure function to calculate context-aware dynamic suggestions.
 * Never mutates state or makes external network calls.
 */
export function getDynamicBudgetSuggestions(
  context: SuggestionFinancialContext = {}
): DynamicSuggestion[] {
  // 1. Normalize financial inputs
  const income = Math.max(0, context.income ?? 86000)
  
  let commitmentsMonthly = 0
  if (typeof context.commitments === 'number') {
    commitmentsMonthly = Math.max(0, context.commitments)
  } else if (Array.isArray(context.commitments)) {
    commitmentsMonthly = context.commitments.reduce((sum, c) => {
      const amt = Math.max(0, c.amount || 0)
      if (c.frequency === 'Annual') return sum + amt / 12
      if (c.frequency === 'Quarterly') return sum + amt / 3
      return sum + amt
    }, 0)
  } else {
    commitmentsMonthly = 25000
  }

  const spending = Math.max(0, context.monthlySpending ?? 38420)
  const safeToSpend = context.safeToSpend !== undefined
    ? Math.max(0, context.safeToSpend)
    : Math.max(0, income - commitmentsMonthly - spending)

  const goalsCount = context.goals ? context.goals.length : 2
  const goalMonthlyTotal = (context.goals || []).reduce(
    (sum, g) => sum + (g.monthlyContribution || 0),
    0
  )

  const budget = context.maxBudget !== undefined ? Math.max(0, context.maxBudget) : 5000

  // 2. Financial capacity heuristics
  const commitmentRatio = income > 0 ? commitmentsMonthly / income : 0.35
  const discretionarySurplus = Math.max(0, income - commitmentsMonthly - spending - goalMonthlyTotal)
  
  const isHighSurplus = (income >= 150000 || discretionarySurplus >= 35000) && safeToSpend >= budget * 2
  const isConstrained = income < 45000 || commitmentRatio >= 0.55 || discretionarySurplus < 12000 || safeToSpend < budget
  const isSevereConstraint = income < 30000 || discretionarySurplus < 5000 || safeToSpend < budget * 0.5
  const isGoalOriented =
    goalsCount >= 3 ||
    goalMonthlyTotal >= 0.2 * income ||
    context.selectedPreference === 'Reach my goals' ||
    context.selectedPreference === 'Save more'

  // 3. Dynamic Rule Matrix
  let rawSuggestions: Array<{ label: string; desc: string; tier: DynamicSuggestion['tier']; isFeatured?: boolean }> = []

  if (budget <= 3000) {
    // LOWER BUDGET TIER
    if (isSevereConstraint) {
      rawSuggestions = [
        { label: 'Essential', desc: 'Focus strictly on high-utility essentials', tier: 'essential' },
        { label: 'Low-cost', desc: 'Minimal outlay to safeguard emergency reserve', tier: 'essential' },
        { label: 'Practical', desc: 'Functional daily usefulness over prestige', tier: 'essential' },
        { label: 'Value', desc: 'Maximum durability per rupee spent', tier: 'essential' },
        { label: 'No-spend', desc: 'DIY, experiential, or zero-cost gesture', tier: 'essential', isFeatured: true },
      ]
    } else if (isGoalOriented) {
      rawSuggestions = [
        { label: 'Goal-first', desc: 'Protect monthly target savings contributions', tier: 'goal', isFeatured: true },
        { label: 'Value', desc: 'High utility without compromising timelines', tier: 'essential' },
        { label: 'Practical', desc: 'Functional items that avoid cash drag', tier: 'essential' },
        { label: 'Affordable', desc: 'Comfortably inside the current cycle', tier: 'essential' },
        { label: 'Minimal', desc: 'Lightweight expenditure footprint', tier: 'essential' },
      ]
    } else {
      rawSuggestions = [
        { label: 'Essential', desc: 'High daily utility with minimal overhead', tier: 'essential' },
        { label: 'Value', desc: 'Great quality-to-cost ratio', tier: 'essential' },
        { label: 'Practical', desc: 'Immediate usefulness for the recipient', tier: 'essential' },
        { label: 'Affordable', desc: 'Zero pressure on monthly cash flow', tier: 'essential' },
        { label: 'Minimal', desc: 'Simple, thoughtful, and lightweight', tier: 'essential', isFeatured: true },
      ]
    }
  } else if (budget <= 15000) {
    // MEDIUM BUDGET TIER
    if (isConstrained) {
      // User with moderate income + high commitments + limited discretionary capacity
      rawSuggestions = [
        { label: 'Value', desc: 'Optimized price-to-utility ratio', tier: 'essential' },
        { label: 'Useful', desc: 'Directly applicable to everyday needs', tier: 'balanced' },
        { label: 'Planned', desc: 'Fits seamlessly into this cycle’s commitments', tier: 'goal', isFeatured: true },
        { label: 'Balanced', desc: 'Maintains healthy buffer reserves', tier: 'balanced' },
        { label: 'Experience', desc: 'Memorable shared moments over material goods', tier: 'balanced' },
      ]
    } else if (isGoalOriented) {
      rawSuggestions = [
        { label: 'Goal-first', desc: 'Allocated without delaying major milestone dates', tier: 'goal', isFeatured: true },
        { label: 'Useful', desc: 'Practical, high-retention usefulness', tier: 'balanced' },
        { label: 'Planned', desc: 'Pre-budgeted disciplined allocation', tier: 'goal' },
        { label: 'Long-term', desc: 'Enduring value with multi-year longevity', tier: 'balanced' },
        { label: 'Value', desc: 'Prudent quality without lifestyle inflation', tier: 'essential' },
      ]
    } else {
      rawSuggestions = [
        { label: 'Useful', desc: 'Practical, meaningful everyday utility', tier: 'balanced' },
        { label: 'Balanced', desc: 'Fits cleanly within safe-to-spend headroom', tier: 'balanced' },
        { label: 'Personal', desc: 'Tailored to recipient interests and taste', tier: 'custom' },
        { label: 'Experience', desc: 'Memorable moments, dining, or shared activity', tier: 'balanced', isFeatured: true },
        { label: 'Flexible', desc: 'Versatile options across multiple use cases', tier: 'balanced' },
      ]
    }
  } else {
    // HIGHER BUDGET TIER (> ₹15,000)
    if (isHighSurplus) {
      // High income, low commitments, strong cash flow
      rawSuggestions = [
        { label: 'Premium', desc: 'Flagship craftsmanship and archival luxury', tier: 'premium', isFeatured: true },
        { label: 'Experience', desc: 'Curated bespoke experiences & travel', tier: 'premium' },
        { label: 'Personalized', desc: 'Bespoke custom engravings or heritage builds', tier: 'custom' },
        { label: 'Lifestyle', desc: 'Elevates everyday living or workspace comfort', tier: 'premium' },
        { label: 'Quality', desc: 'Top-tier materials designed for lifetime use', tier: 'premium' },
      ]
    } else if (isConstrained) {
      rawSuggestions = [
        { label: 'Planned', desc: 'Split via structured milestones or reserves', tier: 'goal' },
        { label: 'Quality', desc: 'Long-lasting build to prevent repeat purchases', tier: 'premium' },
        { label: 'Balanced', desc: 'Stretches capacity without debt risk', tier: 'balanced', isFeatured: true },
        { label: 'Experience', desc: 'Shared milestone memory with lasting impact', tier: 'balanced' },
        { label: 'Personalized', desc: 'Thoughtfully customized to justify allocation', tier: 'custom' },
      ]
    } else {
      rawSuggestions = [
        { label: 'Premium', desc: 'Refined craftsmanship and superior materials', tier: 'premium', isFeatured: true },
        { label: 'Experience', desc: 'Memorable bespoke outings or workshops', tier: 'premium' },
        { label: 'Personalized', desc: 'Custom tailored to specific recipient tastes', tier: 'custom' },
        { label: 'Lifestyle', desc: 'High aesthetic and comfort elevation', tier: 'premium' },
        { label: 'Quality', desc: 'Engineered durability with verified longevity', tier: 'premium' },
      ]
    }
  }

  // Ensure exactly 5 unique suggestions with unique IDs
  const seen = new Set<string>()
  const finalSuggestions: DynamicSuggestion[] = []

  for (const s of rawSuggestions) {
    if (!seen.has(s.label)) {
      seen.add(s.label)
      finalSuggestions.push({
        id: s.label.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        label: s.label,
        description: s.desc,
        tier: s.tier,
        isFeatured: s.isFeatured,
      })
    }
  }

  // Fallback if needed to guarantee 5 suggestions
  const fallbackList: Array<{ label: string; desc: string; tier: DynamicSuggestion['tier'] }> = [
    { label: 'Useful', desc: 'Practical day-to-day utility', tier: 'balanced' },
    { label: 'Personal', desc: 'Customized to recipient preference', tier: 'custom' },
    { label: 'Value', desc: 'Optimal return on expenditure', tier: 'essential' },
    { label: 'Experience', desc: 'Memorable lifestyle activity', tier: 'balanced' },
    { label: 'Flexible', desc: 'Adaptable to changing needs', tier: 'balanced' },
  ]

  for (const fb of fallbackList) {
    if (finalSuggestions.length >= 5) break
    if (!seen.has(fb.label)) {
      seen.add(fb.label)
      finalSuggestions.push({
        id: fb.label.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        label: fb.label,
        description: fb.desc,
        tier: fb.tier,
      })
    }
  }

  return finalSuggestions.slice(0, 5)
}
