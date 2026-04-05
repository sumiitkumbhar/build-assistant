// lib/geminiRag.ts (or inside your route file)
import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

export type RagChunk = {
  id: string          // e.g. doc id or chunk id
  source?: string     // filename / contract name / etc.
  text: string
}

export async function callGeminiRag(params: {
  question: string
  chunks: RagChunk[]
  mode?: 'land' | 'contract'
}) {
  const { question, chunks, mode = 'land' } = params

  const contextText = chunks
    .map((c, i) => {
      const tag = c.id || `doc${i + 1}`
      const src = c.source ? ` (source: ${c.source})` : ''
      return `[${tag}]${src}\n${c.text}`
    })
    .join('\n\n---\n\n')

  const domainInstruction =
    mode === 'contract'
      ? 'You are an expert contract and risk analysis assistant for real estate and construction contracts in India.'
      : 'You are an expert land feasibility and due diligence assistant for real estate and urban development in India.'

  const prompt = `
SYSTEM:
${domainInstruction}
Use ONLY the information in the CONTEXT below.
If the answer is not clearly supported by the context, say you don't know.
Always provide concise, structured answers with headings and bullet points.
After any important statement, add square-bracket citations referring to the chunk ids like [doc123] or [chunk-7].

CONTEXT:
${contextText}

QUESTION:
${question}

RESPONSE FORMAT:
- Start with a brief 2–4 line summary.
- Then provide section-wise analysis with headings.
- For each key point, add citations like [doc1], [policy-07], etc.
- If information is missing or unclear, explicitly say so.
`

  const result = await geminiModel.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  })

  const response = result.response.text()
  return {
    answer: response,
    usedChunkIds: chunks.map((c) => c.id),
  }
}
