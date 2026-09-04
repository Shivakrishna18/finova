export type MerchantId =
  | 'amazon'
  | 'flipkart'
  | 'croma'
  | 'reliancedigital'
  | 'myntra'
  | 'bigbasket'
  | 'blinkit'
  | 'zepto'
  | 'swiggy_instamart'
  | 'tata_1mg'
  | 'google_shopping'

export interface MerchantDefinition {
  id: MerchantId
  name: string
  domain: string
  tagline: string
  badgeText: string
  categorySupport: string[]
  isGrocery: boolean
  isElectronics: boolean
  isFashion: boolean
  isPharmacy: boolean
  deliveryModel: 'Standard & Express' | 'Quick Commerce (10-20 mins)' | 'Store Pickup & Delivery' | 'Hyperlocal / Scheduled'
  accentColor: string
  generateSearchUrl: (query: string, maxBudget?: number, options?: SearchOptions) => string
  description: string
}

export interface SearchOptions {
  category?: string
  maxBudget?: number
  condition?: 'new' | 'refurbished' | 'any'
  urgency?: 'immediate' | 'standard' | 'flexible'
  groceryMode?: boolean
  merchantFilter?: string
  sortBy?: 'relevance' | 'price_low_high' | 'rating'
}

export interface ParsedQuery {
  rawQuery: string
  cleanedSearchTerms: string
  detectedCategory: string
  detectedItemName: string
  detectedBudget: number | null
  isGrocery: boolean
  merchantPreference: MerchantId | null
  urgency: 'immediate' | 'standard' | 'flexible'
  condition: 'new' | 'refurbished' | 'any'
  tags: string[]
}

export const SUPPORTED_MERCHANTS: Record<MerchantId, MerchantDefinition> = {
  amazon: {
    id: 'amazon',
    name: 'Amazon India',
    domain: 'amazon.in',
    tagline: 'Vast selection, Prime delivery, comprehensive buyer protection',
    badgeText: 'Marketplace • Prime Fast Delivery',
    categorySupport: ['Electronics', 'Home & Living', 'Books', 'Fashion', 'Fitness', 'Gifts', 'Groceries & Food', 'General'],
    isGrocery: true,
    isElectronics: true,
    isFashion: true,
    isPharmacy: false,
    deliveryModel: 'Standard & Express',
    accentColor: '#f59e0b',
    generateSearchUrl: (query: string, maxBudget?: number) => {
      let term = query.trim()
      if (maxBudget && maxBudget > 0 && !term.toLowerCase().includes('under') && !term.toLowerCase().includes('₹')) {
        term = `${term} under ${maxBudget}`
      }
      return `https://www.amazon.in/s?k=${encodeURIComponent(term)}`
    },
    description: 'Direct search on Amazon India with genuine catalog querying and review verification.',
  },
  flipkart: {
    id: 'flipkart',
    name: 'Flipkart',
    domain: 'flipkart.com',
    tagline: 'Wide brand catalog, electronics offers, and verified retailer listings',
    badgeText: 'Marketplace • Plus Assured',
    categorySupport: ['Electronics', 'Fashion', 'Home & Living', 'Gifts', 'Fitness', 'General'],
    isGrocery: true,
    isElectronics: true,
    isFashion: true,
    isPharmacy: false,
    deliveryModel: 'Standard & Express',
    accentColor: '#3b82f6',
    generateSearchUrl: (query: string, maxBudget?: number) => {
      let term = query.trim()
      if (maxBudget && maxBudget > 0 && !term.toLowerCase().includes('under') && !term.toLowerCase().includes('₹')) {
        term = `${term} under ${maxBudget}`
      }
      return `https://www.flipkart.com/search?q=${encodeURIComponent(term)}`
    },
    description: 'Direct search on Flipkart marketplace for genuine brand products and competitive pricing.',
  },
  croma: {
    id: 'croma',
    name: 'Croma',
    domain: 'croma.com',
    tagline: 'Tata enterprise electronics retailer with verified warranty & store pickup',
    badgeText: 'Tata Enterprise • Official Warranty',
    categorySupport: ['Electronics', 'Home Appliances', 'Tech & Gadgets', 'Audio & Video'],
    isGrocery: false,
    isElectronics: true,
    isFashion: false,
    isPharmacy: false,
    deliveryModel: 'Store Pickup & Delivery',
    accentColor: '#059669',
    generateSearchUrl: (query: string) => {
      return `https://www.croma.com/searchB?q=${encodeURIComponent(query.trim())}`
    },
    description: 'Direct search on Croma for authentic electronics with Tata warranty support.',
  },
  reliancedigital: {
    id: 'reliancedigital',
    name: 'Reliance Digital',
    domain: 'reliancedigital.in',
    tagline: 'Nationwide electronics store network with fast express delivery',
    badgeText: 'Authorized Retailer • Store Network',
    categorySupport: ['Electronics', 'Home Appliances', 'Computers & Laptops', 'Smartphones'],
    isGrocery: false,
    isElectronics: true,
    isFashion: false,
    isPharmacy: false,
    deliveryModel: 'Store Pickup & Delivery',
    accentColor: '#dc2626',
    generateSearchUrl: (query: string) => {
      return `https://www.reliancedigital.in/search?q=${encodeURIComponent(query.trim())}`
    },
    description: 'Direct search on Reliance Digital for authorized brand warranties and in-store stock.',
  },
  myntra: {
    id: 'myntra',
    name: 'Myntra',
    domain: 'myntra.com',
    tagline: 'Curated fashion, apparel, footwear, accessories, and premium lifestyle',
    badgeText: 'Fashion & Lifestyle • 100% Original',
    categorySupport: ['Fashion', 'Footwear', 'Accessories', 'Beauty & Personal Care', 'Gifts'],
    isGrocery: false,
    isElectronics: false,
    isFashion: true,
    isPharmacy: false,
    deliveryModel: 'Standard & Express',
    accentColor: '#ec4899',
    generateSearchUrl: (query: string) => {
      return `https://www.myntra.com/${encodeURIComponent(query.trim())}`
    },
    description: 'Direct search on Myntra for branded apparel, footwear, and curated fashion items.',
  },
  bigbasket: {
    id: 'bigbasket',
    name: 'BigBasket',
    domain: 'bigbasket.com',
    tagline: 'Comprehensive online supermarket for fresh produce, staples, and FMCG',
    badgeText: 'Grocery • Scheduled & Express Slots',
    categorySupport: ['Groceries & Food', 'Fresh Produce', 'Daily Essentials', 'Household'],
    isGrocery: true,
    isElectronics: false,
    isFashion: false,
    isPharmacy: false,
    deliveryModel: 'Hyperlocal / Scheduled',
    accentColor: '#65a30d',
    generateSearchUrl: (query: string) => {
      return `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query.trim())}`
    },
    description: 'Direct search on BigBasket for bulk weekly groceries, fresh vegetables, and pantry staples.',
  },
  blinkit: {
    id: 'blinkit',
    name: 'Blinkit',
    domain: 'blinkit.com',
    tagline: '10-minute ultra-fast delivery for groceries, essentials, and snacks',
    badgeText: 'Quick Commerce • 10-Minute Delivery',
    categorySupport: ['Groceries & Food', 'Snacks & Beverages', 'Daily Essentials', 'Instant Needs'],
    isGrocery: true,
    isElectronics: false,
    isFashion: false,
    isPharmacy: false,
    deliveryModel: 'Quick Commerce (10-20 mins)',
    accentColor: '#eab308',
    generateSearchUrl: (query: string) => {
      return `https://blinkit.com/s/?q=${encodeURIComponent(query.trim())}`
    },
    description: 'Direct search on Blinkit for ultra-fast 10-minute grocery and instant home essentials.',
  },
  zepto: {
    id: 'zepto',
    name: 'Zepto',
    domain: 'zeptonow.com',
    tagline: 'Instant grocery delivery in 10 minutes with fresh dark-store inventory',
    badgeText: 'Quick Commerce • 10-Minute Instant',
    categorySupport: ['Groceries & Food', 'Fresh Vegetables & Fruits', 'Dairy & Bakery', 'Snacks'],
    isGrocery: true,
    isElectronics: false,
    isFashion: false,
    isPharmacy: false,
    deliveryModel: 'Quick Commerce (10-20 mins)',
    accentColor: '#8b5cf6',
    generateSearchUrl: (query: string) => {
      return `https://www.zeptonow.com/search?q=${encodeURIComponent(query.trim())}`
    },
    description: 'Direct search on Zepto for instantaneous grocery delivery, milk, produce, and snacks.',
  },
  swiggy_instamart: {
    id: 'swiggy_instamart',
    name: 'Swiggy Instamart',
    domain: 'swiggy.com/instamart',
    tagline: 'Instant grocery & daily essentials delivery powered by Swiggy fleet',
    badgeText: 'Quick Commerce • 15-Minute Delivery',
    categorySupport: ['Groceries & Food', 'Snacks', 'Beverages', 'Pantry & Household'],
    isGrocery: true,
    isElectronics: false,
    isFashion: false,
    isPharmacy: false,
    deliveryModel: 'Quick Commerce (10-20 mins)',
    accentColor: '#f97316',
    generateSearchUrl: (query: string) => {
      return `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query.trim())}`
    },
    description: 'Direct search on Swiggy Instamart for instant groceries, night delivery, and essentials.',
  },
  tata_1mg: {
    id: 'tata_1mg',
    name: 'Tata 1mg',
    domain: '1mg.com',
    tagline: 'Verified medicines, health supplements, vitamins, and medical devices',
    badgeText: 'Pharmacy & Wellness • Tata Healthcare',
    categorySupport: ['Healthcare & Wellness', 'Supplements', 'Medical Devices', 'Personal Care'],
    isGrocery: false,
    isElectronics: false,
    isFashion: false,
    isPharmacy: true,
    deliveryModel: 'Standard & Express',
    accentColor: '#ef4444',
    generateSearchUrl: (query: string) => {
      return `https://www.1mg.com/search/all?name=${encodeURIComponent(query.trim())}`
    },
    description: 'Direct search on Tata 1mg for genuine health supplements, fitness protein, and wellness items.',
  },
  google_shopping: {
    id: 'google_shopping',
    name: 'Google Shopping (India)',
    domain: 'google.com/shopping',
    tagline: 'Multi-merchant comparison indexing prices across dozens of Indian retailers',
    badgeText: 'Price Aggregator • Multi-Merchant',
    categorySupport: ['General', 'Electronics', 'Fashion', 'Home & Living', 'Gifts', 'Fitness'],
    isGrocery: false,
    isElectronics: true,
    isFashion: true,
    isPharmacy: false,
    deliveryModel: 'Standard & Express',
    accentColor: '#10b981',
    generateSearchUrl: (query: string, maxBudget?: number) => {
      let term = query.trim()
      if (maxBudget && maxBudget > 0 && !term.toLowerCase().includes('under') && !term.toLowerCase().includes('₹')) {
        term = `${term} under ${maxBudget}`
      }
      return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(term)}`
    },
    description: 'Aggregate price comparison across hundreds of verified Indian stores on Google Shopping.',
  },
}

/**
 * Intelligent parser that extracts budget numbers, grocery classification, category,
 * merchant preference, urgency, and cleaned search tokens from natural language user inputs.
 */
export function parseNaturalSearchQuery(rawQuery: string): ParsedQuery {
  const trimmed = (rawQuery || '').trim()
  const lower = trimmed.toLowerCase()

  // 1. Detect Budget
  let detectedBudget: number | null = null
  // Regex for patterns like: "under 50000", "under ₹50,000", "below 50k", "for 2000", "50k budget", "budget 30000"
  const budgetKMatch = lower.match(/(?:under|below|budget|around|max|within|for)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/)
  if (budgetKMatch) {
    detectedBudget = Math.round(parseFloat(budgetKMatch[1]) * 1000)
  } else {
    const budgetNumMatch = lower.match(/(?:under|below|budget|around|max|within|for)\s*(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})+|\d+)\b/)
    if (budgetNumMatch) {
      const cleanNum = budgetNumMatch[1].replace(/,/g, '')
      detectedBudget = parseInt(cleanNum, 10)
    } else {
      // Look for standalone currency numbers like "₹50000" or "50000/-"
      const directPriceMatch = lower.match(/(?:₹|rs\.?|inr)\s*(\d{1,3}(?:,\d{3})+|\d+)\b/)
      if (directPriceMatch) {
        detectedBudget = parseInt(directPriceMatch[1].replace(/,/g, ''), 10)
      }
    }
  }

  // 2. Detect Grocery Mode
  const groceryKeywords = [
    'grocery',
    'groceries',
    'vegetable',
    'vegetables',
    'fruit',
    'fruits',
    'milk',
    'curd',
    'paneer',
    'bread',
    'eggs',
    'egg',
    'rice',
    'dal',
    'atta',
    'flour',
    'oil',
    'ghee',
    'masala',
    'spices',
    'snack',
    'snacks',
    'biscuit',
    'biscuits',
    'chips',
    'coffee beans',
    'tea leaves',
    'breakfast',
    'oats',
    'muesli',
    'hostel groceries',
    'weekly groceries',
    'supermarket',
    'instamart',
    'blinkit',
    'zepto',
    'bigbasket',
  ]
  const isGrocery = groceryKeywords.some(kw => lower.includes(kw))

  // 3. Detect Merchant Preference
  let merchantPreference: MerchantId | null = null
  if (lower.includes('amazon')) merchantPreference = 'amazon'
  else if (lower.includes('flipkart')) merchantPreference = 'flipkart'
  else if (lower.includes('croma')) merchantPreference = 'croma'
  else if (lower.includes('reliance') || lower.includes('digital')) merchantPreference = 'reliancedigital'
  else if (lower.includes('myntra')) merchantPreference = 'myntra'
  else if (lower.includes('bigbasket')) merchantPreference = 'bigbasket'
  else if (lower.includes('blinkit')) merchantPreference = 'blinkit'
  else if (lower.includes('zepto')) merchantPreference = 'zepto'
  else if (lower.includes('swiggy') || lower.includes('instamart')) merchantPreference = 'swiggy_instamart'
  else if (lower.includes('1mg') || lower.includes('tata 1mg') || lower.includes('medicine')) merchantPreference = 'tata_1mg'

  // 4. Detect Urgency
  let urgency: 'immediate' | 'standard' | 'flexible' = 'standard'
  if (lower.includes('urgent') || lower.includes('today') || lower.includes('now') || lower.includes('10 min') || lower.includes('immediate') || lower.includes('quick')) {
    urgency = 'immediate'
  } else if (lower.includes('next month') || lower.includes('advance') || lower.includes('planning') || lower.includes('flexible')) {
    urgency = 'flexible'
  }

  // 5. Detect Condition
  let condition: 'new' | 'refurbished' | 'any' = 'new'
  if (lower.includes('refurbished') || lower.includes('renewed') || lower.includes('used') || lower.includes('second hand')) {
    condition = 'refurbished'
  }

  // 6. Detect Category
  let detectedCategory = 'General'
  if (isGrocery) {
    detectedCategory = 'Groceries & Food'
  } else if (
    lower.includes('laptop') ||
    lower.includes('macbook') ||
    lower.includes('phone') ||
    lower.includes('iphone') ||
    lower.includes('samsung') ||
    lower.includes('headphone') ||
    lower.includes('earbuds') ||
    lower.includes('watch') ||
    lower.includes('tablet') ||
    lower.includes('ipad') ||
    lower.includes('camera') ||
    lower.includes('monitor') ||
    lower.includes('keyboard') ||
    lower.includes('gadget')
  ) {
    detectedCategory = 'Electronics'
  } else if (
    lower.includes('shoe') ||
    lower.includes('sneaker') ||
    lower.includes('shirt') ||
    lower.includes('jacket') ||
    lower.includes('dress') ||
    lower.includes('jeans') ||
    lower.includes('cloth') ||
    lower.includes('tshirt') ||
    lower.includes('bag') ||
    lower.includes('backpack')
  ) {
    detectedCategory = 'Fashion & Lifestyle'
  } else if (
    lower.includes('table') ||
    lower.includes('chair') ||
    lower.includes('desk') ||
    lower.includes('sofa') ||
    lower.includes('bed') ||
    lower.includes('lamp') ||
    lower.includes('furniture') ||
    lower.includes('decor')
  ) {
    detectedCategory = 'Home & Living'
  } else if (
    lower.includes('gift') ||
    lower.includes('birthday') ||
    lower.includes('anniversary') ||
    lower.includes('present')
  ) {
    detectedCategory = 'Gifts'
  } else if (
    lower.includes('gym') ||
    lower.includes('fitness') ||
    lower.includes('dumbbell') ||
    lower.includes('protein') ||
    lower.includes('creatine') ||
    lower.includes('running') ||
    lower.includes('yoga')
  ) {
    detectedCategory = 'Fitness & Health'
  } else if (
    lower.includes('book') ||
    lower.includes('novel') ||
    lower.includes('course') ||
    lower.includes('study')
  ) {
    detectedCategory = 'Books & Productivity'
  }

  // 7. Clean terms for search engine queries (strip out "find me", "can I afford", "under X", "on amazon")
  let cleanedTerms = trimmed
    .replace(/^can i afford\s+/i, '')
    .replace(/^find me\s+(a\s+|an\s+)?/i, '')
    .replace(/^search for\s+/i, '')
    .replace(/^i need\s+/i, '')
    .replace(/^best\s+/i, '')
    .replace(/^looking for\s+(a\s+|an\s+)?/i, '')
    .replace(/\s+(on|from|in)\s+(amazon|flipkart|croma|myntra|blinkit|zepto|bigbasket|instamart|1mg)\b/gi, '')
    .replace(/\s+(under|below|budget|for|within)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?\s*k|\d{1,3}(?:,\d{3})+|\d+)\b/gi, '')
    .trim()

  if (!cleanedTerms) {
    cleanedTerms = trimmed
  }

  const tags: string[] = []
  if (detectedCategory) tags.push(detectedCategory)
  if (isGrocery) tags.push('Grocery Mode')
  if (detectedBudget) tags.push(`Max ₹${detectedBudget.toLocaleString('en-IN')}`)
  if (urgency === 'immediate') tags.push('Quick Delivery')
  if (condition === 'refurbished') tags.push('Refurbished / Value')

  return {
    rawQuery: trimmed,
    cleanedSearchTerms: cleanedTerms,
    detectedCategory,
    detectedItemName: cleanedTerms,
    detectedBudget,
    isGrocery,
    merchantPreference,
    urgency,
    condition,
    tags,
  }
}

/**
 * Returns prioritized merchants based on query category, grocery mode, and urgency.
 */
export function getRecommendedMerchants(options: {
  isGrocery: boolean
  category: string
  merchantPreference?: MerchantId | null
  urgency?: 'immediate' | 'standard' | 'flexible'
}): MerchantDefinition[] {
  const { isGrocery, category, merchantPreference, urgency } = options

  if (merchantPreference && SUPPORTED_MERCHANTS[merchantPreference]) {
    const preferred = SUPPORTED_MERCHANTS[merchantPreference]
    const others = Object.values(SUPPORTED_MERCHANTS).filter(m => m.id !== merchantPreference)
    return [preferred, ...others]
  }

  if (isGrocery) {
    if (urgency === 'immediate') {
      return [
        SUPPORTED_MERCHANTS.blinkit,
        SUPPORTED_MERCHANTS.zepto,
        SUPPORTED_MERCHANTS.swiggy_instamart,
        SUPPORTED_MERCHANTS.bigbasket,
        SUPPORTED_MERCHANTS.amazon,
      ]
    }
    return [
      SUPPORTED_MERCHANTS.bigbasket,
      SUPPORTED_MERCHANTS.blinkit,
      SUPPORTED_MERCHANTS.zepto,
      SUPPORTED_MERCHANTS.swiggy_instamart,
      SUPPORTED_MERCHANTS.amazon,
    ]
  }

  if (category === 'Electronics') {
    return [
      SUPPORTED_MERCHANTS.amazon,
      SUPPORTED_MERCHANTS.croma,
      SUPPORTED_MERCHANTS.flipkart,
      SUPPORTED_MERCHANTS.reliancedigital,
      SUPPORTED_MERCHANTS.google_shopping,
    ]
  }

  if (category === 'Fashion & Lifestyle') {
    return [
      SUPPORTED_MERCHANTS.myntra,
      SUPPORTED_MERCHANTS.amazon,
      SUPPORTED_MERCHANTS.flipkart,
      SUPPORTED_MERCHANTS.google_shopping,
    ]
  }

  if (category === 'Healthcare & Wellness') {
    return [
      SUPPORTED_MERCHANTS.tata_1mg,
      SUPPORTED_MERCHANTS.amazon,
      SUPPORTED_MERCHANTS.blinkit,
      SUPPORTED_MERCHANTS.flipkart,
    ]
  }

  // Default General Ranking
  return [
    SUPPORTED_MERCHANTS.amazon,
    SUPPORTED_MERCHANTS.flipkart,
    SUPPORTED_MERCHANTS.croma,
    SUPPORTED_MERCHANTS.myntra,
    SUPPORTED_MERCHANTS.google_shopping,
    SUPPORTED_MERCHANTS.blinkit,
    SUPPORTED_MERCHANTS.bigbasket,
  ]
}
