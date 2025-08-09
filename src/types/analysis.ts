
export type AnalysisExercise = {
  title: string
  url: string
  thumbnail?: string
  rationale?: string
  description?: string
  durationMinutes?: number
}

export type AnalysisResult =
  | {
      markdown: string
      exercises: AnalysisExercise[]
      tags: string[]
      notHandball?: false
    }
  | {
      notHandball: true
      message: string
    }


