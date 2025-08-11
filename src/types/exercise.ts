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
  allLevels?: boolean
}


