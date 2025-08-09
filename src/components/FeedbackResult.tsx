export type FeedbackExercise = {
  title: string
  url: string
  thumbnail?: string
  rationale?: string
  description?: string
  durationMinutes?: number
}

export type FeedbackResultProps = {
  markdown?: string
  exercises?: FeedbackExercise[]
}

import ExerciseCard from './ExerciseCard'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

function FeedbackResult({ markdown, exercises = [] }: FeedbackResultProps) {
  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="prose prose-sm max-w-none">
        {markdown ? (
          <ReactMarkdown
            components={{
              a: (({ href, children, ...rest }) => (
                <a href={href} {...rest} target="_blank" rel="noreferrer">
                  {children}
                </a>
              )) as Components['a'],
            }}
          >
            {markdown}
          </ReactMarkdown>
        ) : (
          <p className="text-sm text-gray-600">FeedbackResult component stub</p>
        )}
      </div>

      {exercises.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {exercises.map((ex, idx) => (
            <ExerciseCard
              key={`${ex.title}-${idx}`}
              title={ex.title}
              url={ex.url}
              thumbnail={ex.thumbnail}
              rationale={ex.rationale}
              description={ex.description}
              durationMinutes={ex.durationMinutes}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default FeedbackResult
