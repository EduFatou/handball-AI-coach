import { EXERCISES } from '../data/exercises'
import type { Exercise, ExerciseLevel } from '../types/exercise'

type SkillLevel = ExerciseLevel

const SELECT_LOG_PREFIX = '[exerciseSelect]'
function isDevMode(): boolean {
  const env = (import.meta as unknown as { env?: Record<string, unknown> }).env || {}
  return (env as { DEV?: boolean }).DEV === true || (env as { MODE?: string }).MODE !== 'production'
}
function logDebug(message: string, data?: unknown) {
  if (!isDevMode()) return
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`${SELECT_LOG_PREFIX} ${message}`, data)
  } else {
    // eslint-disable-next-line no-console
    console.log(`${SELECT_LOG_PREFIX} ${message}`)
  }
}

function levelCloseness(exerciseLevel: SkillLevel, desired?: SkillLevel): number {
  if (!desired) return 0
  const order = { beginner: 0, intermediate: 1, advanced: 2 } as const
  const diff = Math.abs(order[exerciseLevel] - order[desired])
  return diff === 0 ? 2 : diff === 1 ? 1 : 0
}

export type SelectionOptions = {
  tags: string[]
  focusArea?: string
  level?: SkillLevel
  count?: number
}

export function selectExercises(
  tags: string[],
  level?: SkillLevel,
  count = 3,
  focusArea?: string
): Exercise[] {
  logDebug('selectExercises input', { tags, level, count, focusArea })
  const fundamentals = ['passing', 'footwork', 'ball-handling', 'drill']
  const effectiveTags = tags.length > 0 ? tags.map((t) => t.toLowerCase()) : fundamentals
  const normalizedFocus = focusArea?.toLowerCase()

  const scored = EXERCISES.map((exercise) => {
    const tagOverlap = exercise.tags.reduce(
      (sum, tag) => (effectiveTags.includes(tag) ? sum + 1 : sum),
      0
    )
    const focusBonus = normalizedFocus && exercise.focusArea
      ? (exercise.focusArea.toLowerCase().includes(normalizedFocus) ? 2 : 0)
      : 0
    const closeness = levelCloseness(exercise.level, level) + (exercise.allLevels ? 1 : 0)
    // Score weighting: tags (primary), focus bonus (mid), level (secondary)
    const score = tagOverlap * 10 + focusBonus * 5 + closeness
    return { exercise, tagOverlap, focusBonus, closeness, score }
  })

  // Sort by total score desc, then tag overlap, then closeness, then title
  scored.sort((a, b) =>
    b.score - a.score ||
    b.tagOverlap - a.tagOverlap ||
    b.closeness - a.closeness ||
    a.exercise.title.localeCompare(b.exercise.title)
  )
  logDebug('Scored candidates (top 5)', scored.slice(0, 5).map((s) => ({
    id: s.exercise.id,
    title: s.exercise.title,
    score: s.score,
    tagOverlap: s.tagOverlap,
    focusBonus: s.focusBonus,
    closeness: s.closeness,
  })))

  const max = Math.min(3, count)
  let picked = scored.filter((s) => s.tagOverlap > 0 || s.focusBonus > 0).slice(0, max).map((s) => s.exercise)
  logDebug('Initial picked', picked.map((e) => ({ id: e.id, title: e.title })))

  if (picked.length < Math.min(2, max) && tags.length > 0) {
    logDebug('Insufficient matches, using fundamentals fallback')
    const fallback = EXERCISES.map((exercise) => {
      const tagOverlap = exercise.tags.reduce(
        (sum, tag) => (fundamentals.includes(tag) ? sum + 1 : sum),
        0
      )
      const closeness = levelCloseness(exercise.level, level)
      const score = tagOverlap * 10 + closeness
      return { exercise, tagOverlap, closeness, score }
    })
      .sort((a, b) => b.score - a.score || a.exercise.title.localeCompare(b.exercise.title))
      .slice(0, max)
      .map((s) => s.exercise)

    const seen = new Set(picked.map((e) => e.id))
    for (const ex of fallback) {
      if (picked.length >= max) break
      if (!seen.has(ex.id)) {
        picked.push(ex)
      }
    }
    logDebug('After fallback picked', picked.map((e) => ({ id: e.id, title: e.title })))
  }

  if (picked.length === 0) {
    logDebug('No matches at all, picking by level closeness')
    picked = scored
      .sort((a, b) => b.closeness - a.closeness || a.exercise.title.localeCompare(b.exercise.title))
      .slice(0, max)
      .map((s) => s.exercise)
    logDebug('Level-closest picked', picked.map((e) => ({ id: e.id, title: e.title })))
  }

  // Encourage diversity by primary tag: keep first occurrence per top tag when possible
  const seenTag = new Set<string>()
  const diverse: Exercise[] = []
  for (const ex of picked) {
    const primary = ex.tags[0]
    if (!primary || !seenTag.has(primary) || diverse.length < 2) {
      diverse.push(ex)
      if (primary) seenTag.add(primary)
    }
    if (diverse.length >= max) break
  }
  logDebug('Diverse final selection', diverse.map((e) => ({ id: e.id, title: e.title, primaryTag: e.tags[0] })))

  return diverse.slice(0, max)
}
