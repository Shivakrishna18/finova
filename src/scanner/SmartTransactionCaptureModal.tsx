import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  Camera,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Calendar,
  Eye,
  Check,
  Store,
  Tag,
  CreditCard,
} from 'lucide-react'
import {
  useFinance,
  formatINR,
  type Transaction as ContextTransaction,
} from '../finance/FinanceContext'
import {
  validateImageFile,
  analyzeBillImage,
  PRESET_BILL_SAMPLES,
  FINOVA_CATEGORIES,
} from './billScannerService'
import type {
  ExtractedBillData,
  ConfidenceLevel,
  BillLineItem,
  SmartQuestion,
} from './billScannerTypes'

export type CaptureMode = 'scan_upload' | 'scan_camera' | 'manual'

interface SmartTransactionCaptureModalProps {
  initialMode?: CaptureMode
  close: () => void
  onSuccessNavigate?: (view: string) => void
}

export default function SmartTransactionCaptureModal({
  initialMode = 'scan_upload',
  close,
  onSuccessNavigate,
}: SmartTransactionCaptureModalProps) {
  const { state: finance, intelligence, addTransaction, evaluatePurchase } = useFinance()

  const [mode, setMode] = useState<CaptureMode>(initialMode)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [savedTransaction, setSavedTransaction] = useState<ContextTransaction | null>(null)

  // Camera stream states
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // File states
  const [_selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  // Extracted / Manual form data
  const [extractedData, setExtractedData] = useState<ExtractedBillData | null>(null)

  // Review / Edit Form Fields
  const [txType, setTxType] = useState<'Expense' | 'Income' | 'Transfer'>('Expense')
  const [merchantName, setMerchantName] = useState('')
  const [amount, setAmount] = useState<number>(0)
  const [category, setCategory] = useState('Food')
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<BillLineItem[]>([])
  const [isLineItemsExpanded, setIsLineItemsExpanded] = useState(false)
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false)

  // Field Confidence Statuses
  const [fieldConfidence, setFieldConfidence] = useState<{
    merchant: ConfidenceLevel
    amount: ConfidenceLevel
    date: ConfidenceLevel
    category: ConfidenceLevel
    paymentMethod: ConfidenceLevel
  }>({
    merchant: 'detected',
    amount: 'detected',
    date: 'detected',
    category: 'detected',
    paymentMethod: 'detected',
  })

  // Smart Questions pending
  const [smartQuestions, setSmartQuestions] = useState<SmartQuestion[]>([])
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({})

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }, [])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream()
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl, stopCameraStream])

  const startCameraStream = async () => {
    setCameraError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera video streaming is not supported by your browser. Use photo file capture below.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setIsCameraActive(true)
    } catch (err: any) {
      console.warn('Camera stream error:', err)
      setCameraError(
        'Unable to access camera directly. Please use "Choose / Capture Photo" to take a photo using your device camera.'
      )
      setIsCameraActive(false)
    }
  }

  const capturePhotoFromStream = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

    stopCameraStream()
    setImagePreviewUrl(dataUrl)
    processImageAnalysis(dataUrl)
  }

  const handleFileSelect = (file: File) => {
    setErrorMessage(null)
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid image file.')
      return
    }

    setSelectedFile(file)
    const preview = URL.createObjectURL(file)
    setImagePreviewUrl(preview)
    processImageAnalysis(file)
  }

  const handleSamplePresetSelect = (presetId: string) => {
    setErrorMessage(null)
    const preset = PRESET_BILL_SAMPLES.find(p => p.id === presetId)
    if (!preset) return

    setImagePreviewUrl(null)
    processImageAnalysis('sample', presetId)
  }

  const processImageAnalysis = async (fileOrUrl: File | string, presetId?: string) => {
    setIsAnalyzing(true)
    setAnalysisStep(0)

    // Simulate structured progress steps for transparent UX
    const timer1 = setTimeout(() => setAnalysisStep(1), 300)
    const timer2 = setTimeout(() => setAnalysisStep(2), 650)

    try {
      const result = await analyzeBillImage(fileOrUrl, presetId)

      setTimeout(() => {
        setIsAnalyzing(false)
        setExtractedData(result)

        // Populate fields
        setMerchantName(result.merchant)
        setAmount(result.totalAmount)
        setCategory(result.category)
        setDateStr(result.date)
        setPaymentMethod(result.paymentMethod || 'UPI')
        setNotes(result.notes || '')
        setLineItems(result.lineItems || [])
        setFieldConfidence(result.confidenceMap)
        setSmartQuestions(result.smartQuestions)
        setAnsweredQuestions({})
        setTxType('Expense')
      }, 950)
    } catch {
      clearTimeout(timer1)
      clearTimeout(timer2)
      setIsAnalyzing(false)
      setErrorMessage('Failed to analyze bill image. You can still enter details manually below.')
    }
  }

  const handleAnswerQuestion = (question: SmartQuestion, answer: string | number) => {
    if (question.field === 'merchant') {
      setMerchantName(String(answer))
      setFieldConfidence(prev => ({ ...prev, merchant: 'confirmed' }))
    } else if (question.field === 'amount') {
      setAmount(Number(answer))
      setFieldConfidence(prev => ({ ...prev, amount: 'confirmed' }))
    } else if (question.field === 'category') {
      setCategory(String(answer))
      setFieldConfidence(prev => ({ ...prev, category: 'confirmed' }))
    } else if (question.field === 'paymentMethod') {
      setPaymentMethod(String(answer))
      setFieldConfidence(prev => ({ ...prev, paymentMethod: 'confirmed' }))
    }

    setAnsweredQuestions(prev => ({ ...prev, [question.id]: true }))
  }

  const handleUpdateLineItem = (index: number, updated: Partial<BillLineItem>) => {
    setLineItems(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...updated }
      return copy
    })
  }

  const handleDeleteLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleAddLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: 'New Item',
        amount: 100,
        confidence: 'confirmed',
      },
    ])
  }

  const handleRemoveImage = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl)
    }
    setSelectedFile(null)
    setImagePreviewUrl(null)
    setExtractedData(null)
  }

  // Reactive financial impact calculation
  const financialImpact = useMemo(() => {
    const rawAmt = Number(amount) || 0
    const currentSafe = intelligence.liquidity.safeToSpend
    const safeAfter = Math.max(0, currentSafe - rawAmt)
    const safeDelta = currentSafe - safeAfter

    // Category budget evaluation
    const normCategory = category.trim().toLowerCase()
    const budgetEntry = Object.entries(finance.budgets).find(
      ([cat]) => cat.trim().toLowerCase() === normCategory
    )
    const categoryBudget = budgetEntry ? budgetEntry[1] : undefined

    const currentSpentInCategory = finance.transactions
      .filter(t => {
        if (t.category === 'Income') return false
        const tCat = t.category.trim().toLowerCase()
        return tCat === normCategory || tCat.includes(normCategory) || normCategory.includes(tCat)
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const newSpentInCategory = currentSpentInCategory + rawAmt
    const categoryUtilizationCurrent = categoryBudget
      ? Math.round((currentSpentInCategory / categoryBudget) * 100)
      : 0
    const categoryUtilizationNew = categoryBudget
      ? Math.round((newSpentInCategory / categoryBudget) * 100)
      : 0
    const categoryRemainingAfter = categoryBudget ? categoryBudget - newSpentInCategory : 0
    const isCategoryOverBudget = categoryBudget ? newSpentInCategory > categoryBudget : false

    // Decision & Goal impact
    const evaluation = evaluatePurchase({
      price: rawAmt,
      category,
      priority: 'Medium',
    })

    const projectedHealth = Math.max(
      40,
      finance.financialHealth - (rawAmt > currentSafe ? 4 : rawAmt > currentSafe * 0.5 ? 2 : 0)
    )

    return {
      currentSafeToSpend: currentSafe,
      newSafeToSpend: safeAfter,
      safeToSpendDelta: safeDelta,
      safeStatusTag: evaluation.statusTag,
      categoryName: category,
      currentCategorySpent: currentSpentInCategory,
      newCategorySpent: newSpentInCategory,
      categoryBudget,
      categoryBudgetRemaining: categoryRemainingAfter,
      categoryUtilizationCurrent,
      categoryUtilizationNew,
      isCategoryOverBudget,
      currentHealthScore: finance.financialHealth,
      projectedHealthScore: projectedHealth,
      goalImpactNote: evaluation.goalImpactText,
      explanation: evaluation.explanation,
    }
  }, [amount, category, intelligence, finance, evaluatePurchase])

  // Final Submission to Centralized FinanceContext
  const handleConfirmAndSave = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!merchantName.trim()) {
      setErrorMessage('Please provide a merchant or store name.')
      return
    }

    const numAmount = Number(amount)
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid positive amount (₹).')
      return
    }

    const newTx: ContextTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: merchantName.trim(),
      category: txType === 'Income' ? 'Income' : category,
      amount: numAmount,
      date: dateStr || 'Today',
    }

    // Call central FinanceContext addTransaction
    addTransaction(newTx)
    setSavedTransaction(newTx)
    setIsSuccess(true)
  }

  const handleResetForAnother = () => {
    setIsSuccess(false)
    setSavedTransaction(null)
    setExtractedData(null)
    setSelectedFile(null)
    setImagePreviewUrl(null)
    setMerchantName('')
    setAmount(0)
    setCategory('Food')
    setDateStr(new Date().toISOString().split('T')[0])
    setNotes('')
    setLineItems([])
    setMode('scan_upload')
  }

  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        className="modal smart-capture-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '94vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          borderRadius: '16px',
          background: '#FFFDF8',
          border: '1px solid var(--os-line)',
          boxShadow: '0 24px 60px rgba(63, 13, 18, 0.12)',
          color: '#211A17',
        }}
      >
        {/* Header with Title & Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span
              className="panel-kicker"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#98111E',
                letterSpacing: '0.08em',
                marginBottom: '4px',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              FINOVA INTELLIGENT TRANSACTION CAPTURE
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#211A17' }}>
              {isSuccess ? 'Transaction Recorded' : 'Capture & Review Bill'}
            </h2>
          </div>
          <button
            className="modal-close"
            onClick={close}
            aria-label="Close transaction capture"
            style={{
              background: '#F8F4EC',
              border: '1px solid var(--os-line)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#756A60',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* ========================================================
            SUCCESS STATE
           ======================================================== */}
        {isSuccess && savedTransaction ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '24px 16px',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4ade80',
              }}
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
                Transaction added to FINOVA OS
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                Financial intelligence matrix and decision twin updated.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                textAlign: 'left',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Merchant</span>
                <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{savedTransaction.name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Amount</span>
                <strong style={{ fontSize: '15px', color: '#38bdf8', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatINR(savedTransaction.amount)}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Category</span>
                <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{savedTransaction.category}</strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Date</span>
                <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{savedTransaction.date}</strong>
              </div>
            </div>

            {/* Post-Save Actions */}
            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="soft-button"
                style={{ flex: '1 1 140px', padding: '12px', background: 'rgba(82, 216, 255, 0.15)', borderColor: '#52d8ff', color: '#52d8ff' }}
                onClick={() => {
                  close()
                  if (onSuccessNavigate) {
                    onSuccessNavigate('Transactions')
                  } else {
                    window.dispatchEvent(new CustomEvent('finova-navigate', { detail: 'Transactions' }))
                  }
                }}
              >
                View in Transactions ↗
              </button>
              <button
                type="button"
                className="stage-item"
                style={{ flex: '1 1 140px', margin: 0, padding: '12px', textAlign: 'center' }}
                onClick={handleResetForAnother}
              >
                ＋ Scan Another Bill
              </button>
              <button
                type="button"
                style={{
                  flex: '1 1 90px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onClick={close}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ========================================================
                CAPTURE MODE TABS (Enter Manually, Take Photo, Upload Bill)
               ======================================================== */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                background: '#F8F4EC',
                border: '1px solid var(--os-line)',
                padding: '4px',
                borderRadius: '10px',
                marginBottom: '18px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  stopCameraStream()
                  setMode('scan_upload')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: mode === 'scan_upload' ? '1px solid rgba(152, 17, 30, 0.2)' : 0,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: mode === 'scan_upload' ? '#FFFDF8' : 'transparent',
                  color: mode === 'scan_upload' ? '#98111E' : '#756A60',
                  boxShadow: mode === 'scan_upload' ? '0 2px 8px rgba(63, 13, 18, 0.05)' : 'none',
                }}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Bill</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('scan_camera')
                  startCameraStream()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: mode === 'scan_camera' ? '1px solid rgba(152, 17, 30, 0.2)' : 0,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: mode === 'scan_camera' ? '#FFFDF8' : 'transparent',
                  color: mode === 'scan_camera' ? '#98111E' : '#756A60',
                  boxShadow: mode === 'scan_camera' ? '0 2px 8px rgba(63, 13, 18, 0.05)' : 'none',
                }}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraStream()
                  setMode('manual')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: mode === 'manual' ? '1px solid rgba(152, 17, 30, 0.2)' : 0,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  background: mode === 'manual' ? '#FFFDF8' : 'transparent',
                  color: mode === 'manual' ? '#98111E' : '#756A60',
                  boxShadow: mode === 'manual' ? '0 2px 8px rgba(63, 13, 18, 0.05)' : 'none',
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Manual Entry</span>
              </button>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                  color: '#fca5a5',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span style={{ flex: 1 }}>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  style={{ background: 'none', border: 0, color: '#fca5a5', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* ========================================================
                CAPTURE INTERFACES (UPLOAD / CAMERA / SAMPLES)
               ======================================================== */}
            {mode === 'scan_upload' && !extractedData && !isAnalyzing && (
              <div style={{ marginBottom: '20px' }}>
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={e => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setIsDragOver(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragOver ? '#98111E' : 'var(--os-line)'}`,
                    background: isDragOver ? 'rgba(152, 17, 30, 0.05)' : '#F8F4EC',
                    borderRadius: '14px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                    style={{ display: 'none' }}
                  />

                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(152, 17, 30, 0.08)',
                      border: '1px solid rgba(152, 17, 30, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px auto',
                      color: '#98111E',
                    }}
                  >
                    <Upload className="w-5 h-5" />
                  </div>

                  <strong style={{ display: 'block', fontSize: '14px', color: '#211A17', marginBottom: '4px' }}>
                    Drag and drop bill receipt, or click to browse
                  </strong>
                  <p style={{ fontSize: '12px', color: '#756A60', margin: '0 0 12px 0' }}>
                    Supports JPEG, PNG, WEBP, HEIC, and PDF bills up to 10MB.
                  </p>

                  <span
                    className="soft-button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      padding: '7px 16px',
                    }}
                  >
                    Choose Bill File ↗
                  </span>
                </div>

                {/* Quick 1-Click Test Receipts for Buildathon Judges & Users */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="panel-kicker" style={{ fontSize: '10px', color: '#98111E' }}>
                      FAST TEST PRESETS / 1-CLICK VERIFICATION
                    </span>
                    <span style={{ fontSize: '10px', color: '#756A60' }}>Authentic receipts</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '8px',
                    }}
                  >
                    {PRESET_BILL_SAMPLES.map(sample => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSamplePresetSelect(sample.id)}
                        className="stage-item"
                        style={{
                          margin: 0,
                          padding: '10px 12px',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          border: '1px solid var(--os-line)',
                          background: '#F8F4EC',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '12px', color: '#211A17' }}>{sample.title}</strong>
                        </div>
                        <small style={{ fontSize: '11px', color: '#98111E', fontFamily: "'DM Mono', monospace" }}>
                          {formatINR(sample.amount)} · {sample.category}
                        </small>
                        <span style={{ fontSize: '10px', color: '#756A60', marginTop: '2px' }}>
                          {sample.description.slice(0, 36)}...
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mode === 'scan_camera' && !extractedData && !isAnalyzing && (
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(82, 216, 255, 0.25)',
                    borderRadius: '14px',
                    padding: '16px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {isCameraActive ? (
                    <div>
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          maxHeight: '260px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#000',
                          marginBottom: '14px',
                        }}
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            background: 'rgba(0, 0, 0, 0.6)',
                            color: '#4ade80',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                          LIVE VIEWFINDER
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="soft-button"
                          onClick={capturePhotoFromStream}
                          style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                            color: '#fff',
                            border: 0,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Camera className="w-4 h-4" />
                          Snap &amp; Scan Bill ↗
                        </button>
                        <button
                          type="button"
                          onClick={stopCameraStream}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '10px 16px',
                            color: '#94a3b8',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Stop Camera
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'rgba(82, 216, 255, 0.1)',
                          border: '1px solid rgba(82, 216, 255, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px auto',
                          color: '#52d8ff',
                        }}
                      >
                        <Camera className="w-5 h-5" />
                      </div>

                      <strong style={{ display: 'block', fontSize: '14px', color: '#f8fafc', marginBottom: '4px' }}>
                        Use Camera Viewfinder or Native Camera
                      </strong>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0', maxWidth: '380px', marginInline: 'auto' }}>
                        Point your camera directly at the receipt in well-lit conditions.
                      </p>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="soft-button"
                          onClick={startCameraStream}
                          style={{ padding: '8px 18px', fontSize: '12px' }}
                        >
                          Start Live Camera ↗
                        </button>

                        <label
                          className="stage-item"
                          style={{
                            margin: 0,
                            padding: '8px 18px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                          }}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Device Camera Snap</span>
                          <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) handleFileSelect(file)
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                      {cameraError && (
                        <p style={{ fontSize: '11px', color: '#f87171', marginTop: '12px' }}>
                          {cameraError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================
                SCANNING / ANALYSIS STATE
               ======================================================== */}
            {isAnalyzing && (
              <div
                style={{
                  background: 'rgba(82, 216, 255, 0.05)',
                  border: '1px solid rgba(82, 216, 255, 0.3)',
                  borderRadius: '14px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Laser scan animation line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, #52d8ff, #a78bfa, transparent)',
                    boxShadow: '0 0 15px #52d8ff',
                    animation: 'pulse 1.2s infinite',
                  }}
                />

                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(82, 216, 255, 0.12)',
                    border: '1px solid rgba(82, 216, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: '#52d8ff',
                  }}
                >
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
                  Intelligent Bill Analysis in Progress...
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                  {analysisStep === 0
                    ? 'Extracting merchant headers, date & tax identifiers...'
                    : analysisStep === 1
                    ? 'Parsing line items, sub-totals & GST breakdown...'
                    : 'Mapping category intelligence & verifying confidence thresholds...'}
                </p>

                <div
                  style={{
                    width: '200px',
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                    margin: '0 auto',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(analysisStep + 1) * 33}%`,
                      background: 'linear-gradient(90deg, #52d8ff, #a78bfa)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* ========================================================
                CONFIRMATION & REVIEW SCREEN / MANUAL FORM
               ======================================================== */}
            {(!isAnalyzing && (extractedData || mode === 'manual')) && (
              <form onSubmit={handleConfirmAndSave}>
                {/* Review Header Banner if scanned */}
                {extractedData && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(34, 197, 94, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#4ade80',
                        }}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#f8fafc', display: 'block' }}>
                          Review transaction details
                        </strong>
                        <small style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Distinguishing detected fields vs user confirmations.
                        </small>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {imagePreviewUrl && (
                        <button
                          type="button"
                          onClick={() => setShowImagePreviewModal(!showImagePreviewModal)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            color: '#cbd5e1',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye className="w-3 h-3" />
                          {showImagePreviewModal ? 'Hide Image' : 'View Bill'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{
                          background: 'none',
                          border: 0,
                          color: '#94a3b8',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Replace / Rescan ↺
                      </button>
                    </div>
                  </div>
                )}

                {/* Optional Image Preview Dropdown / Card */}
                {showImagePreviewModal && imagePreviewUrl && (
                  <div
                    style={{
                      background: '#000',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      padding: '8px',
                      marginBottom: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <img
                      src={imagePreviewUrl}
                      alt="Bill receipt preview"
                      style={{
                        maxHeight: '180px',
                        maxWidth: '100%',
                        borderRadius: '6px',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                )}

                {/* ========================================================
                    SMART QUESTIONS SECTION (Concise & Context-Aware)
                   ======================================================== */}
                {smartQuestions.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(234, 179, 8, 0.06)',
                      border: '1px solid rgba(234, 179, 8, 0.25)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          color: '#fbbf24',
                        }}
                      >
                        SMART CLARIFICATIONS REQUIRED ({smartQuestions.filter(q => !answeredQuestions[q.id]).length} pending)
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {smartQuestions.map(q => {
                        const isAnswered = answeredQuestions[q.id]
                        return (
                          <div
                            key={q.id}
                            style={{
                              background: isAnswered ? 'rgba(34, 197, 94, 0.08)' : 'rgba(0, 0, 0, 0.2)',
                              border: `1px solid ${isAnswered ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                              borderRadius: '8px',
                              padding: '10px 12px',
                              fontSize: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <strong style={{ color: isAnswered ? '#86efac' : '#f8fafc' }}>{q.question}</strong>
                              {isAnswered && (
                                <span style={{ fontSize: '10px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <Check className="w-3 h-3" /> Confirmed
                                </span>
                              )}
                            </div>

                            {q.options && !isAnswered && (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                {q.options.map(opt => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleAnswerQuestion(q, opt)}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.08)',
                                      border: '1px solid rgba(255, 255, 255, 0.15)',
                                      borderRadius: '6px',
                                      padding: '4px 10px',
                                      fontSize: '11px',
                                      color: '#cbd5e1',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}

                            {!q.options && !isAnswered && (
                              <button
                                type="button"
                                onClick={() => handleAnswerQuestion(q, q.currentValue || '')}
                                style={{
                                  background: 'rgba(82, 216, 255, 0.15)',
                                  border: '1px solid rgba(82, 216, 255, 0.3)',
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  color: '#74d9ff',
                                  cursor: 'pointer',
                                  marginTop: '4px',
                                }}
                              >
                                Confirm as &ldquo;{q.currentValue}&rdquo; ✓
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ========================================================
                    PRIMARY TRANSACTION FIELDS (With Confidence Badges)
                   ======================================================== */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  {/* Transaction Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Transaction Type
                    </label>
                    <select
                      value={txType}
                      onChange={e => setTxType(e.target.value as any)}
                      className="modal-input"
                      style={{ width: '100%' }}
                    >
                      <option value="Expense">Expense (Payment)</option>
                      <option value="Income">Income (Deposit)</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  </div>

                  {/* Merchant / Store */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Merchant / Source</label>
                      <ConfidenceBadge
                        level={fieldConfidence.merchant}
                        onConfirm={() => setFieldConfidence(prev => ({ ...prev, merchant: 'confirmed' }))}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={merchantName}
                        onChange={e => {
                          setMerchantName(e.target.value)
                          setFieldConfidence(prev => ({ ...prev, merchant: 'confirmed' }))
                        }}
                        placeholder="Store or merchant name"
                        required
                        className="modal-input"
                        style={{ width: '100%', paddingLeft: '32px' }}
                      />
                      <Store className="w-3.5 h-3.5 text-slate-400" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Total Amount (₹ INR)</label>
                      <ConfidenceBadge
                        level={fieldConfidence.amount}
                        onConfirm={() => setFieldConfidence(prev => ({ ...prev, amount: 'confirmed' }))}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={amount || ''}
                        onChange={e => {
                          setAmount(Number(e.target.value))
                          setFieldConfidence(prev => ({ ...prev, amount: 'confirmed' }))
                        }}
                        placeholder="0"
                        required
                        className="modal-input"
                        style={{
                          width: '100%',
                          paddingLeft: '32px',
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontWeight: 700,
                          fontSize: '15px',
                          color: '#38bdf8',
                        }}
                      />
                      <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#38bdf8', fontWeight: 700 }}>
                        ₹
                      </span>
                    </div>
                  </div>

                  {/* Category with Budget Intelligence */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Category</label>
                      <ConfidenceBadge
                        level={fieldConfidence.category}
                        onConfirm={() => setFieldConfidence(prev => ({ ...prev, category: 'confirmed' }))}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={category}
                        onChange={e => {
                          setCategory(e.target.value)
                          setFieldConfidence(prev => ({ ...prev, category: 'confirmed' }))
                        }}
                        className="modal-input"
                        style={{ width: '100%', paddingLeft: '32px' }}
                      >
                        {FINOVA_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <Tag className="w-3.5 h-3.5 text-slate-400" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                    </div>

                    {/* Category Budget Context */}
                    {financialImpact.categoryBudget !== undefined && (
                      <div style={{ marginTop: '4px', fontSize: '11px' }}>
                        <span style={{ color: financialImpact.isCategoryOverBudget ? '#f87171' : '#38bdf8' }}>
                          {financialImpact.isCategoryOverBudget
                            ? `⚠️ Exceeds ${category} budget by ${formatINR(Math.abs(financialImpact.categoryBudgetRemaining))}`
                            : `✓ ${formatINR(financialImpact.categoryBudgetRemaining)} remaining in ${category} budget`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Date</label>
                      <ConfidenceBadge
                        level={fieldConfidence.date}
                        onConfirm={() => setFieldConfidence(prev => ({ ...prev, date: 'confirmed' }))}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="date"
                        value={dateStr}
                        onChange={e => {
                          setDateStr(e.target.value)
                          setFieldConfidence(prev => ({ ...prev, date: 'confirmed' }))
                        }}
                        className="modal-input"
                        style={{ width: '100%', paddingLeft: '32px' }}
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: '#94a3b8' }}>Payment Method</label>
                      <ConfidenceBadge
                        level={fieldConfidence.paymentMethod}
                        onConfirm={() => setFieldConfidence(prev => ({ ...prev, paymentMethod: 'confirmed' }))}
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={paymentMethod}
                        onChange={e => {
                          setPaymentMethod(e.target.value)
                          setFieldConfidence(prev => ({ ...prev, paymentMethod: 'confirmed' }))
                        }}
                        className="modal-input"
                        style={{ width: '100%', paddingLeft: '32px' }}
                      >
                        <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="Debit Card">Primary Debit Card</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Cash">Cash</option>
                      </select>
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                    </div>
                  </div>
                </div>

                {/* ========================================================
                    LINE ITEMS BREAKDOWN (Expandable & Editable)
                   ======================================================== */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => setIsLineItemsExpanded(!isLineItemsExpanded)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="panel-kicker" style={{ fontSize: '10px', margin: 0 }}>
                        ITEMIZED BILL BREAKDOWN ({lineItems.length} items)
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#52d8ff' }}>
                      {isLineItemsExpanded ? 'Collapse ▲' : 'Expand & Edit ▼'}
                    </span>
                  </div>

                  {isLineItemsExpanded && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {lineItems.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 90px 30px',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="text"
                            value={item.name}
                            onChange={e => handleUpdateLineItem(idx, { name: e.target.value })}
                            placeholder="Item name"
                            className="modal-input"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                          />
                          <input
                            type="number"
                            value={item.amount}
                            onChange={e => handleUpdateLineItem(idx, { amount: Number(e.target.value) })}
                            placeholder="Amount"
                            className="modal-input"
                            style={{
                              padding: '6px 10px',
                              fontSize: '12px',
                              fontFamily: "'IBM Plex Mono', monospace",
                              textAlign: 'right',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteLineItem(idx)}
                            style={{
                              background: 'transparent',
                              border: 0,
                              color: '#94a3b8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={handleAddLineItem}
                          style={{
                            background: 'rgba(82, 216, 255, 0.1)',
                            border: '1px solid rgba(82, 216, 255, 0.25)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            color: '#52d8ff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Plus className="w-3 h-3" /> Add Item
                        </button>
                        <small style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Subtotal of line items: {formatINR(lineItems.reduce((s, i) => s + (Number(i.amount) || 0), 0))}
                        </small>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional Notes */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Notes / Description
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Optional memo or tax invoice number"
                    className="modal-input"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* ========================================================
                    FINANCIAL IMPACT PREVIEW (Reactive Intelligence)
                   ======================================================== */}
                <div
                  style={{
                    background: '#F8F4EC',
                    border: '1px solid var(--os-line)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="panel-kicker" style={{ fontSize: '10px', color: '#98111E' }}>
                      PROJECTED FINANCIAL IMPACT
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          financialImpact.safeStatusTag === 'SAFE'
                            ? 'rgba(22, 101, 52, 0.12)'
                            : financialImpact.safeStatusTag === 'CONSIDER'
                            ? 'rgba(180, 83, 9, 0.12)'
                            : 'rgba(153, 27, 27, 0.12)',
                        color:
                          financialImpact.safeStatusTag === 'SAFE'
                            ? '#166534'
                            : financialImpact.safeStatusTag === 'CONSIDER'
                            ? '#b45309'
                            : '#991b1b',
                      }}
                    >
                      {financialImpact.safeStatusTag}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', fontSize: '12px' }}>
                    {/* Safe-to-Spend Delta */}
                    <div>
                      <span style={{ fontSize: '10px', color: '#756A60', display: 'block' }}>SAFE-TO-SPEND</span>
                      <strong style={{ color: '#211A17', fontFamily: "'DM Mono', monospace" }}>
                        {formatINR(financialImpact.currentSafeToSpend)} →{' '}
                        <span style={{ color: '#98111E' }}>{formatINR(financialImpact.newSafeToSpend)}</span>
                      </strong>
                    </div>

                    {/* Category Utilization Delta */}
                    <div>
                      <span style={{ fontSize: '10px', color: '#756A60', display: 'block' }}>
                        {category.toUpperCase()} BUDGET
                      </span>
                      <strong style={{ color: financialImpact.isCategoryOverBudget ? '#991b1b' : '#211A17' }}>
                        {financialImpact.categoryBudget !== undefined
                          ? `${financialImpact.categoryUtilizationCurrent}% → ${financialImpact.categoryUtilizationNew}%`
                          : 'No limit set'}
                      </strong>
                    </div>

                    {/* Goal Impact */}
                    <div>
                      <span style={{ fontSize: '10px', color: '#756A60', display: 'block' }}>GOAL IMPACT</span>
                      <strong style={{ color: '#211A17' }}>{financialImpact.goalImpactNote}</strong>
                    </div>
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={close}
                    style={{
                      background: '#FFFDF8',
                      border: '1px solid var(--os-line)',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      color: '#756A60',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="soft-button"
                    style={{
                      padding: '10px 24px',
                      background: '#98111E',
                      borderColor: '#98111E',
                      color: '#FFFDF8',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    Confirm &amp; Add Transaction ↗
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function ConfidenceBadge({
  level,
  onConfirm,
}: {
  level: ConfidenceLevel
  onConfirm: () => void
}) {
  if (level === 'confirmed') {
    return (
      <span
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: '#4ade80',
          background: 'rgba(34, 197, 94, 0.12)',
          padding: '2px 6px',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        ✓ User confirmed
      </span>
    )
  }

  if (level === 'detected') {
    return (
      <span
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: '#38bdf8',
          background: 'rgba(56, 189, 248, 0.12)',
          padding: '2px 6px',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        ● Detected
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onConfirm}
      style={{
        fontSize: '9px',
        fontWeight: 700,
        color: '#fbbf24',
        background: 'rgba(234, 179, 8, 0.15)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        padding: '2px 6px',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
      }}
    >
      ⚠️ Needs confirmation
    </button>
  )
}
