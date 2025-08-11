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
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group block h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#EB2F4B] will-change-transform transform-gpu"
    >
      <div className="aspect-[16/9] w-full overflow-hidden">
        {derivedThumbnail ? (
          <img src={derivedThumbnail} alt={title} className="h-full w-full origin-center object-cover" />
        ) : (
          <div className="h-full w-full bg-gray-100" />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-gray-600">{description}</p>
        ) : null}
        {typeof durationMinutes === 'number' ? (
          <p className="mt-1 text-[11px] text-gray-500">Duration: {durationMinutes} min</p>
        ) : null}
        <span className="mt-3 inline-flex rounded-sm bg-[#EB2F4B] px-3 py-2 text-xs font-semibold text-white shadow-sm transition duration-150 ease-out group-hover:-translate-y-0.5 group-hover:shadow-md">
          View exercise
        </span>
      </div>
    </a>
  )
}

export default ExerciseCard
