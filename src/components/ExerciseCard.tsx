export type ExerciseCardProps = {
  title: string
  url: string
  thumbnail?: string
  description?: string
  durationMinutes?: number
}

function ExerciseCard({ title, url, thumbnail, description, durationMinutes }: ExerciseCardProps) {
  const getYouTubeId = (link: string): string | null => {
    try {
      const urlObj = new URL(link)
      const host = urlObj.hostname

      if (host === 'youtu.be' && urlObj.pathname.length > 1) {
        return urlObj.pathname.slice(1)
      }

      if (host.includes('youtube.com')) {
        if (urlObj.pathname.startsWith('/watch')) {
          return urlObj.searchParams.get('v')
        }
        if (urlObj.pathname.startsWith('/shorts/')) {
          return urlObj.pathname.split('/')[2] || null
        }
        if (urlObj.pathname.startsWith('/embed/')) {
          return urlObj.pathname.split('/')[2] || null
        }
      }
    } catch {
      // ignore parse errors
    }
    return null
  }

  const derivedThumbnail = (() => {
    if (thumbnail) return thumbnail
    const videoId = getYouTubeId(url)
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined
  })()
  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {derivedThumbnail ? (
        <img src={derivedThumbnail} alt={title} className="h-32 w-full object-cover" />
      ) : (
        <div className="h-32 w-full bg-gray-100" />
      )}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-gray-600">{description}</p>
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
