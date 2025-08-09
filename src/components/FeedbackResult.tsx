export type FeedbackExercise = {
  title: string
  url: string
  thumbnail?: string
  rationale?: string
}

export type FeedbackResultProps = {
  markdown?: string
  exercises?: FeedbackExercise[]
}

function FeedbackResult({ markdown, exercises = [] }: FeedbackResultProps) {
  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="prose prose-sm max-w-none">
        {markdown ? (
          <div>
            <p className="m-0 text-gray-700">FeedbackResult component stub</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600">{markdown}</pre>
          </div>
        ) : (
          <p className="text-sm text-gray-600">FeedbackResult component stub</p>
        )}
      </div>

      {exercises.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {exercises.map((ex, idx) => (
            <div key={`${ex.title}-${idx}`} className="rounded-md border border-gray-100 p-3 text-xs text-gray-700">
              <div className="font-medium text-gray-900">{ex.title}</div>
              {ex.rationale ? <div className="mt-1 text-gray-600">{ex.rationale}</div> : null}
              <a href={ex.url} className="mt-2 inline-block text-indigo-600 hover:underline" target="_blank" rel="noreferrer">
                Open
              </a>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default FeedbackResult
