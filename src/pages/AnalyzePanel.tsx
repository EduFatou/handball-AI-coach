import { useState } from 'react'
import UploadArea from '../components/UploadArea'
import AnalysisProgress from '../components/AnalysisProgress'
import FeedbackResult from '../components/FeedbackResult'
import { analyzeVideo } from '../services/analyzeVideo'

type ViewState = 'idle' | 'analyzing' | 'done' | 'error'

function AnalyzePanel() {
  const [state, setState] = useState<ViewState>('idle')
  const [markdown, setMarkdown] = useState<string | undefined>()
  const [exercises, setExercises] = useState<Array<{ title: string; url: string; thumbnail?: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [notHandballMessage, setNotHandballMessage] = useState<string | null>(null)

  async function onFileSelected(file: File) {
    setError(null)
    setNotHandballMessage(null)
    setState('analyzing')
    try {
      const result = await analyzeVideo(file)
      if ('notHandball' in result && result.notHandball) {
        setNotHandballMessage(result.message)
        setState('error')
      } else {
        setMarkdown(result.markdown)
        setExercises(result.exercises)
        setState('done')
      }
    } catch {
      setError('Something went wrong while analyzing. Please try again.')
      setState('error')
    }
  }

  return (
    <div className="space-y-10 md:space-y-14">
      <section className="relative overflow-hidden">
        <div className="relative space-y-6 md:space-y-8">
          <h1 className="text-center mx-auto max-w-4xl text-3xl md:text-5xl font-bold text-white/90 leading-tight">
            AI-powered Handball Technique Insight
          </h1>
          <div className="text-center mx-auto max-w-3xl space-y-3 text-white/80 text-base md:text-xl leading-relaxed">
            <p className="font-medium text-white/80">
            Unlock your potential receiving coach-grade insights to elevate your game.
            </p>
          </div>
        </div>
      </section>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-6 md:px-8 py-7 md:py-8 shadow-[0_6px_30px_-8px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.8)_0%,transparent_60%)]" />
        <div className="relative">
          <UploadArea onFileSelected={onFileSelected} accept="video/mp4,video/quicktime" />
        </div>
      </div>

      {state === 'analyzing' && (
        <div className="flex justify-center">
          <AnalysisProgress message="Analyzing video... This will take a moment." />
        </div>
      )}

      {state === 'done' && (
        <FeedbackResult markdown={markdown} exercises={exercises} />
      )}

      {state === 'error' && (
        <div className="relative overflow-hidden rounded-3xl border border-red-400/30 bg-gradient-to-br from-red-500/25 via-red-500/15 to-red-400/10 backdrop-blur-xl p-6 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.6)_0%,transparent_65%)]" />
          <div className="relative flex items-start gap-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-400/30 ring-1 ring-inset ring-white/15">
              <svg className="h-5 w-5 text-red-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-red-100 tracking-wide uppercase text-xs">Analysis Error</h3>
              <p className="text-sm leading-relaxed text-red-50/80">{notHandballMessage ?? error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyzePanel
