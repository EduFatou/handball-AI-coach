// Minimal Gemini client wrapper with graceful no-op if key is missing.
// Client-only prototype: we do not upload files to external services without explicit user config.

export type ActionLabel = 'passing' | 'feint' | 'footwork' | 'shooting' | 'defense' | 'goalkeeper' | 'drill' | 'throwing'

export type GeminiAnalysis = {
  isHandball: boolean
  tags: string[]
  positives: string[]
  improvements: string[]
  confidence?: number
  level?: 'beginner' | 'intermediate' | 'advanced'
  actions?: Array<{
    label: ActionLabel
    confidence: number
  }>
}

type AnalyzeParams = {
  file: File
  apiKey?: string
  model?: string
  timeoutMs?: number
}

const DEFAULT_MODEL = 'gemini-2.0-flash'

const GEMINI_LOG_PREFIX = '[gemini]'
function isDevMode(): boolean {
  const env = (import.meta as unknown as { env?: Record<string, unknown> }).env || {}
  return (env as { DEV?: boolean }).DEV === true || (env as { MODE?: string }).MODE !== 'production'
}
function logDebug(message: string, data?: unknown) {
  if (!isDevMode()) return
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`${GEMINI_LOG_PREFIX} ${message}`, data)
  } else {
    // eslint-disable-next-line no-console
    console.log(`${GEMINI_LOG_PREFIX} ${message}`)
  }
}

export async function analyzeWithGemini({ file, apiKey = getGeminiApiKey(), model = DEFAULT_MODEL }: AnalyzeParams): Promise<GeminiAnalysis | null> {
  const allowExternal = (import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_ALLOW_EXTERNAL_ANALYSIS === 'true'
  if (!apiKey || !allowExternal) {
    logDebug('External analysis disabled', { hasApiKey: Boolean(apiKey), allowExternal })
    return null
  }

  try {
    // Lazy import to keep bundle smaller when unused
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    // Extract multiple preview frames to improve classification robustness
    const previews = await extractPreviewDataUrls(file)
    if (!previews || previews.length === 0) return null
    logDebug('Preview frames extracted', { count: previews.length })

    const client = new GoogleGenerativeAI(apiKey)
    const genModel = client.getGenerativeModel({ model })
  const prompt = `You are a handball coach analyzing short video frames. Focus on player movement mechanics (body position, footwork, timing, ball control, follow-through, throwing mechanics).
Tasks:
1) Decide if the scene is handball (court markings, goals, ball, or players doing handball actions).
2) Identify the primary action(s) observed from this set (use these exact labels): [passing, feint, footwork, shooting, defense, goalkeeper, drill, throwing].
3) Estimate the skill level: one of [beginner, intermediate, advanced].
4) Provide exactly 2 concise positives (what the movement does well) and exactly 2 concise improvements (failures/errors to address). Keep each item to a single sentence.
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
}
Guidance: Keep phrases short, movement-specific (feet, hips, hands, timing, release), and avoid jargon.`

    // Provide the image as inline data
    const imageParts = previews.map((p) => dataUrlToGenerativePart(p))
    const result = await genModel.generateContent([
      { text: prompt },
      ...imageParts,
    ])
    const text = result.response.text()
    logDebug('Raw Gemini response text (truncated)', text.slice(0, 200))
    const parsed = safeParseGeminiJson(text)
    if (!parsed) return null
    logDebug('Parsed Gemini JSON', {
      isHandball: parsed.isHandball,
      tags: parsed.tags,
      actions: parsed.actions?.map((a) => ({ label: a.label, confidence: a.confidence })),
      positivesCount: parsed.positives?.length ?? 0,
      improvementsCount: parsed.improvements?.length ?? 0,
    })
    return parsed
  } catch {
    logDebug('Gemini call failed; returning null')
    return null
  }
}

type GenerativePart = { inlineData: { data: string; mimeType: string } }

function dataUrlToGenerativePart(dataUrl: string): GenerativePart {
  const [meta, b64] = dataUrl.split(',')
  const match = /data:(.*?);base64/.exec(meta || '')
  const mimeType = match?.[1] || 'image/jpeg'
  return {
    inlineData: {
      data: b64,
      mimeType,
    },
  }
}

async function extractPreviewDataUrls(file: File): Promise<string[] | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = url
    video.crossOrigin = 'anonymous'

    const cleanup = () => URL.revokeObjectURL(url)

    const captureAt = (time: number, canvas: HTMLCanvasElement): Promise<string | null> => {
      return new Promise((res) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked)
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null
          if (!ctx) return res(null)
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            res(canvas.toDataURL('image/jpeg', 0.8))
          } catch {
            res(null)
          }
        }
        video.addEventListener('seeked', onSeeked)
        try {
          video.currentTime = Math.min(Math.max(time, 0), Math.max(video.duration - 0.1, 0))
        } catch {
          video.removeEventListener('seeked', onSeeked)
          res(null)
        }
      })
    }

    video.addEventListener('loadeddata', async () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360

        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 2.0
        const times: number[] = duration >= 2.5
          ? [0.2, 1.2, duration - 0.2]
          : duration >= 1.2
          ? [0.2, Math.min(1.0, duration - 0.1)]
          : [Math.min(0.1, duration), Math.min(0.5, duration)]

        const frames: string[] = []
        for (const t of times) {
          const shot = await captureAt(t, canvas)
          if (shot) frames.push(shot)
          if (frames.length >= 3) break
        }
        cleanup()
        resolve(frames)
      } catch {
        cleanup()
        resolve(null)
      }
    })
    video.addEventListener('error', () => {
      cleanup()
      resolve(null)
    })
  })
}

function safeParseGeminiJson(text: string): GeminiAnalysis | null {
  try {
    // Attempt to extract first JSON object from the text
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
    const ensureTwoSentences = (arr: unknown, max = 2): string[] => {
      const items = Array.isArray(arr) ? (arr as unknown[]).map((x) => String(x)).filter(Boolean) : []
      const out: string[] = []
      for (const raw of items) {
        if (out.length >= max) break
        // Split by sentence enders to coerce one sentence per item if needed
        const parts = String(raw)
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
        if (parts.length > 0) {
          out.push(parts[0].endsWith('.') || parts[0].endsWith('!') || parts[0].endsWith('?') ? parts[0] : `${parts[0]}.`)
        }
      }
      return out.slice(0, max)
    }

    return {
      isHandball: raw.isHandball as boolean,
      tags: (raw.tags as string[]).filter(Boolean).slice(0, 3),
      positives: ensureTwoSentences((raw as { positives?: unknown }).positives, 2),
      improvements: ensureTwoSentences((raw as { improvements?: unknown }).improvements, 2),
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

export function getGeminiApiKey(): string | undefined {
  // Vite exposes env via import.meta.env at build-time.
  const key = (import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_GEMINI_API_KEY as string | undefined
  return key && key.trim().length > 0 ? key : undefined
}


