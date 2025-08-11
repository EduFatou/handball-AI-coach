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
    <div className="space-y-4">
      <section className="text-center space-y-3">
        <h2 className="text-xl md:text-3xl font-semibold text-[#8f2668]">Handball Video Analysis</h2>
        <p className="mx-auto max-w-3xl text-base md:text-lg text-gray-800">
          Upload a handball training clip and receive clear, coach-style feedback.
        </p>
        <span className="font-semibold text-[#8f2668] text-lg">How it works:</span>
        <p className="my-2 mx-auto max-w-3xl text-base md:text-lg text-gray-800">
          When running locally, the analysis infers the focus area from the file name.
          Because a Gemini API key is configured here, <strong>you’ll receive real AI model feedback</strong> after the video is analyzed.
          </p>
          <p className="my-2 mx-auto max-w-3xl text-base md:text-lg text-gray-800">
          <strong>It actually works, and feels amazing.</strong>
          </p>
      </section>
      <UploadArea onFileSelected={onFileSelected} accept="video/mp4,video/quicktime" />

      {state === 'analyzing' && (
        <div className="flex justify-center">
          <AnalysisProgress message="Analyzing video... This will take a moment." />
        </div>
      )}

      {state === 'done' && (
        <FeedbackResult markdown={markdown} exercises={exercises} />
      )}

      {state === 'error' && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {notHandballMessage ?? error}
        </div>
      )}
    </div>
  )
}

export default AnalyzePanel
