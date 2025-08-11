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
              h2: ((props) => (
                <h2 className="mb-2 text-lg font-bold text-gray-900" {...props} />
              )) as Components['h2'],
              h3: ((props) => (
                <h3 className="mb-2 mt-4 flex items-center gap-2 text-base font-semibold text-gray-900" {...props} />
              )) as Components['h3'],
              p: ((props) => (
                <p className="mb-3" {...props} />
              )) as Components['p'],
              ul: ((props) => (
                <ul className="mb-3 space-y-1 pl-0" {...props} />
              )) as Components['ul'],
              ol: ((props) => (
                <ol className="mb-3 list-decimal space-y-1 pl-5" {...props} />
              )) as Components['ol'],
              li: (({ children, ...rest }) => {
                const toText = (c: unknown): string => {
                  if (c == null) return ''
                  if (typeof c === 'string' || typeof c === 'number') return String(c)
                  if (Array.isArray(c)) return c.map(toText).join('')
                  // @ts-expect-error react node
                  return c?.props ? toText(c.props.children) : ''
                }
                const labelText = toText(children).trim().toLowerCase()
                const isSectionLabel = labelText.startsWith("what’s good") || labelText.startsWith("what's good") || labelText.startsWith('what to improve')
                if (isSectionLabel) {
                  return (
                    <li className="mb-2" {...rest}>
                      <div className="min-w-0">{children}</div>
                    </li>
                  )
                }
                return (
                  <li className="mb-1 flex items-start gap-2" {...rest}>
                    <span className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border border-[#8f2668]" />
                    <div className="min-w-0">{children}</div>
                  </li>
                )
              }) as Components['li'],
              strong: (({ children, ...props }) => {
                const toText = (c: unknown): string => {
                  if (c == null) return ''
                  if (typeof c === 'string' || typeof c === 'number') return String(c)
                  if (Array.isArray(c)) return c.map(toText).join('')
                  // @ts-expect-error react node
                  return c?.props ? toText(c.props.children) : ''
                }
                const label = toText(children).trim().toLowerCase()
                const isGood = label === "what’s good" || label === "what's good"
                const isImprove = label === 'what to improve'
                if (!isGood && !isImprove) {
                  return <strong className="font-semibold text-gray-900" {...props}>{children}</strong>
                }
                const icon = (
                  <span aria-hidden className="mr-2 inline-flex items-center justify-center text-[#8f2668]">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {isGood ? (
                        // Star outline
                        <path d="M12 17.27L6.18 20.5l1.64-6.99L2 8.9l7.09-.6L12 2l2.91 6.3L22 8.9l-5.82 4.61L17.82 20.5 12 17.27z" />
                      ) : (
                        // Gauge/speedometer outline
                        <>
                          <path d="M21 12a9 9 0 10-3.09 6.82" />
                          <path d="M12 12l7-3" />
                        </>
                      )}
                    </svg>
                  </span>
                )
                return (
                  <span className="inline-flex items-center font-semibold text-[#8f2668]" {...props}>
                    {icon}
                    <span>{children}</span>
                  </span>
                )
              }) as Components['strong'],
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
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <div className="text-center text-[13px] font-semibold uppercase tracking-wide text-gray-600">
              Recommended Exercises
            </div>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="pt-2">
            <div className="mx-auto flex w-full flex-col items-center gap-6 px-4 sm:px-6 py-4 sm:py-6 lg:py-8 overflow-x-hidden lg:flex-row lg:flex-nowrap lg:justify-center lg:px-10 xl:px-16">
              {exercises.map((ex, idx) => (
                <div key={`${ex.title}-${idx}`} className="w-[92%] max-w-[400px] sm:max-w-[440px] lg:w-[320px]">
                  <ExerciseCard
                    title={ex.title}
                    url={ex.url}
                    thumbnail={ex.thumbnail}
                    description={ex.description}
                    durationMinutes={ex.durationMinutes}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}

export default FeedbackResult
