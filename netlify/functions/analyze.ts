/* eslint-env node */
import type { Handler } from '@netlify/functions'
import { GoogleGenerativeAI } from '@google/generative-ai'

type ActionLabel = 'passing' | 'feint' | 'footwork' | 'shooting' | 'defense' | 'goalkeeper' | 'drill' | 'throwing'

type GeminiAnalysis = {
  isHandball: boolean
  tags: string[]
  positives: string[]
  improvements: string[]
  confidence?: number
  level?: 'beginner' | 'intermediate' | 'advanced'
  actions?: Array<{ label: ActionLabel; confidence: number }>
}

function safeParseGeminiJson(text: string): GeminiAnalysis | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    if (typeof raw.isHandball !== 'boolean' || !Array.isArray(raw.tags)) return null
    const allowed = new Set<ActionLabel>(['passing', 'feint', 'footwork', 'shooting', 'defense', 'goalkeeper', 'drill', 'throwing'])
    const allowedLevels = new Set(['beginner', 'intermediate', 'advanced'])
    const actions: GeminiAnalysis['actions'] = Array.isArray(raw.actions)
      ? (raw.actions as Array<Record<string, unknown>>)
          .map((a) => {
            const label = String(a.label || '') as ActionLabel
            const confidence = typeof a.confidence === 'number' ? a.confidence : 0.5
            return allowed.has(label) ? { label, confidence } : null
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
          .slice(0, 3)
      : []
    const ensureThreeSentences = (arr: unknown, max = 3): string[] => {
      const items = Array.isArray(arr) ? (arr as unknown[]).map((x) => String(x)).filter(Boolean) : []
      const out: string[] = []
      for (const r of items) {
        if (out.length >= max) break
        const parts = String(r)
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
        if (parts.length > 0) {
          out.push(parts[0].match(/[.!?]$/) ? parts[0] : `${parts[0]}.`)
        }
      }
      return out.slice(0, max)
    }
    return {
      isHandball: raw.isHandball as boolean,
      tags: (raw.tags as string[]).filter(Boolean).slice(0, 3),
      positives: ensureThreeSentences((raw as { positives?: unknown }).positives, 3),
      improvements: ensureThreeSentences((raw as { improvements?: unknown }).improvements, 3),
      confidence: typeof (raw as { confidence?: unknown }).confidence === 'number' ? (raw as { confidence?: number }).confidence : undefined,
      level: typeof (raw as { level?: unknown }).level === 'string' && allowedLevels.has(String((raw as { level?: unknown }).level))
        ? (raw as { level?: 'beginner' | 'intermediate' | 'advanced' }).level
        : undefined,
      actions,
    }
  } catch {
    return null
  }
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' }
    }
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: 'Server missing GEMINI_API_KEY' }
    }
    const body = JSON.parse(event.body || '{}') as { frames?: string[]; model?: string }
    const frames = Array.isArray(body.frames) ? body.frames.filter(Boolean) : []
    if (frames.length === 0) {
      return { statusCode: 400, body: 'No frames provided' }
    }
    const client = new GoogleGenerativeAI(apiKey)
    const modelId = body.model || 'gemini-2.0-flash'
    const genModel = client.getGenerativeModel({ model: modelId })
    const prompt = `You are a handball coach analyzing short video frames. Focus on player movement mechanics (body position, footwork, timing, ball control, follow-through, throwing mechanics).
Tasks:
1) Decide if the scene is handball (court markings, goals, ball, or players doing handball actions).
2) Identify the primary action(s) observed from this set (use these exact labels): [passing, feint, footwork, shooting, defense, goalkeeper, drill, throwing].
3) Estimate the skill level: one of [beginner, intermediate, advanced].
4) Provide exactly 3 concise positives and exactly 3 concise improvements. One sentence each.
5) If handball, also include up to 2-3 skill tags from [passing, feint, footwork, shooting, defense, throwing].
Return STRICT JSON only:
{
  "isHandball": boolean,
  "confidence": number,
  "level": "beginner|intermediate|advanced",
  "actions": [{ "label": "passing|feint|footwork|shooting|defense|goalkeeper|drill|throwing", "confidence": number }],
  "tags": string[],
  "positives": string[],
  "improvements": string[]
}`
    const parts = frames.map((dataUrl) => {
      const [meta, b64] = String(dataUrl || '').split(',')
      const mimeMatch = /data:(.*?);base64/.exec(meta || '')
      const mimeType = mimeMatch?.[1] || 'image/jpeg'
      const data = b64 || dataUrl
      return { inlineData: { data, mimeType } }
    })
    const result = await genModel.generateContent([{ text: prompt }, ...parts])
    const text = result.response.text()
    const parsed = safeParseGeminiJson(text)
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed),
    }
  } catch (err) {
    return { statusCode: 500, body: 'Analysis failed' }
  }
}

export default handler


