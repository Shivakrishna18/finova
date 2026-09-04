export type ConfidenceLevel = 'detected' | 'needs_confirmation' | 'confirmed'

export interface BillLineItem {
  id: string
  name: string
  amount: number
  quantity?: number
  isTax?: boolean
  confidence: ConfidenceLevel
}

export interface SmartQuestion {
  id: string
  field: 'merchant' | 'amount' | 'date' | 'category' | 'paymentMethod' | 'purpose'
  question: string
  description?: string
  options?: string[]
  currentValue?: string | number
}

export interface ExtractedBillData {
  merchant: string
  totalAmount: number
  subtotalAmount?: number
  taxAmount?: number
  date: string
  category: string
  currency: string
  paymentMethod: string | null
  lineItems: BillLineItem[]
  notes: string
  confidenceMap: {
    merchant: ConfidenceLevel
    amount: ConfidenceLevel
    date: ConfidenceLevel
    category: ConfidenceLevel
    paymentMethod: ConfidenceLevel
  }
  smartQuestions: SmartQuestion[]
  rawDetectedText?: string
  imagePreviewUrl?: string
  fileName?: string
  fileSizeFormatted?: string
  analysisTimestamp: number
  isSamplePreset?: boolean
}

export interface PresetBillSample {
  id: string
  title: string
  subtitle: string
  merchant: string
  amount: number
  category: string
  paymentMethod: string
  date: string
  lineItems: Array<{ name: string; amount: number; isTax?: boolean }>
  description: string
  previewSvgUrl?: string
}

export interface FinancialImpactPreview {
  currentSafeToSpend: number
  newSafeToSpend: number
  safeToSpendDelta: number
  safeStatusTag: 'SAFE' | 'CONSIDER' | 'AVOID'
  categoryName: string
  currentCategorySpent: number
  newCategorySpent: number
  categoryBudget?: number
  categoryBudgetRemaining: number
  categoryUtilizationCurrent: number
  categoryUtilizationNew: number
  isCategoryOverBudget: boolean
  currentHealthScore: number
  projectedHealthScore: number
  goalImpactNote: string
}
