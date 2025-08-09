export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced'

export type Exercise = {
  id: string
  title: string
  description?: string
  focusArea?: string
  tags: string[]
  level: ExerciseLevel
  url: string
  durationMinutes?: number
  thumbnail?: string
  /** True when source is marked as suitable for all levels */
  allLevels?: boolean
}


