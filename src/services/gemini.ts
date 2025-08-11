// Minimal Gemini client wrapper with graceful no-op if key is missing.

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
}

export async function analyzeWithGemini({ file }: AnalyzeParams): Promise<GeminiAnalysis | null> {
  const allowExternal = (import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_ALLOW_EXTERNAL_ANALYSIS === 'true'
  if (!allowExternal) return null

  try {
    const previews = await extractPreviewDataUrls(file)
    if (!previews || previews.length === 0) return null
    const res = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ frames: previews }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as unknown
    // Basic shape check
    if (data && typeof (data as { isHandball?: unknown }).isHandball === 'boolean') {
      return data as GeminiAnalysis
    }
    return null
  } catch {
    return null
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

export function getGeminiApiKey(): string | undefined {
  // keep for backward-compat in local dev only.
  const key = (import.meta as unknown as { env?: Record<string, unknown> }).env?.VITE_GEMINI_API_KEY as string | undefined
  return key && key.trim().length > 0 ? key : undefined
}


