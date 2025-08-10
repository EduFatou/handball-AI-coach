export type FeedbackExercise = {
  title: string
  url: string
  thumbnail?: string
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
      <div className="max-w-none text-sm leading-6 text-gray-800">
        {markdown ? (
          <ReactMarkdown
            components={{
              h2: (({ node, ...props }) => (
                <h2 className="mb-2 text-lg font-bold text-gray-900" {...props} />
              )) as Components['h2'],
              h3: (({ node, ...props }) => (
                <h3 className="mb-2 text-base font-semibold text-gray-900" {...props} />
              )) as Components['h3'],
              p: (({ node, ...props }) => (
                <p className="mb-3" {...props} />
              )) as Components['p'],
              ul: (({ node, ...props }) => (
                <ul className="mb-3 list-disc space-y-1 pl-5" {...props} />
              )) as Components['ul'],
              ol: (({ node, ...props }) => (
                <ol className="mb-3 list-decimal space-y-1 pl-5" {...props} />
              )) as Components['ol'],
              li: (({ node, ...props }) => (
                <li className="mb-1" {...props} />
              )) as Components['li'],
              strong: (({ node, ...props }) => (
                <strong className="font-semibold text-gray-900" {...props} />
              )) as Components['strong'],
              a: (({ href, children, ...rest }) => (
                <a
                  href={href}
                  {...rest}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-blue-500 decoration-2 underline-offset-2 hover:text-blue-700 hover:decoration-blue-700"
                >
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
        <>
          <div className="my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <div className="text-center text-[13px] font-semibold uppercase tracking-wide text-gray-600">
              Recommended Exercises
            </div>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {exercises.map((ex, idx) => (
              <ExerciseCard
                key={`${ex.title}-${idx}`}
                title={ex.title}
                url={ex.url}
                thumbnail={ex.thumbnail}
                description={ex.description}
                durationMinutes={ex.durationMinutes}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

export default FeedbackResult
