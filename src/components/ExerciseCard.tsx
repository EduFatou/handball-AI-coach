export type ExerciseCardProps = {
  title: string
  url: string
  thumbnail?: string
  rationale?: string
  description?: string
  durationMinutes?: number
}

function ExerciseCard({ title, url, thumbnail, rationale, description, durationMinutes }: ExerciseCardProps) {

  const learnLogoUrl: string = new URL('../assets/Learn Handball logo.svg', import.meta.url).toString()

  const fallbackThumb = thumbnail || learnLogoUrl
  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {fallbackThumb ? (
        <img src={fallbackThumb} alt={title} className="h-32 w-full object-cover" />
      ) : (
        <div className="h-32 w-full bg-gray-100" />
      )}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-gray-600">{description}</p>
        ) : null}
        {rationale ? (
          <p className="mt-1 text-xs text-gray-600">{rationale}</p>
        ) : null}
        {typeof durationMinutes === 'number' ? (
          <p className="mt-1 text-[11px] text-gray-500">Duration: {durationMinutes} min</p>
        ) : null}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-xs font-medium text-indigo-600 hover:underline"
        >
          View exercise
        </a>
      </div>
    </article>
  )
}

export default ExerciseCard
