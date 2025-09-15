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
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/30 shadow-xl">
      <div className="bg-gradient-to-r from-[#8f2668]/5 via-[#e5204c]/5 to-[#8f2668]/5 px-8 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#8f2668] to-[#e5204c]">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Analysis Complete</h2>
            <p className="text-sm text-gray-600">Here's your personalized feedback</p>
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <div className="max-w-none text-sm leading-7 text-gray-800">
        {markdown ? (
          <ReactMarkdown
            components={{
              h2: ((props) => (
                <h2 className="mb-4 text-xl font-bold text-gray-900 border-b border-gray-200 pb-2" {...props} />
              )) as Components['h2'],
              h3: ((props) => (
                <h3 className="mb-3 mt-6 flex items-center gap-2 text-lg font-semibold text-gray-900" {...props} />
              )) as Components['h3'],
              p: ((props) => (
                <p className="mb-4 leading-relaxed" {...props} />
              )) as Components['p'],
              ul: ((props) => (
                <ul className="mb-4 space-y-2 pl-0" {...props} />
              )) as Components['ul'],
              ol: ((props) => (
                <ol className="mb-4 list-decimal space-y-2 pl-6" {...props} />
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
                    <li className="mb-3" {...rest}>
                      <div className="min-w-0">{children}</div>
                    </li>
                  )
                }
                return (
                  <li className="mb-2 flex items-start gap-3" {...rest}>
                    <span className="mt-2 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-br from-[#8f2668] to-[#e5204c]" />
                    <div className="min-w-0 leading-relaxed">{children}</div>
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
                  <span aria-hidden className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#8f2668]/10 to-[#e5204c]/10 text-[#8f2668]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <span className="inline-flex items-center font-bold text-[#8f2668] text-lg" {...props}>
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
                  className="font-medium text-[#8f2668] hover:text-[#e5204c] underline decoration-2 underline-offset-2 transition-colors duration-200"
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
      </div>

      {exercises.length > 0 ? (
        <div className="border-t border-gray-100 bg-gradient-to-br from-gray-50/50 to-white">
          <div className="px-8 py-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#8f2668] to-[#e5204c]">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recommended Training</h3>
                <p className="text-sm text-gray-600">Continue improving with these targeted exercises</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {exercises.map((ex, idx) => (
                <div key={`${ex.title}-${idx}`} className="w-full">
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
        </div>
      ) : null}
    </section>
  )
}

export default FeedbackResult
