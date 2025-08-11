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
        'rounded-lg border border-dashed p-6 text-gray-700 transition-colors',
        disabled ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-gray-50',
        isDragging ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300',
      ].join(' ')}
      aria-disabled={disabled}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        {!selectedFile && (
          <button
            type="button"
            onClick={onClick}
            className={[
              'w-full rounded-lg border-2 px-4 py-10 text-gray-700 shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:scale-105 hover:shadow-md hover:border-[#8f2668] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8f2668]',
              disabled ? 'cursor-not-allowed border-gray-200 bg-white disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-sm' : 'cursor-pointer bg-white',
            ].join(' ')}
            aria-label="Upload video"
            disabled={disabled}
          >
            <div className="flex flex-col items-center gap-2">
              <svg aria-hidden="true" className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 7.5 12 3m0 0 4.5 4.5M12 3v12"
                />
              </svg>
              <span className="text-sm font-medium">Click to upload or drag & drop</span>
              <span className="text-xs text-gray-500">{instructions}</span>
              <span className="sr-only">Accepted types: MP4 or MOV</span>
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
          <p role="alert" className="text-sm text-red-600">{error}</p>
        )}

        {selectedFile && (
          <div className="mt-2 w-full rounded-lg border bg-white p-3 text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Video thumbnail"
                  className="h-20 w-32 flex-shrink-0 rounded object-cover self-center sm:self-auto"
                />
              ) : (
                <div className="flex h-20 w-32 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-500 self-center sm:self-auto">
                  No thumbnail
                </div>
              )}
              <div className="min-w-0 max-w-full flex-1 self-center overflow-hidden text-center sm:self-auto sm:text-left">
                <p className="truncate text-sm font-medium text-gray-900" title={selectedFile.name}>{selectedFile.name}</p>
                <p className="truncate text-xs text-gray-500">{formatBytes(selectedFile.size)}</p>
              </div>
              <div className="flex w-full flex-col items-center gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-nowrap sm:justify-end">
                <button
                  type="button"
                  className="w-22 rounded-sm bg-[#EB2F4B] px-3 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#EB2F4B] active:translate-y-0 active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm disabled:hover:translate-y-0 disabled:hover:scale-100"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled}
                >
                  Replace
                </button>
                <button
                  type="button"
                  className="w-22 rounded-sm bg-[#EB2F4B] px-3 py-2 text-sm font-semibold text-white shadow-sm transition duration-150 ease-out hover:-translate-y-0.5 hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#EB2F4B] active:translate-y-0 active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm disabled:hover:translate-y-0 disabled:hover:scale-100"
                  onClick={() => {
                    setSelectedFile(null)
                    setThumbnail(null)
                    setError(null)
                  }}
                  disabled={disabled}
                >
                  Clear
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
