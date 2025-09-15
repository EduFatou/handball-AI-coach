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
      className="group relative block h-full overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/30 shadow-lg transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#8f2668]/10 hover:border-[#8f2668]/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8f2668]/20 will-change-transform transform-gpu"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10" />
        
        {derivedThumbnail ? (
          <img 
            src={derivedThumbnail} 
            alt={title} 
            className="h-full w-full origin-center object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Video Preview</span>
            </div>
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 z-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
            <svg className="h-6 w-6 text-[#8f2668] ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight group-hover:text-[#8f2668] transition-colors duration-300">
            {title}
          </h3>
          {description ? (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{description}</p>
          ) : null}
        </div>
        
        {typeof durationMinutes === 'number' ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{durationMinutes} min</span>
          </div>
        ) : null}
        
        <div className="pt-2">
          <span className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#8f2668] to-[#e5204c] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-[#8f2668]/25">
            <span className="relative z-10">View exercise</span>
            <svg className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 transform -skew-x-12 translate-x-full group-hover:translate-x-0" />
          </span>
        </div>
      </div>
    </a>
  )
}

export default ExerciseCard
