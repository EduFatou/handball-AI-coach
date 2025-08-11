import type { AnalysisResult } from '../types/analysis'
import type { Exercise } from '../types/exercise'
import { selectExercises } from './exerciseSelect'
import { analyzeWithGemini } from './gemini'

type AnalyzeOptions = {
  level?: 'beginner' | 'intermediate' | 'advanced'
  minDelayMs?: number
  maxDelayMs?: number
}

const DEFAULT_DELAY: [number, number] = [2000, 4000]

function inferTagsFromFileName(fileName: string): string[] {
  const name = fileName.toLowerCase()
  const candidates = ['passing', 'feint', 'footwork', 'shooting', 'defense', 'throwing', 'drill']
  const hits = candidates.filter((t) => name.includes(t))
  if (hits.length > 0) return hits
  // fallback to a random but deterministic-like pick using length hash
  const idx = fileName.length % candidates.length
  return [candidates[idx]]
}


function buildMarkdown(
  skillTags: string[],
  _picked: Exercise[],
  overrides?: { positives?: string[]; improvements?: string[] }
): string {
  const primary = skillTags[0] ?? 'fundamentals'
  const secondary = skillTags.find((t) => t && t !== primary)

  const textsByTag: Record<string, { good: [string, string]; improve: [string, string] }> = {
    passing: {
      good: [
        'Hands are ready and your release is steady; timing looks controlled.',
        'You stay balanced through the pass which keeps trajectory predictable.',
      ],
      improve: [
        'Snap the wrist and step through the pass to drive accuracy and pace.',
        'Add a clear target and finish the pass with fingers pointing to the receiver.',
      ],
    },
    throwing: {
      good: [
        'Arm path is compact with a clean wrist snap through release.',
        'You sequence hips–torso–arm well which preserves efficiency.',
      ],
      improve: [
        'Lead with the elbow and rotate the trunk to add power without forcing the shoulder.',
        'Plant the front foot firmly and keep the head stable through release.',
      ],
    },
    footwork: {
      good: [
        'Light feet and a stable base help you stay balanced.',
        'You keep short steps and active hips which support quick changes of direction.',
      ],
      improve: [
        'Lower the hips and clean up plant-foot timing to change direction faster.',
        'Keep the chest tall and avoid crossing the feet under pressure.',
      ],
    },
    shooting: {
      good: [
        'Arm speed is promising and you finish with a clear follow-through.',
        'Your plant step is consistent which supports repeatable mechanics.',
      ],
      improve: [
        'Align the elbow and sync jump timing for more power and control.',
        'Focus the eyes on a small target and hold the follow-through for a beat.',
      ],
    },
    defense: {
      good: [
        'Solid stance with active shuffle keeps you in front of the attacker.',
        'You angle the body well to show the attacker away from the middle.',
      ],
      improve: [
        'Manage distance and keep the hands active without fouling.',
        'React with the feet first and block with the chest, not the arms.',
      ],
    },
    feint: {
      good: [
        'You sell the initial move and commit to the direction change.',
        'Body lean and ball protection are coordinated which keeps the move safe.',
      ],
      improve: [
        'Explode off the first step and use the eyes to disguise the intention.',
        'Set up the feint with a clear tempo change to unbalance the defender.',
      ],
    },
    // Generic fallback for any other action-like secondary labels
    fundamentals: {
      good: [
        'Consistent effort and clear intent through the action.',
        'Control of balance and ball placement is improving steadily.',
      ],
      improve: [
        'Tidy up alignment and timing for better efficiency and control.',
        'Keep movements compact and repeatable before adding speed.',
      ],
    },
  }

  const labelize = (tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1)

  const primaryBase = textsByTag[primary] ?? textsByTag.fundamentals
  const secondaryBase = secondary ? (textsByTag[secondary] ?? textsByTag.fundamentals) : undefined

  function ensurePeriod(s: string): string {
    const t = s.trim()
    return /[.!?]$/.test(t) ? t : `${t}.`
  }

  function joinTwoSentences(sentences: string[], fallbackSecond?: string): string {
    const first = sentences[0] ? ensurePeriod(sentences[0]) : ''
    const secondRaw = sentences[1] ?? fallbackSecond ?? ''
    const second = secondRaw ? ensurePeriod(secondRaw) : ''
    return `${first} ${second}`.trim()
  }

  const goodPrimary = (overrides?.positives && overrides.positives.length > 0)
    ? joinTwoSentences(overrides.positives.slice(0, 2), textsByTag[primary]?.good?.[1])
    : joinTwoSentences(primaryBase.good)
  const improvePrimary = (overrides?.improvements && overrides.improvements.length > 0)
    ? joinTwoSentences(overrides.improvements.slice(0, 2), textsByTag[primary]?.improve?.[1])
    : joinTwoSentences(primaryBase.improve)

  const hasSecondary = Boolean(secondaryBase && secondary)
  const goodParts = hasSecondary
    ? [`${labelize(primary)}: ${goodPrimary}`]
    : [goodPrimary]
  const improveParts = hasSecondary
    ? [`${labelize(primary)}: ${improvePrimary}`]
    : [improvePrimary]

  if (hasSecondary && secondaryBase && secondary) {
    goodParts.push(`${labelize(secondary)}: ${joinTwoSentences(secondaryBase.good)}`)
    improveParts.push(`${labelize(secondary)}: ${joinTwoSentences(secondaryBase.improve)}`)
  }

  const title = secondary ? `${labelize(primary)} · ${labelize(secondary)}` : labelize(primary)
  const goodBullets = goodParts.map((p) => `  - ${p}`).join('\n')
  const improveBullets = improveParts.map((p) => `  - ${p}`).join('\n')
  return `## ${title}\n\n### Technical Feedback\n- **What’s good**:\n${goodBullets}\n- **What to improve**:\n${improveBullets}`
}

export async function analyzeVideo(file: File, opts: AnalyzeOptions = {}): Promise<AnalysisResult> {
  const { level: inputLevel, minDelayMs = DEFAULT_DELAY[0], maxDelayMs = DEFAULT_DELAY[1] } = opts

  // Attempt Gemini first if key present (still respecting client-only constraints internally)
  const gemini = await analyzeWithGemini({ file })
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
      case 'throwing':
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
    throwing: 'Throwing',
    footwork: 'Footwork',
    shooting: 'Shooting',
    defense: 'Defense',
    feint: 'Feints',
  }
  const focusArea = focusMap[tags[0] ?? '']
  // Infer level: prefer Gemini, else filename hints, else input
  const inferredLevelFromName = (() => {
    const n = file.name.toLowerCase()
    if (/(^|[^a-z])(beg|beginner|u9|u10|u11|u12)([^a-z]|$)/.test(n)) return 'beginner' as const
    if (/(^|[^a-z])(int|intermediate|u13|u14|u15)([^a-z]|$)/.test(n)) return 'intermediate' as const
    if (/(^|[^a-z])(adv|advanced|u16|u17|u18|u19)([^a-z]|$)/.test(n)) return 'advanced' as const
    return undefined
  })()
  const level = gemini?.level ?? inferredLevelFromName ?? inputLevel
  const exercises = selectExercises(tags, level, 3, focusArea)
  const markdown = buildMarkdown(
    tags,
    exercises,
    gemini
      ? { positives: gemini.positives, improvements: gemini.improvements }
      : undefined
  )

  const withRationale = exercises.map((ex) => ({
    title: ex.title,
    url: ex.url,
    thumbnail: ex.thumbnail,
    description: ex.description,
    durationMinutes: ex.durationMinutes,
  }))

  const delay = Math.floor(minDelayMs + Math.random() * Math.max(0, maxDelayMs - minDelayMs))
  await new Promise((res) => setTimeout(res, delay))

  const result: AnalysisResult = {
    markdown,
    exercises: withRationale,
    tags,
  }
  return result
}


