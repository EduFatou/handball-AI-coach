import { useCallback, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'

export type UploadAreaProps = {
  onFileSelected?: (file: File) => void
  accept?: string
  disabled?: boolean
}

const DEFAULT_ACCEPT = 'video/mp4,video/quicktime'
const MAX_MB = 25

function isSupportedVideo(file: File): boolean {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  const isByMime = type === 'video/mp4' || type === 'video/quicktime'
  const isByExt = name.endsWith('.mp4') || name.endsWith('.mov')
  return isByMime || isByExt
}

async function generateThumbnailFromVideo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = url
    video.crossOrigin = 'anonymous'

    const cleanup = () => {
      URL.revokeObjectURL(url)
    }

    const onError = () => {
      cleanup()
      reject(new Error('Unable to generate thumbnail'))
    }

    video.addEventListener('error', onError)

    video.addEventListener('loadeddata', () => {
      // Seek a tiny bit to ensure we can grab a frame
      const targetTime = Math.min(0.2, video.duration || 0.2)

      const capture = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 360
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            throw new Error('Canvas 2D context unavailable')
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          cleanup()
          resolve(dataUrl)
        } catch (err) {
          cleanup()
          reject(err)
        }
      }

      if (Number.isFinite(targetTime) && targetTime > 0) {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked)
          capture()
        }
        video.addEventListener('seeked', onSeeked)
        try {
          video.currentTime = targetTime
        } catch {
          // Some browsers may not allow immediate seek; fallback
          capture()
        }
      } else {
        capture()
      }
    })
  })
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
}

function UploadArea({ onFileSelected, accept = DEFAULT_ACCEPT, disabled = false }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)

  const instructions = useMemo(
    () => `Click to upload or drag & drop a video (MP4 or MOV) — Max ${MAX_MB} MB`,
    []
  )

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return
      setError(null)

      if (!isSupportedVideo(file)) {
        setSelectedFile(null)
        setThumbnail(null)
        setError('Unsupported file. Please choose an MP4 or MOV video.')
        return
      }

      const sizeMb = file.size / (1024 * 1024)
      if (sizeMb > MAX_MB) {
        setSelectedFile(null)
        setThumbnail(null)
        setError(`File is too large (${sizeMb.toFixed(1)} MB). Please select a file under ${MAX_MB} MB.`)
        return
      }

      setSelectedFile(file)
      try {
        const thumb = await generateThumbnailFromVideo(file)
        setThumbnail(thumb)
      } catch {
        // Fallback: no thumbnail, but keep file
        setThumbnail(null)
      }
      if (onFileSelected) onFileSelected(file)
    },
    [onFileSelected]
  )

  const onInputChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      await handleFile(file)
      // Reset input so selecting the same file again still triggers change
      if (inputRef.current) inputRef.current.value = ''
    },
    [handleFile]
  )

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(true)
  }, [disabled])

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0] ?? null
    await handleFile(file)
  }, [disabled, handleFile])

  const onClick = useCallback(() => {
    if (disabled) return
    inputRef.current?.click()
  }, [disabled])

  return (
    <section
      className={[
        'relative p-0 text-white transition-all duration-300 ease-out',
        disabled ? 'opacity-50' : '',
        isDragging ? 'scale-[1.01]' : '',
      ].join(' ')}
      aria-disabled={disabled}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        {!selectedFile && (
          <button
            type="button"
            onClick={onClick}
            className={[
              'group relative w-full overflow-hidden rounded-2xl border px-8 py-14 md:py-16 text-white shadow-[0_4px_28px_-8px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out backdrop-blur-md',
              disabled
                ? 'cursor-not-allowed border-white/10 bg-white/5'
                : 'cursor-pointer border-white/15 bg-white/5 hover:border-[#ff8ca6]/50 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.15)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff8ca6]/30 active:scale-[0.985]'
            ].join(' ')}
            aria-label="Upload video"
            disabled={disabled}
          >
            {/* Subtle animated overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.25)_0%,transparent_60%)] opacity-40 mix-blend-overlay" />
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-60 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)] animate-[pulse_3s_ease-in-out_infinite]" />
            
            <div className="relative flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#ff8ca6]/30 via-[#ffcf70]/30 to-[#a347ff]/30 blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-90" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-inset ring-white/15 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_0_4px_rgba(255,255,255,0.08)]">
                  <svg 
                    aria-hidden="true"
                    className="h-8 w-8 text-white/80 transition-all duration-300 group-hover:scale-110 group-hover:text-white"
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-3">
                <span className="text-lg font-semibold tracking-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                  Drop or select a training clip
                </span>
                <p className="text-sm text-white/70 max-w-sm">
                  {instructions}
                </p>
                <div className="flex items-center justify-center gap-3 text-[11px] font-medium tracking-wide text-white/50">
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    MP4
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    MOV
                  </span>
                </div>
              </div>
            </div>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onInputChange}
          className="hidden"
          aria-hidden="true"
          disabled={disabled}
        />

        {error && (
          <div className="w-full rounded-xl border border-red-400/40 bg-gradient-to-br from-red-600/20 via-red-500/15 to-red-400/10 p-4 backdrop-blur-sm shadow-[0_2px_16px_-4px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/30 ring-1 ring-inset ring-white/10">
                <svg className="h-4 w-4 text-red-100" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <p role="alert" className="text-sm font-medium text-red-100/90">{error}</p>
            </div>
          </div>
        )}

        {selectedFile && (
          <div className="w-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-6 shadow-[0_4px_28px_-10px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {thumbnail ? (
                <div className="relative self-center sm:self-auto">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#ff8ca6]/30 via-[#ffcf70]/30 to-[#a347ff]/30 blur-md opacity-30" />
                  <img
                    src={thumbnail}
                    alt="Video thumbnail"
                    className="relative h-24 w-40 flex-shrink-0 rounded-xl object-cover shadow-lg ring-1 ring-white/10"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-40 flex-shrink-0 items-center justify-center self-center rounded-xl bg-white/10 text-xs font-medium text-white/60 ring-1 ring-white/10 shadow-inner sm:self-auto">
                  <div className="text-center">
                    <svg className="mx-auto h-6 w-6 mb-1 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    No preview
                  </div>
                </div>
              )}
              
              <div className="min-w-0 max-w-full flex-1 self-center space-y-2 text-center sm:self-auto sm:text-left">
                <div className="space-y-1">
                  <p className="truncate text-lg font-semibold text-white" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-white/60 sm:justify-start">
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {formatBytes(selectedFile.size)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex w-full flex-col items-center gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:flex-nowrap sm:justify-end">
                <button
                  type="button"
                  className="group relative w-28 overflow-hidden rounded-xl bg-gradient-to-r from-[#8f2668] to-[#e5204c] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl hover:shadow-[#8f2668]/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8f2668]/30 active:translate-y-0 active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-lg disabled:hover:translate-y-0 disabled:hover:scale-100"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled}
                  aria-label="Replace selected video"
                >
                  <span className="relative z-10">Replace</span>
                  {/* Shine sweep */}
                  <div className="absolute inset-0 -translate-x-full skew-x-[-12deg] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0" />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
                </button>
                <button
                  type="button"
                  className="group relative w-28 overflow-hidden rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 shadow-sm backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:border-red-400/60 hover:bg-red-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400/30 active:translate-y-0 active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm disabled:hover:translate-y-0 disabled:hover:scale-100"
                  onClick={() => {
                    setSelectedFile(null)
                    setThumbnail(null)
                    setError(null)
                  }}
                  disabled={disabled}
                >
                  <span className="relative z-10">Clear</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default UploadArea
