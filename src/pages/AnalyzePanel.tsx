import { useState } from 'react'
import UploadArea from '../components/UploadArea'
import AnalysisProgress from '../components/AnalysisProgress'
import FeedbackResult from '../components/FeedbackResult'
import { analyzeVideo } from '../../src/services/analyzeVideo'

type ViewState = 'idle' | 'analyzing' | 'done' | 'error'

function AnalyzePanel() {
  const [state, setState] = useState<ViewState>('idle')
  const [markdown, setMarkdown] = useState<string | undefined>()
  const [exercises, setExercises] = useState<Array<{ title: string; url: string; thumbnail?: string; rationale?: string }>>([])
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
      <UploadArea onFileSelected={onFileSelected} accept="video/mp4,video/quicktime" />

      {state === 'analyzing' && <AnalysisProgress message="Analyzing video... This will take a moment." />}

      {state === 'done' && (
        <FeedbackResult markdown={markdown} exercises={exercises} />
      )}

      {state === 'error' && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {notHandballMessage ?? error}
        </div>
      )}
    </div>
  )
}

export default AnalyzePanel
