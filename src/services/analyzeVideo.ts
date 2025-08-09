import type { AnalysisResult } from '../types/analysis'
import type { Exercise } from '../types/exercise'
import { selectExercises } from './exerciseSelect'
import { analyzeWithGemini, getGeminiApiKey } from './gemini'

type AnalyzeOptions = {
  level?: 'beginner' | 'intermediate' | 'advanced'
  minDelayMs?: number
  maxDelayMs?: number
}

const DEFAULT_DELAY: [number, number] = [2000, 4000]

function inferTagsFromFileName(fileName: string): string[] {
  const name = fileName.toLowerCase()
  const candidates = ['passing', 'feint', 'footwork', 'shooting', 'defense']
  const hits = candidates.filter((t) => name.includes(t))
  if (hits.length > 0) return hits
  // fallback to a random but deterministic-like pick using length hash
  const idx = fileName.length % candidates.length
  return [candidates[idx]]
}

function generateExerciseRationale(exercise: Exercise, primaryTag: string | undefined, level?: 'beginner' | 'intermediate' | 'advanced'): string {
  const tag = primaryTag ?? exercise.tags[0]
  const focusByTag: Record<string, string[]> = {
    passing: [
      'emphasizes firm wrist snap and clear target hand',
      'builds timing with quick release under light pressure',
    ],
    footwork: [
      'sharpens low hips, quick feet, and balanced plant steps',
      'improves change-of-direction control and stops/starts',
    ],
    shooting: [
      'syncs arm speed with jump timing and follow-through',
      'focuses on elbow alignment and landing stability',
    ],
    defense: [
      'reinforces stance, distance control, and active hands',
      'trains lateral slides without crossing feet',
    ],
    feint: [
      'develops first-step explosion and body deception',
      'links eyes, hips, and ball to sell the move',
    ],
  }

  const variants = focusByTag[tag] ?? ['targets fundamentals with purposeful reps']
  const pick = variants[(exercise.id.length + (level ? level.length : 0)) % variants.length]
  return pick
}

function buildMarkdown(skillTags: string[], picked: Exercise[], overrides?: { positives?: string[]; improvements?: string[] }, level?: 'beginner' | 'intermediate' | 'advanced'): string {
  const focus = skillTags[0] ?? 'fundamentals'

  const textsByTag: Record<string, { good: string; improve: string }> = {
    passing: {
      good: 'Hands are ready and your release is steady; timing looks controlled.',
      improve: 'Snap the wrist and step through the pass to drive accuracy and pace.',
    },
    footwork: {
      good: 'Light feet and a stable base help you stay balanced.',
      improve: 'Lower the hips and clean up plant-foot timing to change direction faster.',
    },
    shooting: {
      good: 'Arm speed is promising and you finish with a clear follow-through.',
      improve: 'Align the elbow and sync jump timing for more power and control.',
    },
    defense: {
      good: 'Solid stance with active shuffle keeps you in front of the attacker.',
      improve: 'Manage distance and keep the hands active without fouling.',
    },
    feint: {
      good: 'You sell the initial move and commit to the direction change.',
      improve: 'Explode off the first step and use the eyes to disguise the intention.',
    },
  }

  const base = textsByTag[focus] ?? {
    good: 'Consistent effort and clear intent through the action.',
    improve: 'Tidy up alignment and timing for better efficiency and control.',
  }

  const goodText = (overrides?.positives && overrides.positives.length > 0)
    ? overrides.positives.slice(0, 3).join('; ')
    : base.good
  const improveText = (overrides?.improvements && overrides.improvements.length > 0)
    ? overrides.improvements.slice(0, 4).join('; ')
    : base.improve

  const lines: string[] = []
  lines.push('### Technical Feedback')
  lines.push(`- **What’s good**: ${goodText}`)
  lines.push(`- **What to improve**: ${improveText}`)
  lines.push('')
  lines.push('### Recommended Exercises')

  // Include 2–3 items matching the selected exercises
  const maxItems = Math.min(3, Math.max(2, picked.length))
  for (let i = 0; i < maxItems; i++) {
    const ex = picked[i]
    const rationale = generateExerciseRationale(ex, focus, level)
    lines.push(`${i + 1}. [${ex.title}](${ex.url}) — ${rationale}`)
  }

  return lines.join('\n')
}

export async function analyzeVideo(file: File, opts: AnalyzeOptions = {}): Promise<AnalysisResult> {
  const { level, minDelayMs = DEFAULT_DELAY[0], maxDelayMs = DEFAULT_DELAY[1] } = opts
  const apiKey = getGeminiApiKey()

  // Attempt Gemini first if key present (still respecting client-only constraints internally)
  const gemini = await analyzeWithGemini({ file, apiKey })
  if (gemini && gemini.isHandball === false && (gemini.confidence ?? 0.7) >= 0.8) {
    return {
      notHandball: true,
      message: 'The uploaded video does not appear to be related to handball. Please upload a handball training or match clip.',
    }
  }

  // Derive tags from Gemini actions if present, else use Gemini tags, else filename
  const actionToTag = (label: string): string | null => {
    switch (label) {
      case 'passing':
      case 'feint':
      case 'footwork':
      case 'shooting':
      case 'defense':
        return label
      case 'goalkeeper':
        return 'defense'
      case 'drill':
        return null
      default:
        return null
    }
  }

  const actionTags = gemini?.actions
    ? gemini.actions.map((a) => actionToTag(a.label)).filter((t): t is string => Boolean(t))
    : []

  const tags = actionTags.length > 0
    ? Array.from(new Set(actionTags)).slice(0, 3)
    : (gemini?.tags?.length ? gemini.tags : inferTagsFromFileName(file.name))
  // Infer focus area string from primary tag for better matching
  const focusMap: Record<string, string> = {
    passing: 'Passing',
    footwork: 'Footwork',
    shooting: 'Shooting',
    defense: 'Defense',
    feint: 'Feints',
  }
  const focusArea = focusMap[tags[0] ?? '']
  const exercises = selectExercises(tags, level, 3, focusArea)
  const markdown = buildMarkdown(
    tags,
    exercises,
    gemini
      ? { positives: gemini.positives, improvements: gemini.improvements }
      : undefined,
    level
  )

  const withRationale = exercises.map((ex) => ({
    title: ex.title,
    url: ex.url,
    thumbnail: ex.thumbnail,
    rationale: generateExerciseRationale(ex, tags[0], level),
    description: ex.description,
    durationMinutes: ex.durationMinutes,
  }))

  const delay = Math.floor(minDelayMs + Math.random() * Math.max(0, maxDelayMs - minDelayMs))
  await new Promise((res) => setTimeout(res, delay))

  return {
    markdown,
    exercises: withRationale,
    tags,
  }
}


