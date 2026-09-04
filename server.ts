import express from 'express'
import path from 'path'
import { createServer as createViteServer } from 'vite'
import { GoogleGenAI } from '@google/genai'

const app = express()
const PORT = 3000

app.use(express.json({ limit: '2mb' }))

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return null
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  }
  return geminiClient
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  })
})

// AI Advisor Endpoint grounded in deterministic financial facts
app.post('/api/advisor/chat', async (req, res) => {
  try {
    const { prompt, intelligence, state, conversationHistory } = req.body

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required and must be a string.' })
      return
    }

    const ai = getGeminiClient()

    // If no API key is set, signal the client to use deterministic local engine
    if (!ai) {
      res.json({
        available: false,
        message: 'No GEMINI_API_KEY detected. Using deterministic fallback engine.',
        answer: null,
      })
      return
    }

    // Build context summary from deterministic facts
    const safeToSpend = intelligence?.liquidity?.safeToSpend ?? state?.safeToSpend ?? 0
    const balance = intelligence?.liquidity?.balance ?? state?.balance ?? 0
    const income = intelligence?.cashFlow?.monthlyIncome ?? state?.income ?? 0
    const spending = intelligence?.cashFlow?.monthlySpending ?? state?.monthlySpending ?? 0
    const surplus = intelligence?.cashFlow?.monthlySurplus ?? 0
    const healthScore = intelligence?.health?.score ?? state?.financialHealth ?? 0
    const healthLevel = intelligence?.health?.level ?? 'MODERATE'

    const goalsSummary = (state?.goals || [])
      .map((g: any) => `${g.name}: saved ₹${g.saved.toLocaleString('en-IN')} of ₹${g.target.toLocaleString('en-IN')} (${Math.round((g.saved / Math.max(1, g.target)) * 100)}%)`)
      .join('; ')

    const commitmentsSummary = (state?.commitments || [])
      .map((c: any) => `${c.name}: ₹${c.amount.toLocaleString('en-IN')} (${c.type})`)
      .join('; ')

    const systemInstruction = `You are FINOVA AI, an intelligent personal financial operating system advisor.
You advise the user on their money, spending decisions, budget health, savings, and goal protection.

CRITICAL DIRECTIVE:
You are grounded in a real deterministic financial intelligence engine. You MUST rely strictly on the provided financial facts below and NEVER invent different core numbers:
- Active Account Balance: ₹${balance.toLocaleString('en-IN')}
- Safe-to-Spend Limit: ₹${safeToSpend.toLocaleString('en-IN')}
- Monthly Income: ₹${income.toLocaleString('en-IN')}
- Monthly Spending: ₹${spending.toLocaleString('en-IN')}
- Monthly Surplus: ₹${surplus.toLocaleString('en-IN')}
- Financial Health Score: ${healthScore} / 100 (${healthLevel})
- Active Goals: ${goalsSummary || 'None'}
- Monthly Commitments: ${commitmentsSummary || 'None'}

TONE & STYLE:
- Objective, clear, analytical, empowering, and polite.
- Avoid vague buzzwords or generic platitudes.
- Reference exact currency values in INR (₹) as provided.
- Explain trade-offs clearly (e.g. how a choice impacts safe-to-spend or shifts goal target dates).
- Keep answers concise (2 to 4 sentences or bullet points where appropriate).`

    const contents: any[] = []

    if (Array.isArray(conversationHistory)) {
      for (const turn of conversationHistory.slice(-4)) {
        if (turn.from === 'YOU' || turn.from === 'USER' || turn.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: turn.text || turn.content }] })
        } else if (turn.from === 'FINOVA' || turn.role === 'model' || turn.role === 'assistant') {
          contents.push({ role: 'model', parts: [{ text: turn.text || turn.content }] })
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: prompt }] })

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    })

    const answer = response.text || 'Unable to generate response.'

    res.json({
      available: true,
      answer,
      grounded: true,
      model: 'gemini-3.7-flash',
    })
  } catch (error: any) {
    console.error('Gemini advisor error:', error)
    res.status(500).json({
      error: 'Failed to process AI advisor request',
      details: error?.message || String(error),
      fallbackAvailable: true,
    })
  }
})

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    // Express v5 uses *all for wildcard routing
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FINOVA Server running on http://0.0.0.0:${PORT}`)
  })
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
