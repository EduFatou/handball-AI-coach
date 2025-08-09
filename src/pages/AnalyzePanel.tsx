import UploadArea from '../components/UploadArea'
import AnalysisProgress from '../components/AnalysisProgress'
import FeedbackResult from '../components/FeedbackResult'

function AnalyzePanel() {
  return (
    <div className="space-y-4">
      <UploadArea />
      <AnalysisProgress />
      <FeedbackResult />
    </div>
  )
}

export default AnalyzePanel
